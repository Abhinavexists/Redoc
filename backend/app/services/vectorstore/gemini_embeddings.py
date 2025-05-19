import google.generativeai as genai
from langchain.embeddings.base import Embeddings
from typing import List
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

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
    