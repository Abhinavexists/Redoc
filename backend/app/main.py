from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, documents, query
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
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
    allow_origins=["*"], # Allows all origins (Will change later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TimeoutMiddleware)

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["*"]
)

app.include_router(upload.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(query.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API is running"}