import logging
import hashlib
import nltk
from typing import List, Dict, Any
from nltk.tokenize import sent_tokenize
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

logger = logging.getLogger(__name__)

def generate_text_id(text: str) -> str:
    content_sample = text.strip()[:100].strip()
    hash_obj = hashlib.md5(content_sample.encode())
    return hash_obj.hexdigest()[:12]

class TextAnalyzer:
    @staticmethod
    def split_into_paragraphs(text: str) -> List[Dict[str, Any]]:
        paragraphs = []
        text = text.replace('\r\n', '\n')
        raw_paragraphs = text.split('\n\n')
        start_pos = 0
        for i, para in enumerate(raw_paragraphs):
            para = para.strip()
            if not para:
                start_pos += 2
                continue
            para_pos = text.find(para, start_pos)
            if para_pos == -1:
                continue
            end_pos = para_pos + len(para)
            paragraphs.append({
                "index": i,
                "content": para,
                "position": {
                    "start": para_pos,
                    "end": end_pos
                }
            })
            start_pos = end_pos
        logger.debug(f"Split document into {len(paragraphs)} paragraphs")
        return paragraphs

    @staticmethod
    def split_paragraph_into_sentences(paragraph: Dict[str, Any]) -> List[Dict[str, Any]]:
        content = paragraph["content"]
        para_start = paragraph["position"]["start"]
        sentence_texts = sent_tokenize(content)
        sentences = []
        start_pos = 0
        for i, sent_text in enumerate(sentence_texts):
            sent_pos = content.find(sent_text, start_pos)
            if sent_pos == -1:
                continue
            abs_start = para_start + sent_pos
            abs_end = abs_start + len(sent_text)
            sentences.append({
                "index": i,
                "paragraph_index": paragraph["index"],
                "content": sent_text,
                "position": {
                    "start": abs_start,
                    "end": abs_end
                },
                "id": generate_text_id(sent_text)
            })
            start_pos = sent_pos + len(sent_text)
        return sentences

    @staticmethod
    def analyze_document(document_id: int, text: str) -> Dict[str, Any]:
        try:
            paragraphs = TextAnalyzer.split_into_paragraphs(text)
            sentences = []
            for paragraph in paragraphs:
                paragraph_sentences = TextAnalyzer.split_paragraph_into_sentences(paragraph)
                sentences.extend(paragraph_sentences)
                paragraph["id"] = generate_text_id(paragraph["content"])
                paragraph["document_id"] = document_id
            for sentence in sentences:
                sentence["document_id"] = document_id
            return {
                "document_id": document_id,
                "paragraphs": paragraphs,
                "sentences": sentences,
                "statistics": {
                    "paragraph_count": len(paragraphs),
                    "sentence_count": len(sentences)
                }
            }
        except Exception as e:
            logger.error(f"Error analyzing document {document_id}: {str(e)}")
            return {
                "document_id": document_id,
                "error": str(e),
                "paragraphs": [],
                "sentences": []
            } 