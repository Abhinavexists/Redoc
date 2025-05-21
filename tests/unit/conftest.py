import pytest
import sys
import os
from unittest.mock import MagicMock

# Add the backend directory to the Python path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from backend.app.config import SessionLocal

@pytest.fixture
def db_session():
    """Provides a SQLAlchemy session for testing"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        
@pytest.fixture
def mock_text_analyzer():
    """Provides a mock TextAnalyzer for testing"""
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
    """Provides a mock ThemeIdentifier for testing"""
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