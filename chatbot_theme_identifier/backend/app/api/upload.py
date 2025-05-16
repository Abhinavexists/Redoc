from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from app.services.ocr import extract_text_from_pdf, extract_text_from_image, save_text_to_file
from app.config import SessionLocal
from app.models.document import Document
from sqlalchemy.orm import Session

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    content = await file.read()
    filename = file.filename.rsplit(".", 1)[0]

    try:
        if file.content_type == "application/pdf":
            text = extract_text_from_pdf(content)
        else:
            text = extract_text_from_image(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
    
    path = save_text_to_file(filename, text)
    

    document = Document(
        filename=file.filename,
        content_path=path,
        filetype=file.content_type,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "File uploaded, Text extracted and saved successfully",
        "path": path,
        "document_id": document.id
    }
    
        
    
    