"""
Query processor for extracting information from documents.
This module handles document searching with filtering options and relevance thresholds.
"""

import logging
from typing import List, Dict, Any, Optional
import os
import json
import requests
from app.config import SessionLocal
from app.models.document import Document
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Get API key from environment variable
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OpenAI API key not found in environment, query processing will be limited")

def process_query(
    query: str, 
    document_ids: Optional[List[int]] = None, 
    relevance_threshold: float = 0.7,
    advanced_mode: bool = False
) -> List[Dict[str, Any]]:
    """
    Process a query against the document collection.
    
    Parameters:
    - query: The user's query string
    - document_ids: Optional list of document IDs to restrict the search to
    - relevance_threshold: Minimum relevance score (0.5-0.95) to include a match
    - advanced_mode: Use more sophisticated query processing for complex queries
    
    Returns:
    - List of document matches with extracted text and citation information
    """
    logger.info(f"Processing query: '{query}'")
    if document_ids:
        logger.info(f"Restricting search to document IDs: {document_ids}")
    
    # Get documents to search
    db = SessionLocal()
    try:
        if document_ids:
            documents = db.query(Document).filter(Document.id.in_(document_ids)).all()
            if not documents:
                logger.warning(f"No documents found for IDs: {document_ids}")
                return []
        else:
            documents = db.query(Document).all()
            
        if not documents:
            logger.warning("No documents available for search")
            return []
            
        logger.info(f"Searching across {len(documents)} documents")
        
        # Use OpenAI to extract information from the documents
        if OPENAI_API_KEY:
            matches = search_with_openai(query, documents, relevance_threshold, advanced_mode)
        else:
            # Fallback to simpler search if API key not available
            matches = basic_document_search(query, documents)
        
        logger.info(f"Found {len(matches)} relevant matches")
        return matches
        
    finally:
        db.close()

def search_with_openai(
    query: str, 
    documents: List[Document], 
    relevance_threshold: float,
    advanced_mode: bool
) -> List[Dict[str, Any]]:
    """
    Search documents using OpenAI's capabilities for better understanding.
    """
    # Prepare documents for search
    doc_contents = []
    for doc in documents:
        try:
            # Read the content from the file
            with open(doc.content_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            doc_contents.append({
                "id": doc.id,
                "filename": doc.filename,
                "content": content,
                "filetype": doc.filetype
            })
        except Exception as e:
            logger.error(f"Error reading document {doc.id}: {str(e)}")
    
    if not doc_contents:
        logger.warning("No document contents available for search")
        return []
    
    # Create a prompt for document search
    system_prompt = "You are a research assistant that helps find relevant information in documents."
    
    if advanced_mode:
        user_prompt = f"""I need to find information across multiple documents related to this query:
"{query}"

For each document, analyze the content and extract only the most relevant sections that directly answer the query.
Only include text that is truly relevant with a confidence level of at least {relevance_threshold * 100}%.

If a document doesn't contain relevant information, exclude it from results.

For each relevant document section, provide:
1. The document filename
2. The exact text that answers the query (keep it focused and concise)
3. Specify which paragraph/section number if possible
4. Rate the relevance from 0.5 to 1.0 (only include text with relevance >= {relevance_threshold})

Format as JSON:
[
  {{
    "id": document_id,
    "filename": "filename.pdf",
    "matched_text": "relevant text that directly answers the query...",
    "paragraph": paragraph_number_if_available,
    "relevance": relevance_score,
    "citation": "formatted citation for this source"
  }}
]

Only return the JSON array. Include at most 10 most relevant matches across all documents."""
    else:
        user_prompt = f"""Find relevant information in the following documents for this query:
"{query}"

Return only sections that are directly relevant to the query with a confidence of at least {relevance_threshold * 100}%.
Format as JSON:
[
  {{
    "id": document_id,
    "filename": "filename.pdf",
    "matched_text": "the relevant text extract...",
    "paragraph": paragraph_number_if_available,
    "relevance": relevance_score,
    "citation": "citation for this source"
  }}
]

Only return the JSON array. Include at most 10 most relevant matches."""
    
    # Send the documents content in chunks if needed
    matches = []
    chunk_size = 5  # Process 5 documents at a time
    
    for i in range(0, len(doc_contents), chunk_size):
        chunk = doc_contents[i:i+chunk_size]
        
        # Add document content to the prompt
        docs_prompt = "\n\nDocuments to search:\n"
        for doc in chunk:
            # Truncate content if too long
            content = doc["content"]
            if len(content) > 8000:
                content = content[:8000] + "... [content truncated]"
                
            docs_prompt += f"\nDOCUMENT ID: {doc['id']}, FILENAME: {doc['filename']}\n{content}\n---\n"
        
        full_prompt = user_prompt + docs_prompt
        
        try:
            # Call OpenAI API
            logger.info(f"Calling OpenAI API for search (chunk {i//chunk_size + 1}/{(len(doc_contents) + chunk_size - 1)//chunk_size})")
            chunk_matches = call_openai_api(system_prompt, full_prompt)
            
            # Filter matches by relevance
            chunk_matches = [m for m in chunk_matches if m.get("relevance", 0) >= relevance_threshold]
            matches.extend(chunk_matches)
        except Exception as e:
            logger.error(f"Error searching chunk {i//chunk_size + 1}: {str(e)}")
    
    # Sort by relevance (descending)
    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    
    # Limit to top 10 most relevant matches
    return matches[:10]

def call_openai_api(system_prompt: str, user_prompt: str) -> List[Dict[str, Any]]:
    """Call the OpenAI API to process document search."""
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    data = {
        "model": "gpt-4-turbo-preview",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,  # Lower temperature for more focused results
        "max_tokens": 4000,
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        response_data = response.json()
        content = response_data["choices"][0]["message"]["content"]
        
        # Parse JSON response
        result = json.loads(content)
        
        # Handle different response formats
        if isinstance(result, dict) and "matches" in result:
            return result["matches"]
        elif isinstance(result, dict) and "results" in result:
            return result["results"]
        elif isinstance(result, list):
            return result
        else:
            logger.warning("Unexpected response format, returning empty list")
            return []
    
    except requests.exceptions.RequestException as e:
        logger.error(f"API request error: {str(e)}")
        raise
    
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Error parsing API response: {str(e)}")
        logger.error(f"Response content: {content if 'content' in locals() else 'N/A'}")
        return []

def basic_document_search(query: str, documents: List[Document]) -> List[Dict[str, Any]]:
    """Simple keyword-based document search as a fallback."""
    
    matches = []
    query_terms = query.lower().split()
    
    for doc in documents:
        try:
            with open(doc.content_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split content into paragraphs
            paragraphs = content.split('\n\n')
            
            for i, para in enumerate(paragraphs):
                # Simple relevance calculation based on term frequency
                relevance = 0
                for term in query_terms:
                    if term in para.lower():
                        relevance += 0.1
                
                # Only include if somewhat relevant
                if relevance >= 0.2:
                    matches.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "matched_text": para,
                        "paragraph": i + 1,
                        "relevance": min(relevance, 1.0),  # Cap at 1.0
                        "citation": f"{doc.filename}, paragraph {i+1}"
                    })
        except Exception as e:
            logger.error(f"Error processing document {doc.id}: {str(e)}")
    
    # Sort by relevance
    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    
    # Limit to top 10
    return matches[:10] 