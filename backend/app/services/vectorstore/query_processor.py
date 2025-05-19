import re
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from app.config import settings
from app.config import SessionLocal
from app.models.document import Document

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def process_query(query: str, document_ids: Optional[List[int]] = None, relevance_threshold: float = 0.7, advanced_mode: bool = False) -> List[Dict[str, Any]]:
    logger.info(f"Processing query: '{query}'")
    if document_ids:
        logger.info(f"Restricting search to document IDs: {document_ids}")
    
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
        
        if settings.GEMINI_API_KEY:
            matches = search_with_gemini(query, documents, relevance_threshold, advanced_mode)
        else:
            matches = basic_document_search(query, documents)
        
        logger.info(f"Found {len(matches)} relevant matches")
        return matches
        
    finally:
        db.close()

def search_with_gemini(query: str, documents: List[Document], relevance_threshold: float, advanced_mode: bool) -> List[Dict[str, Any]]:
    doc_contents = []
    for doc in documents:
        try:
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
    
    system_prompt = "You are a research assistant that helps find relevant information in documents."

    if advanced_mode:
        user_prompt_template = f"""I need to find information across multiple documents related to this query:
    "{query}"

    For each document, analyze the content and extract only the most relevant sections that directly answer the query.
    Only include text that is truly relevant with a confidence level of at least {relevance_threshold * 100}%.

    If a document doesn't contain relevant information, exclude it from results.

    For each relevant document section, provide:
    1. The document filename
    2. The exact text that answers the query (keep it focused and concise)
    3. IMPORTANT: Always identify and include the paragraph number (indicate as a number)
    4. IMPORTANT: If available, include the page number where this text appears (indicate as a number)
    5. Rate the relevance from 0.5 to 1.0 (only include text with relevance >= {relevance_threshold})

    Format as JSON:
    [
    {{
        "id": document_id,
        "filename": "filename.pdf",
        "matched_text": "relevant text...",
        "paragraph": paragraph_number (as integer),
        "page": page_number_if_available (as integer),
        "relevance": relevance_score,
        "citation": "formatted citation for this source"
    }}
    ]

    The paragraph and page fields must be numeric values (not strings).
    Only return the JSON array. Include at most 10 most relevant matches."""
        
    else:
        user_prompt_template = f"""Find relevant information in the following documents for this query:
    "{query}"

    Return only sections that are directly relevant to the query with a confidence of at least {relevance_threshold * 100}%.
    Format as JSON:
    [
    {{
        "id": document_id,
        "filename": "filename.pdf",
        "matched_text": "relevant text...",
        "paragraph": paragraph_number (as integer),
        "page": page_number_if_available (as integer),
        "relevance": relevance_score,
        "citation": "citation for this source"
    }}
    ]

    IMPORTANT: Always include the paragraph number as a numeric value. If the section starts with a number (like "2 Background"), use that as the paragraph/section number.
    The paragraph and page fields must be numeric values (not strings).
    Only return the JSON array. Include at most 10 most relevant matches."""
    
    matches = []
    chunk_size = 5      
    
    for i in range(0, len(doc_contents), chunk_size):
        chunk = doc_contents[i:i + chunk_size]
        docs_prompt = "\n\nDocuments to search:\n"

        for doc in chunk:
            content = doc["content"]
            if len(content) > 8000:
                content = content[:8000] + "... [content truncated]"
            docs_prompt += f"\nDOCUMENT ID: {doc['id']}, FILENAME: {doc['filename']}\n{content}\n---\n"

        full_prompt = user_prompt_template + docs_prompt
        
        try:
            logger.info(f"Calling Gemini API for search (chunk {i // chunk_size + 1}/{(len(doc_contents) + chunk_size - 1) // chunk_size})")
            chunk_matches = call_gemini_api(system_prompt, full_prompt)
            chunk_matches = [m for m in chunk_matches if m.get("relevance", 0) >= relevance_threshold]
            matches.extend(chunk_matches)
        except Exception as e:
            logger.error(f"Error searching chunk {i // chunk_size + 1}: {str(e)}")
    
    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return matches[:10]

def call_gemini_api(system_prompt: str, user_prompt: str) -> List[Dict[str, Any]]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.MODEL_NAME}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"{system_prompt}\n\n{user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4000
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        response_data = response.json()

        raw_content = response_data["candidates"][0]["content"]["parts"][0]["text"]

        cleaned = raw_content.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[len("```json"):].strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned[len("```"):].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()

        result = json.loads(cleaned)

        if isinstance(result, list):
            for item in result:
                if "paragraph" not in item or item["paragraph"] is None:
                    if "citation" in item and "para" in item["citation"].lower():
                        para_match = re.search(r'para(?:graph)?\s*(\d+)', item["citation"].lower())
                        if para_match:
                            item["paragraph"] = int(para_match.group(1))
                    
                    matched_text = item.get("matched_text", "")
                    section_match = re.match(r'^\s*(\d+)\s+', matched_text)
                    if section_match and "paragraph" not in item:
                        item["paragraph"] = int(section_match.group(1))
                
                if "page" not in item or item["page"] is None:
                    if "citation" in item and "page" in item["citation"].lower():
                        page_match = re.search(r'page\s*(\d+)', item["citation"].lower())
                        if page_match:
                            item["page"] = int(page_match.group(1))
                
                filename = item.get("filename", "Unknown document")
                paragraph = item.get("paragraph")
                page = item.get("page")
                
                doc_title = filename.split('.')[0].replace('_', ' ').title()
                current_year = 2023  
                
                matched_text = item.get("matched_text", "")
                
                authors = "Author et al."
                author_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z]\.|,?\s+and\s+[A-Z][a-z]+)+)', matched_text)
                if author_match:
                    authors = author_match.group(1)
                    if len(authors) > 30:  
                        authors = authors.split(',')[0] + " et al."
                
                source = ""
                source_match = re.search(r'((?:Journal|Conference|Proceedings|IEEE|ACM)\s+[^\.]+)', matched_text)
                if source_match:
                    source = source_match.group(1)
                    if len(source) > 40:    
                        source = source[:40] + "..."
                
                year_match = re.search(r'(?:19|20)\d{2}', matched_text)
                pub_year = year_match.group(0) if year_match else str(current_year)
                
                doi = ""
                doi_match = re.search(r'(doi:[\w\.\/\-]+|https://doi.org/[\w\.\/\-]+)', matched_text, re.IGNORECASE)
                if doi_match:
                    doi = doi_match.group(1)
                
                citation = f"{authors} ({pub_year}). {doc_title}"
                
                if source:
                    citation += f". {source}"
                
                if doi:
                    citation += f". {doi}"
                
                if page:
                    citation += f", p. {page}"
                if paragraph:
                    citation += f", sec. {paragraph}"
                
                item["citation"] = citation
            
            return result
        elif isinstance(result, dict) and "matches" in result:
            return result["matches"]
        elif isinstance(result, dict) and "results" in result:
            return result["results"]
        else:
            logger.warning("Unexpected format in parsed result")
            return []

    except requests.exceptions.RequestException as e:
        logger.error(f"API request error: {str(e)}")
        raise
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Error parsing API response: {str(e)}")
        logger.error(f"Response content: {raw_content if 'raw_content' in locals() else 'N/A'}")
        return []

def basic_document_search(query: str, documents: List[Document]) -> List[Dict[str, Any]]:
    matches = []
    query_terms = query.lower().split()

    for doc in documents:
        try:
            with open(doc.content_path, 'r', encoding='utf-8') as f:
                content = f.read()

            paragraphs = content.split('\n\n')
            for i, para in enumerate(paragraphs):
                relevance = 0
                for term in query_terms:
                    if term in para.lower():
                        relevance += 0.1

                if relevance >= 0.2:
                    page = None
                    page_match = re.search(r"--- Page (\d+) ---", para)
                    if page_match:
                        page = int(page_match.group(1))
                    
                    doc_title = doc.filename.split('.')[0].replace('_', ' ').title()
                    current_year = 2023  
                    
                    authors = "Author et al."
                    author_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z]\.|,?\s+and\s+[A-Z][a-z]+)+)', para)
                    if author_match:
                        authors = author_match.group(1)
                        if len(authors) > 30:  
                            authors = authors.split(',')[0] + " et al."
                    
                    source = ""
                    source_match = re.search(r'((?:Journal|Conference|Proceedings|IEEE|ACM)\s+[^\.]+)', para)
                    if source_match:
                        source = source_match.group(1)
                        if len(source) > 40:  
                            source = source[:40] + "..."
                    
                    year_match = re.search(r'(?:19|20)\d{2}', para)
                    pub_year = year_match.group(0) if year_match else str(current_year)
                    
                    doi = ""
                    doi_match = re.search(r'(doi:[\w\.\/\-]+|https://doi.org/[\w\.\/\-]+)', para, re.IGNORECASE)
                    if doi_match:
                        doi = doi_match.group(1)
                    
                    citation = f"{authors} ({pub_year}). {doc_title}"
                    
                    if source:
                        citation += f". {source}"
                    
                    if doi:
                        citation += f". {doi}"
                    
                    if page:
                        citation += f", p. {page}"
                    citation += f", sec. {i + 1}"
                    
                    matches.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "matched_text": para,
                        "paragraph": i + 1,
                        "page": page,
                        "relevance": min(relevance, 1.0),
                        "citation": citation
                    })

        except Exception as e:
            logger.error(f"Error processing document {doc.id}: {str(e)}")

    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return matches[:10]