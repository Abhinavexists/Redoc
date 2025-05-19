import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config import SessionLocal
from app.models.document import Document
from app.services.document_service import DocumentService

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
    
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/documents")
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    document_service = DocumentService(db)
    return document_service.get_documents(page, page_size)

@router.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    document_service = DocumentService(db)
    document = document_service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/documents/{document_id}/chunks/{chunk_index}")
def get_document_chunk(
    document_id: int,
    chunk_index: int,
    chunk_size: int = Query(5000, ge=100, le=10000),
    db: Session = Depends(get_db)
):
    document_service = DocumentService(db)
    chunk = document_service.get_document_chunk(document_id, chunk_index, chunk_size)
    if not chunk:
        raise HTTPException(status_code=404, detail="Document or chunk not found")
    return chunk

@router.post("/documents/batch")
async def batch_process_documents(
    batch: dict,
    db: Session = Depends(get_db)
):
    document_service = DocumentService(db)
    result = document_service.batch_process_documents(
        batch.get("document_ids", []),
        batch.get("operation", ""),
        batch.get("params", {})
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = document.content_path

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file: {file_path}")
        
        db.delete(document)
        db.commit()
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting document")

@router.delete("/documents")
def delete_all_documents(db: Session = Depends(get_db)):
    try:
        documents = db.query(Document).all()
        for document in documents:
            if os.path.exists(document.content_path):
                os.remove(document.content_path)
                logger.info(f"Deleted file: {document.content_path}")
        
        db.query(Document).delete()
        db.commit()
        return {"message": "All documents deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting all documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting documents")