from fastapi import APIRouter, Query
from app.services.vectorstore.query_engine import query_documents

router = APIRouter()

@router.get("/query")
def query_handler(q: str = Query(..., description="User questions")):
    results = query_documents(q)
    return results
