import google.generativeai as genai
from langchain.embeddings.base import Embeddings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set. Please set it in your .env file.")

genai.configure(api_key=api_key)

class GeminiEmbeddings(Embeddings):
    def __init__(self, model_name: str = "models/embedding-001"):
        self.model_name = model_name

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            response = genai.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document"
                )
            embeddings.append(response["embedding"])
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        response = genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="retrieval_query"
            )
        return response["embedding"]
    