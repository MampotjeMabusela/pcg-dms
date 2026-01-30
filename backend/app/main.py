import json
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routes import auth, documents, reports, chat
from .config import settings

# #region agent log
_DEBUG_LOG = r"c:\Users\mampo\OneDrive\Documents\dms-project\.cursor\debug.log"
def _dlog(loc, msg, data, hid="H1,H3"):
    try:
        with open(_DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps({"location": loc, "message": msg, "data": data, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "hypothesisId": hid}) + "\n")
    except Exception:
        pass
# #endregion

app = FastAPI(title="PCG DMS")

# Configure CORS (use CORS_ORIGINS env var in production for your Vercel URL)
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables (for prototype)
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(reports.router)
app.include_router(chat.router)


@app.on_event("startup")
def _on_startup():
    # #region agent log
    _dlog("main.py:startup", "backend started", {"cors_origins": ["http://localhost:5173", "http://localhost:3000"]}, "H1,H3")
    # #endregion


@app.get("/")
def root():
    return {"message": "Document Management System API"}
