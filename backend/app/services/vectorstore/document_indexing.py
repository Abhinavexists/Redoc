import os
import re
import shutil
import hashlib
import logging
from langchain_chroma import Chroma
from .gemini_embeddings import GeminiEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LC_Document

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

CHROMA_DB_PATH = "chroma_store"

def extract_page_info(text):
    page_match = re.search(r"--- Page (\d+) ---", text)
    if page_match:
        return int(page_match.group(1))
    return None

def extract_paragraph_info(text, filename):
    # Create a unique paragraph identifier based on content hash
    content_start = text.strip()[:50].strip()
    hash_obj = hashlib.md5(content_start.encode())
    paragraph_id = int(hash_obj.hexdigest()[:8], 16) % 100
    return paragraph_id or 1

def build_vector_store(directory_path: str = "data/"):
    all_docs = []
    
    if not os.path.isabs(directory_path):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.abspath(os.path.join(current_dir, "../../../"))
        directory_path = os.path.join(backend_dir, directory_path)
    
    logger.info(f"Looking for text files in: {directory_path}")
    
    if not os.path.exists(directory_path):
        logger.warning(f"Directory {directory_path} does not exist. Creating it.")
        os.makedirs(directory_path, exist_ok=True)
        return None
    
    txt_files = [f for f in os.listdir(directory_path) if f.endswith(".txt")]
    if not txt_files:
        logger.warning(f"No .txt files found in {directory_path}. Vector store creation skipped.")
        return None
    
    logger.info(f"Found {len(txt_files)} text files: {', '.join(txt_files)}")
    
    for filename in txt_files:
        path = os.path.join(directory_path, filename)
        try:
            with open(path, 'r', encoding='utf-8') as file:
                text = file.read()

            loader = TextLoader(path)
            documents = loader.load()

            for doc in documents:
                doc.metadata["filename"] = filename
            all_docs.extend(documents)
            logger.info(f"Processed {filename}: {len(documents)} document chunks")
        except Exception as e:
            logger.error(f"Error processing {filename}: {str(e)}")

    if not all_docs:
        logger.warning("No documents were loaded. Vector store creation skipped.")
        return None
    
    logger.info(f"Total document chunks: {len(all_docs)}")
    
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        split_docs = text_splitter.split_documents(all_docs)
        logger.info(f"Split into {len(split_docs)} chunks")

        # Process metadata for each document chunk
        for doc in split_docs:
            page_num = extract_page_info(doc.page_content)
            if page_num:
                doc.metadata["page"] = page_num
                
            filename = doc.metadata.get("filename", "Unknown")
            para_id = extract_paragraph_info(doc.page_content, filename)
            doc.metadata["paragraph_id"] = para_id

        if os.path.exists(CHROMA_DB_PATH):
            logger.info(f"Removing existing vector store at {CHROMA_DB_PATH}")
            shutil.rmtree(CHROMA_DB_PATH)

        logger.info("Creating vector store with embeddings...")
        embedding_function = GeminiEmbeddings()
        
        vectordb = Chroma.from_documents(
            documents=split_docs,
            embedding=embedding_function,
            persist_directory=CHROMA_DB_PATH
        )
            
        logger.info(f"Vector store created successfully at {CHROMA_DB_PATH}")
        return vectordb
    except Exception as e:
        logger.error(f"Error creating vector store: {str(e)}")
        return None