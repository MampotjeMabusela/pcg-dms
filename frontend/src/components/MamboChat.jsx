import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const QUICK_PROMPTS = [
  "How do I upload?",
  "Where are reports?",
  "Explain approvals",
  "Show AI Insights",
  "Go to Dashboard",
];

function MarkdownLike({ text }) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  while (remaining.length) {
    const bold = remaining.match(/\*\*([^*]+)\*\*/);
    const lineBreak = remaining.indexOf("\n");
    if (bold && (lineBreak === -1 || bold.index < lineBreak)) {
      if (bold.index > 0) parts.push(<span key={parts.length}>{remaining.slice(0, bold.index)}</span>);
      parts.push(<strong key={parts.length} className="font-semibold text-slate-800">{bold[1]}</strong>);
      remaining = remaining.slice(bold.index + bold[0].length);
    } else if (lineBreak >= 0) {
      parts.push(<span key={parts.length}>{remaining.slice(0, lineBreak)}</span>);
      parts.push(<br key={parts.length + "br"} />);
      remaining = remaining.slice(lineBreak + 1);
    } else {
      parts.push(<span key={parts.length}>{remaining}</span>);
      break;
    }
  }
  return <>{parts}</>;
}

export default function MamboChat() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "assistant", content: "Hi! I'm **Mambo**. I can help you use this Document Management System—uploading, approvals, reports, and AI insights. Ask me anything or pick a quick action below." },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const listRef = React.useRef(null);

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post("/chat/", { message: userMessage, history });
      const reply = res.data.reply;
      const action = res.data.action;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, action }]);
      if (action?.type === "navigate" && action?.path) {
        setTimeout(() => {
          navigate(action.path);
          setOpen(false);
        }, 800);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect. Check that you're logged in and the server is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg flex items-center justify-center font-semibold text-lg transition-transform hover:scale-105"
        aria-label="Open Mambo chat"
      >
        M
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-teal-600 text-white flex items-center justify-between">
            <span className="font-semibold">Mambo</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[320px] bg-slate-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-teal-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  <MarkdownLike text={m.content} />
                  {m.action?.label && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (m.action?.path) {
                            navigate(m.action.path);
                            setOpen(false);
                          }
                        }}
                        className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 hover:bg-teal-200"
                      >
                        {m.action.label}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500">
                  Mambo is thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-slate-200 bg-white">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mambo..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
