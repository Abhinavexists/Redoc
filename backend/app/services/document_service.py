from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
import os

class DocumentService:
    def __init__(self, db: Session):
        self.db = db

    def get_documents(self, page: int = 1, page_size: int = 20) -> Dict:
        """Get paginated documents"""
        offset = (page - 1) * page_size
        documents = self.db.query(Document).offset(offset).limit(page_size).all()
        total = self.db.query(Document).count()
        
        return {
            "documents": [
                {
                    "id": doc.id,
                    "filename": doc.filename,
                    "filetype": doc.filetype,
                    "uploaded_at": doc.uploaded_at,
                    "content_path": doc.content_path,
                }
                for doc in documents
            ],
            "total": total,
            "page": page,
            "page_size": page_size
        }

    def get_document(self, document_id: int) -> Optional[Dict]:
        """Get a single document with its content"""
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return None
        
        content = ""
        if os.path.exists(document.content_path):
            with open(document.content_path, "r") as file:
                content = file.read()
        
        return {
            "id": document.id,
            "filename": document.filename,
            "filetype": document.filetype,
            "uploaded_at": document.uploaded_at,
            "content": content,
            "metadata": {
                "size": os.path.getsize(document.content_path) if os.path.exists(document.content_path) else 0,
                "last_modified": os.path.getmtime(document.content_path) if os.path.exists(document.content_path) else None
            }
        }

    def get_document_chunk(self, document_id: int, chunk_index: int, chunk_size: int = 5000) -> Optional[Dict]:
        """Get a chunk of document content"""
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return None
        
        content = ""
        if os.path.exists(document.content_path):
            with open(document.content_path, "r") as file:
                content = file.read()
        
        start_pos = chunk_index * chunk_size
        end_pos = min(start_pos + chunk_size, len(content))
        
        if start_pos >= len(content):
            return None
        
        return {
            "document_id": document.id,
            "chunk_index": chunk_index,
            "chunk_size": chunk_size,
            "content": content[start_pos:end_pos],
            "is_last_chunk": end_pos >= len(content)
        }

    def batch_process_documents(self, document_ids: List[int], operation: str, params: Dict = None) -> Dict:
        """Process multiple documents in batch"""
        documents = self.db.query(Document).filter(Document.id.in_(document_ids)).all()
        if len(documents) != len(document_ids):
            return {"error": "Some document IDs not found"}
        
        if operation == "preprocess":
            # Add preprocessing logic here
            return {"status": "success", "processed": len(documents)}
        
        elif operation == "identify_themes":
            # Get document content
            documents_with_content = []
            for doc in documents:
                if os.path.exists(doc.content_path):
                    with open(doc.content_path, "r") as file:
                        content = file.read()
                    documents_with_content.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "content": content
                    })
            
            # Process documents for theme identification
            max_themes = params.get("max_themes", 5) if params else 5
            relevance_threshold = params.get("relevance_threshold", 0.7) if params else 0.7
            
            # This would call your theme identification service
            from app.services.theme_identification import identify_themes_across_documents
            themes = identify_themes_across_documents(
                documents_with_content, 
                max_themes=max_themes,
                relevance_threshold=relevance_threshold
            )
            
            return {"themes": themes}
        
        return {"error": f"Unsupported operation: {operation}"} 