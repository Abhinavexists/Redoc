import re
import logging
from typing import List, Dict, Any, Literal
import google.generativeai as genai
from collections import defaultdict
from app.config import settings
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from app.config import SessionLocal
from app.services.vectorstore.query_processor import process_query

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)
genai.model_name = settings.MODEL_NAME

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ThemeIdentifier:
    def __init__(self, model_name: str = settings.MODEL_NAME):
        self.model_name = model_name
        logger.info(f"Initializing ThemeIdentifier with model: {model_name}")
        try:
            self.model = genai.GenerativeModel(model_name)
            logger.info("Successfully initialized Gemini model")
        except Exception as e:
            logger.error(f"Error initializing Gemini model: {str(e)}")
            raise
    
    def identify_themes(self, query_results: List[Dict[str, Any]], original_query: str) -> Dict:
        logger.info(f"Identifying themes for query: {original_query}")
        logger.info(f"Number of query results: {len(query_results)}")
        
        if not query_results:
            logger.warning("No query results provided, returning empty themes")
            return {
                "themes": [],
                "message": "No documents found to identify themes."
            }
            
        context = self._prepare_context(query_results, original_query)
        logger.debug(f"Prepared context: {context[:200]}...")
        
        themes = self._generate_themes(context)
        logger.info(f"Generated themes: {themes}")
        
        return themes
    
    def _prepare_context(self, query_results: List[Dict[str, Any]], original_query: str) -> str:
        context = f"QUERY: {original_query}\n\n"
        context += "DOCUMENT EXCERPTS:\n\n"
        
        grouped_results = defaultdict(list)
        for result in query_results:
            grouped_results[result["filename"]].append(result["matched_text"])
        
        for i, (filename, texts) in enumerate(grouped_results.items()):
            doc_id = f"DOC{i+1:03d}"
            context += f"--- {doc_id} ({filename}) ---\n"
            for text in texts:
                clean_text = re.sub(r'\s+', ' ', text).strip()
                context += f"{clean_text}\n\n"
        
        return context
    
    def _generate_themes(self, context: str) -> Dict:
        logger.info("Generating themes using Gemini")
        prompt = f"""
        You are a domain expert specializing in document analysis and thematic synthesis. Your task is to analyze the following excerpts from multiple documents and extract key recurring themes.

        Document Context:
        {context}

        Instructions:
        1. Identify **2 to 5 distinct themes** that are **present across multiple documents**.
        2. For each identified theme, include:
            - A clear and concise **theme name**.
            - A **summary** that explains the essence of the theme.
            - A list of **document IDs** (e.g., "DOC001", "DOC003") where this theme is observed.
            - Specific **evidence** or key points from the documents that support the theme (you may quote or paraphrase relevant portions).

        Response Format:
        Return your analysis as a **valid JSON object** structured like this:
        {{
        "themes": [
            {{
            "theme_name": "Concise Title for Theme 1",
            "summary": "Brief explanation of the theme",
            "supporting_documents": ["DOC001", "DOC003"],
            "evidence": "Relevant quotes or summaries that illustrate this theme"
            }},
            // Additional theme objects...
        ]
        }}

        Important:
        - Only return the JSON object — **no extra text or explanation outside of the JSON**.
        - Ensure the JSON is properly formatted and can be parsed directly.
        """

        try:
            logger.info("Sending request to Gemini API")
            response = self.model.generate_content(prompt)
            logger.info("Received response from Gemini API")
            
            response_text = response.text
            logger.debug(f"Raw response: {response_text[:200]}...")
            
            response_text = re.sub(r'^```json\s*|\s*```$', '', response_text.strip())
            response_text = re.sub(r'^```\s*|\s*```$', '', response_text.strip())
            
            import json
            try:
                themes = json.loads(response_text)
                logger.info(f"Successfully parsed JSON with {len(themes.get('themes', []))} themes")
                return themes
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                return {
                    "themes": [],
                    "error": "Failed to parse themes from model response",
                    "raw_response": response_text
                }
                
        except Exception as e:
            logger.error(f"Error generating themes: {str(e)}")
            return {
                "themes": [],
                "error": f"Error generating themes: {str(e)}"
            }

def identify_themes(query_results: List[Dict[str, Any]], original_query: str) -> Dict:
    logger.info(f"identify_themes called with query: {original_query} and {len(query_results)} results")
    theme_identifier = ThemeIdentifier()
    return theme_identifier.identify_themes(query_results, original_query)

@router.get("/themes/{theme_id}/citations")
async def get_citations_for_theme(
    theme_id: int = Path(..., title="The ID of the theme"),
    citation_level: Literal["document", "paragraph", "sentence"] = Query("paragraph", title="Citation granularity level"),
    db: Session = Depends(get_db)
):
    """
    Get granular citations for a specific theme
    """
    try:
        # This is a simplified implementation - in a production system,
        # you would retrieve citations from a database where theme-document
        # relationships are stored. For now, we'll return an example.
        
        # Sample theme citations
        sample_citations = [
            {
                "theme_id": theme_id,
                "document_id": 1,
                "citation_type": citation_level,
                "reference_id": f"sample-id-1",
                "content": "This is a sample citation text for this theme.",
                "relevance": 0.85,
                "citation": "document1.pdf, Page 1, Para 2",
                "paragraph_index": 1 if citation_level in ["paragraph", "sentence"] else None,
                "sentence_index": 3 if citation_level == "sentence" else None
            },
            {
                "theme_id": theme_id,
                "document_id": 2,
                "citation_type": citation_level,
                "reference_id": f"sample-id-2",
                "content": "Another supporting evidence for this theme.",
                "relevance": 0.78,
                "citation": "document2.pdf, Page 3, Para 5",
                "paragraph_index": 4 if citation_level in ["paragraph", "sentence"] else None,
                "sentence_index": 2 if citation_level == "sentence" else None
            }
        ]
        
        # If citation_level is "sentence", add sentence information
        if citation_level == "sentence":
            for citation in sample_citations:
                if "citation" in citation and citation.get("sentence_index") is not None:
                    citation["citation"] += f", Sentence {citation['sentence_index']}"
        
        return {
            "theme_id": theme_id,
            "citation_level": citation_level,
            "citations": sample_citations
        }
    
    except Exception as e:
        logger.error(f"Error retrieving theme citations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving theme citations: {str(e)}") 