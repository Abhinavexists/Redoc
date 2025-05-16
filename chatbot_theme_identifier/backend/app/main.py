from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload

app = FastAPI(title="Theme Identification Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (Will change later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API is running"}

