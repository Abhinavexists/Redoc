import re
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from app.config import settings
from app.config import SessionLocal
from app.models.document import Document
from app.services.text_analysis import TextAnalyzer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def process_query(query: str, document_ids: Optional[List[int]] = None, relevance_threshold: float = 0.7, advanced_mode: bool = False, citation_level: str = "paragraph") -> List[Dict[str, Any]]:
    logger.info(f"Processing query: '{query}' with citation_level: {citation_level}")
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
            matches = search_with_gemini(query, documents, relevance_threshold, advanced_mode, citation_level)
        else:
            matches = basic_document_search(query, documents, citation_level)
        
        logger.info(f"Found {len(matches)} relevant matches")
        return matches
        
    finally:
        db.close()

def search_with_gemini(query: str, documents: List[Document], relevance_threshold: float, advanced_mode: bool, citation_level: str = "paragraph") -> List[Dict[str, Any]]:
    doc_contents = []
    for doc in documents:
        try:
            with open(doc.content_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Analyze for paragraph/sentence if needed
            analysis = None
            if citation_level in ["paragraph", "sentence"]:
                analysis = TextAnalyzer.analyze_document(doc.id, content)
            doc_contents.append({
                "id": doc.id,
                "filename": doc.filename,
                "content": content,
                "filetype": doc.filetype,
                "analysis": analysis
            })
        except Exception as e:
            logger.error(f"Error reading document {doc.id}: {str(e)}")
    
    if not doc_contents:
        logger.warning("No document contents available for search")
        return []
    
    system_prompt = "You are a research assistant that helps find relevant information in documents."

    # Add citation level to the prompt
    citation_instruction = ""
    if citation_level == "paragraph":
        citation_instruction = "Identify the specific paragraph (by number) for each match."
    elif citation_level == "sentence":
        citation_instruction = "Identify the specific paragraph and sentence (by numbers) for each match."

    if advanced_mode:
        user_prompt_template = f"""I need to find information across multiple documents related to this query:
    "{query}"

    For each document, analyze the content and extract only the most relevant sections that directly answer the query.
    Only include text that is truly relevant with a confidence level of at least {relevance_threshold * 100}%.
    {citation_instruction}

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
        "relevance": relevance_score
    }}
    ]

    The paragraph and page fields must be numeric values (not strings).
    Only return the JSON array. Include at most 10 most relevant matches."""
        
    else:
        user_prompt_template = f"""Find relevant information in the following documents for this query:
    "{query}"

    Return only sections that are directly relevant to the query with a confidence of at least {relevance_threshold * 100}%.
    {citation_instruction}
    Format as JSON:
    [
    {{
        "id": document_id,
        "filename": "filename.pdf",
        "matched_text": "relevant text...",
        "paragraph": paragraph_number (as integer),
        "page": page_number_if_available (as integer),
        "relevance": relevance_score
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
            # Enhance matches with more detailed citation information
            chunk_matches = enhance_matches_with_citation_info(chunk_matches, chunk, citation_level)
            chunk_matches = [m for m in chunk_matches if m.get("relevance", 0) >= relevance_threshold]
            matches.extend(chunk_matches)
        except Exception as e:
            logger.error(f"Error searching chunk {i // chunk_size + 1}: {str(e)}")
    
    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return matches[:10]

def enhance_matches_with_citation_info(matches: List[Dict[str, Any]], documents: List[Dict[str, Any]], citation_level: str) -> List[Dict[str, Any]]:
    """Enhance matches with detailed citation information based on TextAnalyzer results"""
    if citation_level == "document":
        return matches
        
    for match in matches:
        doc_id = match.get("id")
        if not doc_id:
            continue
            
        # Find the document in our processed documents
        doc = next((d for d in documents if d["id"] == doc_id), None)
        if not doc or not doc.get("analysis"):
            continue
            
        matched_text = match.get("matched_text", "")
        if not matched_text:
            continue
            
        # For paragraph-level citations
        paragraph_num = match.get("paragraph")
        paragraph_id = None
            
        # For paragraph-level citations
        if citation_level in ["paragraph", "sentence"]:
            # Try to find the paragraph by index
            if paragraph_num is not None:
                paragraphs = doc["analysis"]["paragraphs"]
                for para in paragraphs:
                    if para["index"] == paragraph_num:
                        paragraph_id = para["id"]
                        match["paragraph_id"] = paragraph_id
                        match["position"] = para["position"]
                        break
                
            # If not found by index, try content matching
            if not paragraph_id:
                for para in doc["analysis"]["paragraphs"]:
                    if matched_text in para["content"]:
                        paragraph_id = para["id"]
                        paragraph_num = para["index"]
                        match["paragraph"] = paragraph_num
                        match["paragraph_id"] = paragraph_id
                        match["position"] = para["position"]
                        break
            
            # Update citation to include paragraph information
            if paragraph_num is not None:
                filename = match.get("filename", "Unknown")
                page = match.get("page")
                
                # Format citation based on available information
                citation = f"{filename}"
                if page:
                    citation += f", Page {page}"
                citation += f", Para {paragraph_num + 1}"
                match["citation"] = citation
        
        # For sentence-level citations
        if citation_level == "sentence" and paragraph_id:
            # Find sentences in this paragraph
            sentences = [s for s in doc["analysis"]["sentences"] if s["paragraph_index"] == paragraph_num]
            
            # Try to find exact sentence match
            sentence_found = False
            for sent in sentences:
                if matched_text == sent["content"] or matched_text in sent["content"]:
                    match["sentence"] = sent["index"]
                    match["sentence_id"] = sent["id"]
                    sentence_found = True
                    
                    # Update citation to include sentence information
                    filename = match.get("filename", "Unknown")
                    page = match.get("page")
                    
                    # Format sentence-level citation
                    citation = f"{filename}"
                    if page:
                        citation += f", Page {page}"
                    citation += f", Para {paragraph_num + 1}, Sentence {sent['index'] + 1}"
                    match["citation"] = citation
                    break
            
            # If no exact sentence match, but we have the paragraph, pick the most similar sentence
            if not sentence_found and sentences:
                # Find sentence with most word overlap
                best_match = sentences[0]
                best_score = 0
                matched_words = set(matched_text.lower().split())
                
                for sent in sentences:
                    sent_words = set(sent["content"].lower().split())
                    overlap = len(matched_words.intersection(sent_words))
                    if overlap > best_score:
                        best_score = overlap
                        best_match = sent
                
                match["sentence"] = best_match["index"]
                match["sentence_id"] = best_match["id"]
                
                # Format sentence-level citation
                filename = match.get("filename", "Unknown")
                page = match.get("page")
                
                citation = f"{filename}"
                if page:
                    citation += f", Page {page}"
                citation += f", Para {paragraph_num + 1}, Sentence {best_match['index'] + 1}"
                match["citation"] = citation
    
    return matches

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
                            item["paragraph"] = int(para_match.group(1)) - 1  # Convert to zero-based index
                    
                    matched_text = item.get("matched_text", "")
                    section_match = re.match(r'^\s*(\d+)\s+', matched_text)
                    if section_match and "paragraph" not in item:
                        item["paragraph"] = int(section_match.group(1)) - 1  # Convert to zero-based index
                
                if "page" not in item or item["page"] is None:
                    if "citation" in item and "page" in item["citation"].lower():
                        page_match = re.search(r'page\s*(\d+)', item["citation"].lower())
                        if page_match:
                            item["page"] = int(page_match.group(1))
                
                filename = item.get("filename", "Unknown document")
                paragraph = item.get("paragraph")
                page = item.get("page")
                
                # Basic citation formatting (will be enhanced later)
                citation = f"{filename}"
                if page:
                    citation += f", Page {page}"
                if paragraph is not None:
                    citation += f", Para {paragraph + 1}"  # Convert back to 1-based for display
                
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

def basic_document_search(query: str, documents: List[Document], citation_level: str = "paragraph") -> List[Dict[str, Any]]:
    matches = []
    query_terms = query.lower().split()

    for doc in documents:
        try:
            with open(doc.content_path, 'r', encoding='utf-8') as f:
                content = f.read()
            analysis = TextAnalyzer.analyze_document(doc.id, content)
            if citation_level == "document":
                relevance = 0
                for term in query_terms:
                    if term in content.lower():
                        relevance += 0.1
                if relevance >= 0.2:
                    matches.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "matched_text": content[:200] + "...",
                        "relevance": min(relevance, 1.0),
                        "citation": doc.filename
                    })
            elif citation_level == "paragraph":
                for para in analysis["paragraphs"]:
                    para_text = para["content"]
                    relevance = 0
                    for term in query_terms:
                        if term in para_text.lower():
                            relevance += 0.1
                    if relevance >= 0.2:
                        matches.append({
                            "id": doc.id,
                            "filename": doc.filename,
                            "matched_text": para_text,
                            "paragraph": para["index"],
                            "paragraph_id": para["id"],
                            "relevance": min(relevance, 1.0),
                            "citation": f"{doc.filename}, Para {para['index']+1}",
                            "position": para["position"]
                        })
            elif citation_level == "sentence":
                for sent in analysis["sentences"]:
                    sent_text = sent["content"]
                    relevance = 0
                    for term in query_terms:
                        if term in sent_text.lower():
                            relevance += 0.1
                    if relevance >= 0.2:
                        matches.append({
                            "id": doc.id,
                            "filename": doc.filename,
                            "matched_text": sent_text,
                            "paragraph": sent["paragraph_index"],
                            "sentence": sent["index"],
                            "sentence_id": sent["id"],
                            "relevance": min(relevance, 1.0),
                            "citation": f"{doc.filename}, Para {sent['paragraph_index']+1}, Sentence {sent['index']+1}",
                            "position": sent["position"]
                        })
        except Exception as e:
            logger.error(f"Error processing document {doc.id}: {str(e)}")
    matches.sort(key=lambda x: x.get("relevance", 0), reverse=True)
    return matches[:10]