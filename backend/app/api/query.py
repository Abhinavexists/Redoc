from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.services.vectorstore.query_processor import process_query
from app.services.theme_identification import identify_themes
from app.config import SessionLocal
from app.models.document import Document
from typing import List, Optional
from sqlalchemy.orm import Session
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    enable_themes: bool = False
    document_ids: Optional[List[int]] = None
    theme_count: int = 3
    relevance_threshold: float = 0.7
    advanced_mode: bool = False
    citation_level: str = "paragraph"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/query")
async def query_documents(
    request: QueryRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Process a query against the document database.
    """
    try:
        # Parse document_ids if provided
        selected_docs = None
        if request.document_ids:
            # Verify all document IDs exist
            selected_docs = db.query(Document).filter(Document.id.in_(request.document_ids)).all()
            if len(selected_docs) != len(request.document_ids):
                found_ids = [doc.id for doc in selected_docs]
                missing_ids = [id for id in request.document_ids if id not in found_ids]
                logger.warning(f"Some document IDs not found: {missing_ids}")
        
        logger.info(f"Processing query: '{request.query}'")
        logger.info(f"Parameters: enable_themes={request.enable_themes}, theme_count={request.theme_count}, " 
                   f"relevance_threshold={request.relevance_threshold}, advanced_mode={request.advanced_mode}")
        if selected_docs:
            logger.info(f"Selected document IDs: {[doc.id for doc in selected_docs]}")
        
        # Process the query
        matches = process_query(
            request.query, 
            document_ids=[doc.id for doc in selected_docs] if selected_docs else None,
            relevance_threshold=request.relevance_threshold,
            advanced_mode=request.advanced_mode
        )
        
        # Identify themes if enabled
        themes = None
        if request.enable_themes and matches:
            themes = identify_themes(matches, theme_count=request.theme_count)
        
        return {
            "query": request.query,
            "matches": matches,
            "themes": themes,
            "settings": {
                "enable_themes": request.enable_themes,
                "theme_count": request.theme_count if request.enable_themes else None,
                "relevance_threshold": request.relevance_threshold,
                "advanced_mode": request.advanced_mode,
                "selected_document_count": len(selected_docs) if selected_docs else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
