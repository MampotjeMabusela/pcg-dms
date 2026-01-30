"""
Mambo chatbot: helps users use the DMS, can think (AI/LLM), learn (store interactions), and automate (return actions).
"""
import json
import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatAction(BaseModel):
    type: str  # "navigate" | "open_upload" | "open_reports" | "open_approvals" | "open_insights"
    path: str | None = None
    label: str | None = None


class ChatResponse(BaseModel):
    reply: str
    action: ChatAction | None = None


# In-memory store for learning: last N exchanges (could be replaced with DB)
_learned: list[dict] = []
_MAX_LEARNED = 500


def _learn(user_msg: str, bot_reply: str, action: dict | None):
    _learned.append({"user": user_msg, "bot": bot_reply, "action": action})
    if len(_learned) > _MAX_LEARNED:
        _learned.pop(0)


def _rule_based_reply(message: str) -> tuple[str, ChatAction | None]:
    """Fallback when no OpenAI: intent matching and helpful replies. Learns from patterns."""
    m = message.lower().strip()
    # Check learned similar questions first (simple keyword overlap)
    for entry in reversed(_learned[-50:]):
        if len(set(m.split()) & set(entry["user"].lower().split())) >= 2:
            return entry["bot"], ChatAction(**entry["action"]) if entry.get("action") else None

    # Upload
    if any(w in m for w in ["upload", "add document", "submit", "invoice", "credit note"]):
        return (
            "To upload an invoice or credit note: go to **Upload** in the menu, choose a PDF or image file, then click Upload. "
            "The system will extract vendor, amount, and other details automatically.",
            ChatAction(type="navigate", path="/upload", label="Go to Upload"),
        )
    # Reports
    if any(w in m for w in ["report", "export", "pdf", "excel", "filter", "spend"]):
        return (
            "**Reports** let you filter by date, vendor, status, and amount, and export as CSV, Excel, or PDF. "
            "Open **Reports** from the menu, set your filters, and use the export buttons.",
            ChatAction(type="navigate", path="/reports", label="Open Reports"),
        )
    # Approvals
    if any(w in m for w in ["approv", "pending", "review", "reject", "workflow", "step"]):
        return (
            "The approval workflow has **3 steps**: Reviewer → Manager → Finance/Admin. "
            "Go to **Approvals** to see pending documents and Approve or Reject. Your role determines which step you can act on.",
            ChatAction(type="navigate", path="/approvals", label="Open Approvals"),
        )
    # Insights
    if any(w in m for w in ["insight", "chart", "graph", "trend", "dashboard", "analytics"]):
        return (
            "**AI Insights** shows document counts, pie and line charts, spending insights, and anomalies. "
            "Use it together with Reports for a full picture.",
            ChatAction(type="navigate", path="/insights", label="Open AI Insights"),
        )
    # Dashboard / home
    if any(w in m for w in ["home", "dashboard", "main", "overview"]):
        return (
            "The **Dashboard** shows an overview of documents, pending count, duplicates, recent documents, and quick links to Upload, Approvals, Reports, and AI Insights.",
            ChatAction(type="navigate", path="/", label="Go to Dashboard"),
        )
    # Help / general
    if any(w in m for w in ["help", "how", "what", "where", "start", "use"]):
        return (
            "I'm **Mambo**, your DMS assistant. You can:\n"
            "• **Upload** invoices or credit notes (PDF/images)\n"
            "• **Approvals** – 3-step workflow (Reviewer, Manager, Finance/Admin)\n"
            "• **Reports** – filter and export CSV, Excel, PDF\n"
            "• **AI Insights** – charts, trends, spending insights\n"
            "Ask me things like: 'How do I upload?', 'Where are reports?', 'Explain approvals'.",
            None,
        )
    # Greeting
    if any(w in m for w in ["hi", "hello", "hey", "mambo"]):
        return (
            "Hi! I'm Mambo. I can help you use this Document Management System—uploading, approvals, reports, and insights. What would you like to do?",
            None,
        )
    # Default: learn and suggest
    return (
        "I'm not sure about that. Try: 'How do I upload?', 'Where are reports?', or 'Explain the approval workflow.' I learn from your questions to get better!",
        None,
    )


def _openai_reply(message: str, history: list[ChatMessage]) -> tuple[str, ChatAction | None]:
    """Use OpenAI for thinking/reasoning when API key is set."""
    if not settings.OPENAI_API_KEY:
        return _rule_based_reply(message)

    system = """You are Mambo, a helpful chatbot for a Document Management System (DMS). You help users:
- Upload invoices and credit notes (PDF or images)
- Use the 3-step approval workflow (Reviewer, Manager, Finance/Admin)
- Run reports with filters (date, vendor, status, amount) and export CSV, Excel, PDF
- Use AI Insights (charts, trends, spending, anomalies)

Be concise and friendly. If the user wants to do something specific, end your reply with a single line in this exact format:
ACTION: navigate /path
Examples: ACTION: navigate /upload   or   ACTION: navigate /reports
Only output ACTION when it clearly helps (e.g. user asks to upload, see reports, approvals, insights). Otherwise omit ACTION."""

    try:
        import openai
        client = getattr(openai, "OpenAI", None)
        if client:
            oai = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            messages = [{"role": "system", "content": system}]
            for h in history[-10:]:
                messages.append({"role": h.role, "content": h.content})
            messages.append({"role": "user", "content": message})
            resp = oai.chat.completions.create(model="gpt-4o-mini", messages=messages, temperature=0.3)
            reply = resp.choices[0].message.content or ""
        else:
            # Older openai API
            openai.api_key = settings.OPENAI_API_KEY
            messages = [{"role": "system", "content": system}]
            for h in history[-10:]:
                messages.append({"role": h.role, "content": h.content})
            messages.append({"role": "user", "content": message})
            resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=messages, temperature=0.3)
            reply = resp.choices[0].message.content or ""
    except Exception:
        return _rule_based_reply(message)

    # Parse ACTION: navigate /path
    action = None
    if "ACTION:" in reply:
        reply, rest = reply.split("ACTION:", 1)
        reply = reply.strip()
        match = re.search(r"navigate\s+(\S+)", rest.strip(), re.I)
        if match:
            path = match.group(1).strip()
            action = ChatAction(type="navigate", path=path, label=f"Go to {path}")

    return reply, action


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest, current_user=Depends(get_current_user)):
    """Send a message to Mambo; get a reply and optional action to automate (e.g. navigate)."""
    reply, action = _openai_reply(req.message, req.history)
    _learn(req.message, reply, action.model_dump() if action else None)
    return ChatResponse(reply=reply, action=action)
