import pytest
from unittest.mock import patch, MagicMock
import tempfile
import os
from backend.app.services.ocr import extract_text_from_pdf

@pytest.fixture
def sample_pdf_file():
    """Create a temporary PDF file for testing"""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
        temp_file.write(b"%PDF-1.5\nSample PDF content")
        temp_file_path = temp_file.name
    
    yield temp_file_path
    
    # Clean up
    if os.path.exists(temp_file_path):
        os.unlink(temp_file_path)

@pytest.fixture
def mock_fitz_document():
    """Mock a PyMuPDF Document object"""
    mock_doc = MagicMock()
    
    # Mock page objects
    mock_page1 = MagicMock()
    mock_page1.get_text.return_value = "Text from page 1"
    
    mock_page2 = MagicMock()
    mock_page2.get_text.return_value = "Text from page 2"
    
    # Set up document to return our mock pages
    mock_doc.__iter__.return_value = [mock_page1, mock_page2]
    mock_doc.page_count = 2
    
    return mock_doc

@patch('backend.app.services.ocr.fitz.open')
def test_extract_text_from_pdf(mock_fitz_open, sample_pdf_file, mock_fitz_document):
    """Test extracting text from a PDF file"""
    # Configure mock to return our mock document
    mock_fitz_open.return_value = mock_fitz_document
    
    # Call the function
    extracted_text = extract_text_from_pdf(sample_pdf_file)
    
    # Verify fitz.open was called with the file path
    mock_fitz_open.assert_called_once_with(sample_pdf_file)
    
    # Verify text was extracted from all pages
    assert "Text from page 1" in extracted_text
    assert "Text from page 2" in extracted_text

@patch('backend.app.services.ocr.fitz.open')
def test_extract_text_handles_empty_document(mock_fitz_open, sample_pdf_file):
    """Test handling an empty PDF document"""
    # Mock an empty document
    mock_empty_doc = MagicMock()
    mock_empty_doc.__iter__.return_value = []
    mock_empty_doc.page_count = 0
    
    # Configure mock to return our empty document
    mock_fitz_open.return_value = mock_empty_doc
    
    # Call the function
    extracted_text = extract_text_from_pdf(sample_pdf_file)
    
    # Verify the result is an empty string
    assert extracted_text == ""

@patch('backend.app.services.ocr.fitz.open')
def test_extract_text_handles_exceptions(mock_fitz_open, sample_pdf_file):
    """Test handling exceptions during PDF text extraction"""
    # Configure mock to raise an exception
    mock_fitz_open.side_effect = Exception("PDF extraction error")
    
    # Call the function and verify it handles the exception
    with pytest.raises(Exception) as excinfo:
        extract_text_from_pdf(sample_pdf_file)
    
    # Check that our error message is in the exception
    assert "PDF extraction error" in str(excinfo.value) 