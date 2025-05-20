from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, BackgroundTasks
from app.services.ocr import extract_text_from_pdf, extract_text_from_image, save_text_to_file
from app.models.document import Document
from app.services.vectorstore.document_indexing import build_vector_store
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.logging_config import setup_logging
import os
import asyncio

logger = setup_logging()

router = APIRouter()

def rebuild_vector_store_task():
    try:
        logger.info("Rebuilding vector store after document upload")
        vectordb = build_vector_store()
        if vectordb:
            logger.info("Vector store rebuilt successfully")
        else:
            logger.warning("Failed to rebuild vector store")
    except Exception as e:
        logger.error(f"Error rebuilding vector store: {str(e)}")

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    logger.info(f"Receiving upload request for file: {file.filename}")
    
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        logger.warning(f"Unsupported file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    try:
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            chunk_size = 1024 * 1024
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                buffer.write(chunk)
                await asyncio.sleep(0)
        
        logger.info(f"File uploaded successfully to temp location: {temp_file_path}")
        
        filename = file.filename.rsplit(".", 1)[0]
        
        if file.content_type == "application/pdf":
            logger.info(f"Extracting text from PDF: {filename}")
            with open(temp_file_path, "rb") as f:
                content = f.read()
                text = extract_text_from_pdf(content)
        else:
            logger.info(f"Extracting text from image: {filename}")
            with open(temp_file_path, "rb") as f:
                content = f.read()
                text = extract_text_from_image(content)
        
        os.remove(temp_file_path)
        
        path = save_text_to_file(filename, text)
        logger.info(f"Text saved to {path}")
        
        document = Document(
            filename=file.filename,
            content_path=path,
            filetype=file.content_type,
        )

        db.add(document)
        db.commit()
        db.refresh(document)
        logger.info(f"Document record created with ID: {document.id}")
        
        background_tasks.add_task(rebuild_vector_store_task)
        
        return {
            "message": "File uploaded, text extracted and saved successfully",
            "path": path,
            "document_id": document.id
        }
    
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")