from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import SessionLocal
from app.models.document import Document

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "filetype": doc.filetype,
            "uploaded_at": doc.uploaded_at,
            "content_path": doc.content_path,
        }
        for doc in documents
    ]