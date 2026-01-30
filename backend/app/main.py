from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routes import auth, documents, reports, chat
from .config import settings

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


@app.get("/")
def root():
    return {"message": "Document Management System API"}
