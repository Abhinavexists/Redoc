import pytest
from unittest.mock import MagicMock, patch
import json
from backend.app.services.theme_identification import identify_themes

@pytest.fixture
def mock_genai_model():
    """Create a mock for the Gemini model"""
    mock = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "themes": [
            {
                "theme_name": "Test Theme 1",
                "summary": "This is a test theme summary.",
                "supporting_documents": ["DOC001", "DOC002"],
                "evidence": "Test evidence for theme 1."
            }
        ]
    })
    mock.generate_content.return_value = mock_response
    return mock

@pytest.fixture
def sample_query_results():
    """Sample query results to use in tests"""
    return [
        {
            "filename": "document1.pdf",
            "matched_text": "This is test text from document 1 about policy recommendations.",
            "relevance": 0.85
        },
        {
            "filename": "document2.pdf",
            "matched_text": "More test text about policy implementation strategies.",
            "relevance": 0.78
        }
    ]

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.call_gemini_api')
def test_theme_identifier_init(mock_call_gemini, mock_genai_model_cls, mock_genai_model, sample_query_results):
    """Test initializing the ThemeIdentifier"""
    mock_genai_model_cls.return_value = mock_genai_model
    mock_call_gemini.return_value = [
        {
            "theme_name": "Test Theme 1",
            "summary": "This is a test theme summary.",
            "supporting_documents": ["document1.pdf", "document2.pdf"],
            "evidence": "Test evidence for theme 1."
        }
    ]
    
    # Call identify_themes with sample query results
    result = identify_themes(sample_query_results, theme_count=1)
    
    # Verify the result
    assert len(result) == 1
    assert result[0]["theme_name"] == "Test Theme 1"

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.call_gemini_api')
def test_identify_themes(mock_call_gemini, mock_genai_model_cls, mock_genai_model, sample_query_results):
    """Test the theme identification process"""
    mock_genai_model_cls.return_value = mock_genai_model
    mock_call_gemini.return_value = [
        {
            "theme_name": "Test Theme 1",
            "summary": "This is a test theme summary.",
            "supporting_documents": ["document1.pdf", "document2.pdf"],
            "evidence": "Test evidence for theme 1."
        }
    ]
    
    # Test identifying themes
    result = identify_themes(sample_query_results, theme_count=1)
    
    # Verify call_gemini_api was called
    mock_call_gemini.assert_called_once()
    
    # Verify the result contains themes
    assert len(result) == 1
    assert result[0]["theme_name"] == "Test Theme 1"
    assert result[0]["supporting_documents"] == ["document1.pdf", "document2.pdf"]

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.create_theme_identification_prompt')
def test_prepare_context(mock_create_prompt, mock_genai_model_cls, mock_genai_model, sample_query_results):
    """Test the context preparation for the model prompt"""
    mock_genai_model_cls.return_value = mock_genai_model
    mock_create_prompt.return_value = "Test prompt with query and document content"
    
    # Mock call_gemini_api to return empty list to prevent errors
    with patch('backend.app.services.theme_identification.call_gemini_api', return_value=[]):
        # Call identify_themes to trigger create_theme_identification_prompt
        identify_themes(sample_query_results, theme_count=1)
    
    # Verify create_theme_identification_prompt was called
    mock_create_prompt.assert_called_once()
    
    # Get the arguments passed to create_theme_identification_prompt
    args, kwargs = mock_create_prompt.call_args
    
    # Verify the documents were passed correctly
    assert len(args[0]) == 2
    assert args[0][0]["id"] == "document1.pdf"
    assert "policy recommendations" in args[0][0]["content"]
    assert args[0][1]["id"] == "document2.pdf"
    assert "policy implementation" in args[0][1]["content"]

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.call_gemini_api')
def test_generate_themes(mock_call_gemini, mock_genai_model_cls, mock_genai_model):
    """Test the theme generation with the model"""
    mock_genai_model_cls.return_value = mock_genai_model
    mock_call_gemini.return_value = [
        {
            "theme_name": "Test Theme 1",
            "summary": "This is a test theme summary.",
            "supporting_documents": ["document1.pdf"],
            "evidence": "Test evidence"
        }
    ]
    
    # Test with minimal sample data
    sample_data = [{"filename": "document1.pdf", "matched_text": "Sample text"}]
    result = identify_themes(sample_data, theme_count=1)
    
    # Verify call_gemini_api was called
    mock_call_gemini.assert_called_once()
    
    # Verify the result structure
    assert len(result) == 1
    assert result[0]["theme_name"] == "Test Theme 1"

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.call_gemini_api')
def test_identify_themes_empty_results(mock_call_gemini, mock_genai_model_cls, mock_genai_model):
    """Test identifying themes with empty results"""
    mock_genai_model_cls.return_value = mock_genai_model
    
    # Test with empty query results
    result = identify_themes([])
    
    # Verify call_gemini_api wasn't called (short-circuit)
    mock_call_gemini.assert_not_called()
    
    # Verify the result is an empty list
    assert result == []

@patch('backend.app.services.theme_identification.genai.GenerativeModel')
@patch('backend.app.services.theme_identification.call_gemini_api')
def test_generate_themes_json_error(mock_call_gemini, mock_genai_model_cls, mock_genai_model):
    """Test handling JSON parsing errors in theme generation"""
    mock_genai_model_cls.return_value = mock_genai_model
    
    # Simulate an error in call_gemini_api
    mock_call_gemini.side_effect = Exception("JSON parsing error")
    
    # Test with minimal sample data
    sample_data = [{"filename": "document1.pdf", "matched_text": "Sample text"}]
    result = identify_themes(sample_data)
    
    # Verify call_gemini_api was called
    mock_call_gemini.assert_called_once()
    
    # Verify the result is an empty list due to error handling
    assert result == [] 