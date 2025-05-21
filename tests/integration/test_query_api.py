from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.app.main import app

client = TestClient(app)

def test_query_with_empty_query():
    # The API currently doesn't validate empty queries strictly
    with patch('backend.app.api.query.process_query') as mock_processor:
        mock_processor.return_value = []
        
        with patch('backend.app.api.query.get_db') as mock_get_db:
            mock_get_db.return_value = MagicMock()
            
            response = client.post(
                "/api/query",
                json={"query": ""}
            )
            
            assert response.status_code == 200
            
            data = response.json()
            assert data["query"] == ""
            assert len(data["matches"]) == 0 