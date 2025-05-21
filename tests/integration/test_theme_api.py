import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.app.main import app

client = TestClient(app)

@pytest.fixture
def mock_db_session():
    with patch('backend.app.api.theme_identification.get_db') as mock_get_db:
        mock_session = MagicMock()
        mock_get_db.return_value = mock_session
        yield mock_session

def test_get_theme_citations(mock_db_session):
    theme_id = 1
    response = client.get(f"/api/themes/{theme_id}/citations?citation_level=paragraph")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "theme_id" in data
    assert "citation_level" in data
    assert "citations" in data
    assert data["theme_id"] == theme_id
    assert data["citation_level"] == "paragraph"
    assert isinstance(data["citations"], list)
    
    if data["citations"]:
        citation = data["citations"][0]
        assert "theme_id" in citation
        assert "document_id" in citation
        assert "citation_type" in citation
        assert "reference_id" in citation
        assert "content" in citation
        assert "relevance" in citation
        assert "citation" in citation
        assert "paragraph_index" in citation

def test_get_theme_citations_with_different_levels(mock_db_session):
    theme_id = 1
    
    response = client.get(f"/api/themes/{theme_id}/citations?citation_level=document")
    assert response.status_code == 200
    data = response.json()
    assert data["citation_level"] == "document"
    
    response = client.get(f"/api/themes/{theme_id}/citations?citation_level=paragraph")
    assert response.status_code == 200
    data = response.json()
    assert data["citation_level"] == "paragraph"
    
    response = client.get(f"/api/themes/{theme_id}/citations?citation_level=sentence")
    assert response.status_code == 200
    data = response.json()
    assert data["citation_level"] == "sentence"
    
    if data["citations"]:
        citation = data["citations"][0]
        assert "sentence_index" in citation
        assert "Sentence" in citation["citation"]