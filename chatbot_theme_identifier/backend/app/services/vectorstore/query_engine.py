import os
from langchain_chroma import Chroma
from .gemini_embeddings import GeminiEmbeddings

CHROMA_DB_PATH = "chroma_store"

def query_documents(query: str, top_k: int = 5):
    if not os.path.exists(CHROMA_DB_PATH):
        return [{
            "matched_text": "No documents have been indexed yet. Please upload documents first.",
            "filename": "System Message",
            "citation": "System"
        }]
        
    try:
        embedding_function = GeminiEmbeddings()
        
        vectordb = Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=embedding_function
        )
        
        results = vectordb.similarity_search(query, k=top_k)

        formatted_results = []
        for result in results:
            formatted_results.append({
                "matched_text": result.page_content,
                "filename": result.metadata.get("filename", "Unknown"),
                "citation": "Text chunk (approx.)" 
            })

        return formatted_results
    except Exception as e:
        return [{
            "matched_text": f"Error querying vector database: {str(e)}. Try uploading documents first.",
            "filename": "System Error",
            "citation": "System"
        }]
