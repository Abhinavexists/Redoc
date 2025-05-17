from fastapi import APIRouter, Query, Body
from app.services.vectorstore.query_engine import query_documents
from app.api.theme_identification import identify_themes
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/query")
def query_handler(q: str = Query(..., description="User questions"), 
                  enable_themes: Optional[bool] = Query(False, description="Whether to identify themes in results")):
    logger.info(f"Query handler called with query: {q}, enable_themes: {enable_themes}")
    
    results = query_documents(q)
    logger.info(f"Query returned {len(results)} results")
    
    if not results:
        logger.warning("No results found, returning empty response")
        return {
            "matches": results,
            "themes": []
        }
    
    if not enable_themes:
        logger.info("Theme identification not requested, returning only matches")
        return {
            "matches": results,
            "themes": []
        }
    
    logger.info("Identifying themes for query results")
    themes_data = identify_themes(results, q)
    logger.info(f"Theme identification complete: {themes_data}")
    
    return {
        "matches": results,
        "themes": themes_data
    }

@router.post("/identify-themes")
def identify_themes_handler(results: List[Dict[str, Any]] = Body(..., description="Query results to analyze"),
                           query: str = Body(..., description="Original query")):
    logger.info(f"identify_themes_handler called with query: {query} and {len(results)} results")
    themes_data = identify_themes(results, query)
    return themes_data
