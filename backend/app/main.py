import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.rag import load_index, load_embeddings
from app.core.law_search import load_laws

app = FastAPI(title="SmartOD", description="智慧公文系統")


def _init_rag():
    load_index()
    load_embeddings()
    load_laws()


# Load RAG indices in background thread at startup
threading.Thread(target=_init_rag, daemon=True).start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://192.168.88.224:5173",
        "http://192.168.88.224:3000",
        "http://100.76.173.64:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
