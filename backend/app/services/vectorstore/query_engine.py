import os
import re
import logging
import hashlib
from langchain_chroma import Chroma
from backend.app.services.vectorstore.gemini_embeddings import GeminiEmbeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHROMA_DB_PATH = "chroma_store"

def extract_page_info(text):
    logger.info(f"Extracting page from text: {text[:100]}...")
    page_match = re.search(r"--- Page (\d+) ---", text)
    if page_match:
        page_num = int(page_match.group(1))
        logger.info(f"Found page number: {page_num}")
        return page_num
    logger.info("No page number found in text")
    return None

def extract_paragraph_info(text):
    content_start = text.strip()[:50].strip()
    hash_obj = hashlib.md5(content_start.encode())
    paragraph_id = int(hash_obj.hexdigest()[:8], 16) % 100
    return paragraph_id or 1

def query_documents(query: str, top_k: int = 5):
    if not os.path.exists(CHROMA_DB_PATH):
        logger.warning(f"Chroma DB path does not exist: {CHROMA_DB_PATH}")
        return [{
            "matched_text": "No documents have been indexed yet. Please upload documents first.",
            "filename": "System Message",
            "citation": "System"
        }]
        
    try:
        logger.info(f"Processing query: {query}")
        embedding_function = GeminiEmbeddings()
        
        vectordb = Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=embedding_function
        )
        
        results = vectordb.similarity_search(query, k=top_k)
        logger.info(f"Found {len(results)} results for query")

        formatted_results = []
        for i, result in enumerate(results):
            logger.info(f"Processing result {i+1}/{len(results)}")
            logger.info(f"Metadata: {result.metadata}")
            
            page_num = None
            if 'page' in result.metadata:
                page_num = result.metadata.get('page')
                logger.info(f"Page number from metadata: {page_num}")
            else:
                page_num = extract_page_info(result.page_content)
                logger.info(f"Page number from content: {page_num}")
            
            paragraph_num = None
            if 'paragraph_id' in result.metadata:
                paragraph_num = result.metadata.get('paragraph_id')
                logger.info(f"Paragraph ID from metadata: {paragraph_num}")
            else:
                filename = result.metadata.get("filename", "Unknown")
                paragraph_num = extract_paragraph_info(result.page_content, filename)
                logger.info(f"Paragraph ID calculated: {paragraph_num}")
            
            citation = f"{result.metadata.get('filename', 'Unknown')}"
            if page_num:
                citation += f", Page {page_num}"
            if paragraph_num:
                citation += f", Para {paragraph_num}"
            
            formatted_result = {
                "matched_text": result.page_content,
                "filename": result.metadata.get("filename", "Unknown"),
                "citation": citation,
                "page": page_num,
                "paragraph": paragraph_num
            }
            logger.info(f"Formatted result: {formatted_result}")
            formatted_results.append(formatted_result)

        return formatted_results
    except Exception as e:
        logger.error(f"Error querying vector database: {str(e)}", exc_info=True)
        return [{
            "matched_text": f"Error querying vector database: {str(e)}. Try uploading documents first.",
            "filename": "System Error",
            "citation": "System"
        }]
