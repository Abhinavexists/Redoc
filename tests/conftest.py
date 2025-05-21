import pytest
import sys
import os
from unittest.mock import MagicMock
from dotenv import load_dotenv

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_path)

dotenv_path = os.path.join(backend_path, 'backend', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

os.environ.setdefault("TESTING", "True")

from backend.app.config import SessionLocal

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        
@pytest.fixture
def mock_text_analyzer():
    mock = MagicMock()
    mock.analyze_document.return_value = {
        "document_id": 1,
        "paragraphs": [
            {
                "index": 0,
                "content": "This is a test paragraph.",
                "position": {"start": 0, "end": 25},
                "id": "test_para_id",
                "document_id": 1
            }
        ],
        "sentences": [
            {
                "index": 0,
                "paragraph_index": 0,
                "content": "This is a test paragraph.",
                "position": {"start": 0, "end": 25},
                "id": "test_sent_id",
                "document_id": 1
            }
        ],
        "statistics": {
            "paragraph_count": 1,
            "sentence_count": 1
        }
    }
    return mock

@pytest.fixture
def mock_theme_identifier():
    mock = MagicMock()
    mock.identify_themes.return_value = {
        "themes": [
            {
                "id": 1,
                "theme_name": "Test Theme",
                "summary": "This is a test theme.",
                "supporting_documents": ["DOC001", "DOC002"],
                "evidence": "Test evidence for the theme."
            }
        ]
    }
    return mock 