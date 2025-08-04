from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, documents, query, theme_identification
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from app.models.document import Base  
from app.config import engine

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

app = FastAPI(
    title="Theme Identification Chatbot",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://redoc.up.railway.app",
        "https://redoc-backend-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

app.add_middleware(TimeoutMiddleware)

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["*"]
)

app.include_router(upload.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(theme_identification.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API is running"}

Base.metadata.create_all(bind=engine)  # run it once only 