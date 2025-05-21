import pytest
from backend.app.services.text_analysis import TextAnalyzer, generate_text_id

def test_generate_text_id():
    """Test that generate_text_id creates consistent IDs"""
    test_text = "This is a test text."
    
    # Generate ID twice for the same text
    id1 = generate_text_id(test_text)
    id2 = generate_text_id(test_text)
    
    # IDs should be consistent for the same text
    assert id1 == id2
    assert len(id1) == 12  # Check the expected length
    
    # Different text should generate different IDs
    different_id = generate_text_id("Different text")
    assert id1 != different_id

def test_split_into_paragraphs():
    """Test splitting text into paragraphs"""
    test_text = "This is paragraph one.\n\nThis is paragraph two.\n\nThis is paragraph three."
    
    paragraphs = TextAnalyzer.split_into_paragraphs(test_text)
    
    # Check that we got the expected number of paragraphs
    assert len(paragraphs) == 3
    
    # Check the content of paragraphs
    assert paragraphs[0]["content"] == "This is paragraph one."
    assert paragraphs[1]["content"] == "This is paragraph two."
    assert paragraphs[2]["content"] == "This is paragraph three."
    
    # Check position tracking
    assert paragraphs[0]["position"]["start"] == 0
    assert paragraphs[0]["position"]["end"] == 22
    assert paragraphs[1]["position"]["start"] == 24
    assert paragraphs[1]["position"]["end"] == 46
    
    # Check indices
    assert paragraphs[0]["index"] == 0
    assert paragraphs[1]["index"] == 1
    assert paragraphs[2]["index"] == 2

def test_split_paragraph_into_sentences():
    """Test splitting paragraphs into sentences"""
    paragraph = {
        "content": "This is sentence one. This is sentence two. This is the third sentence!",
        "position": {"start": 10, "end": 80},
        "index": 0
    }
    
    sentences = TextAnalyzer.split_paragraph_into_sentences(paragraph)
    
    # Check that we got the expected number of sentences
    assert len(sentences) == 3
    
    # Check the content of sentences
    assert sentences[0]["content"] == "This is sentence one."
    assert sentences[1]["content"] == "This is sentence two."
    assert sentences[2]["content"] == "This is the third sentence!"
    
    # Check position tracking (absolute positions)
    assert sentences[0]["position"]["start"] == 10  # paragraph start (10) + relative position (0)
    assert sentences[1]["position"]["start"] == 32  # paragraph start (10) + relative position (22)
    
    # Check paragraph references
    assert sentences[0]["paragraph_index"] == 0
    assert sentences[1]["paragraph_index"] == 0
    assert sentences[2]["paragraph_index"] == 0
    
    # Check indices
    assert sentences[0]["index"] == 0
    assert sentences[1]["index"] == 1
    assert sentences[2]["index"] == 2
    
    # Check IDs are generated
    assert "id" in sentences[0]
    assert len(sentences[0]["id"]) == 12

def test_analyze_document():
    """Test full document analysis"""
    test_text = "This is paragraph one.\n\nThis is paragraph two with two sentences. This is the second sentence."
    document_id = 42
    
    result = TextAnalyzer.analyze_document(document_id, test_text)
    
    # Check basic structure
    assert result["document_id"] == document_id
    assert "paragraphs" in result
    assert "sentences" in result
    assert "statistics" in result
    
    # Check statistics
    assert result["statistics"]["paragraph_count"] == 2
    assert result["statistics"]["sentence_count"] == 3
    
    # Check paragraph content
    assert len(result["paragraphs"]) == 2
    assert result["paragraphs"][0]["content"] == "This is paragraph one."
    assert result["paragraphs"][1]["content"] == "This is paragraph two with two sentences. This is the second sentence."
    
    # Check sentence content
    assert len(result["sentences"]) == 3
    assert result["sentences"][0]["content"] == "This is paragraph one."
    assert result["sentences"][1]["content"] == "This is paragraph two with two sentences."
    assert result["sentences"][2]["content"] == "This is the second sentence."
    
    # Check document IDs are set
    assert result["paragraphs"][0]["document_id"] == document_id
    assert result["sentences"][0]["document_id"] == document_id 