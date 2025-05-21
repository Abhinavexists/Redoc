import io
import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from backend.app.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_document_service():
    """Mock the document service for all document API tests"""
    with patch('backend.app.api.documents.DocumentService', autospec=True) as mock_cls:
        mock_service = mock_cls.return_value
        
        mock_service.get_documents.return_value = {
            "documents": [
                {
                    "id": 1, 
                    "filename": "test1.pdf", 
                    "size": 1024, 
                    "upload_date": "2023-05-01"
                },
                {
                    "id": 2, 
                    "filename": "test2.pdf", 
                    "size": 2048, 
                    "upload_date": "2023-05-02"
                }
            ],
            "total": 2,
            "page": 1,
            "page_size": 20
        }
        
        mock_service.get_document.return_value = {
            "id": 1, 
            "filename": "test1.pdf", 
            "content": "Test document content",
            "size": 1024,
            "upload_date": "2023-05-01"
        }
        
        from backend.app.api import documents
        documents.DocumentService = lambda db: mock_service
        
        yield mock_service

@pytest.fixture(autouse=True)
def mock_db():
    with patch('backend.app.api.documents.get_db') as mock_get_db:
        session = MagicMock()
        mock_get_db.return_value = session
        yield session

def test_get_document_not_found():
    with patch('backend.app.api.documents.DocumentService', autospec=True) as mock_cls:
        mock_service = mock_cls.return_value
        mock_service.get_document.return_value = None
        
        from backend.app.api import documents
        documents.DocumentService = lambda db: mock_service
        
        with patch('backend.app.api.documents.get_db') as mock_get_db:
            mock_get_db.return_value = MagicMock()
            
            response = client.get("/api/documents/999")
        
            assert response.status_code == 404
            
            data = response.json()
            assert "detail" in data
            assert "not found" in data["detail"].lower()

def test_upload_invalid_file_type():
    test_file_content = b"Not a PDF file"
    test_file = io.BytesIO(test_file_content)
    
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", test_file, "text/plain")}
    )
    
    assert response.status_code == 400
    
    data = response.json()
    assert "detail" in data
    assert "unsupported file type" in data["detail"].lower() 