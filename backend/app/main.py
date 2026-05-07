import threading
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.rag import load_index, load_embeddings, load_embedding_gemma_model
from app.core.law_search import load_laws

app = FastAPI(title="SmartOD", description="智慧公文系統")


def _init_rag():
    load_index()
    load_embeddings()
    load_laws()
    load_embedding_gemma_model()


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


@app.middleware("http")
async def smartod_uid_middleware(request: Request, call_next):
    # Skip CORS preflight — every OPTIONS would otherwise mint a throwaway uuid.
    # The actual request that follows still goes through this branch and gets a uid.
    if request.method == "OPTIONS":
        return await call_next(request)

    uid = request.cookies.get("smartod_uid", "")
    is_new = not uid
    if is_new:
        uid = str(uuid.uuid4())
    request.state.uid = uid
    response = await call_next(request)
    if is_new:
        response.set_cookie(
            key="smartod_uid",
            value=uid,
            httponly=True,
            samesite="lax",
            max_age=63072000,  # 2 years
            secure=False,  # nginx is plain HTTP currently — flip to True after HTTPS
        )
    return response


app.include_router(router, prefix="/api")
