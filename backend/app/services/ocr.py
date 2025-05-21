import pytesseract
import fitz 
from PIL import Image
import io, os
import logging
from typing import Union

def extract_text_from_pdf(file_path_or_bytes: Union[str, bytes]) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        file_path_or_bytes: Either a file path string or bytes of the PDF content
        
    Returns:
        Extracted text as a string
    """
    try:
        # If input is a file path
        if isinstance(file_path_or_bytes, str):
            doc = fitz.open(file_path_or_bytes)
        else:
            # If input is bytes
            doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
            
        text = ""
        for page_num, page in enumerate(doc, start=1):
            text += f"\n--- Page {page_num} ---\n"
            text += page.get_text()
        return text
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image, lang="eng")

def save_text_to_file(filename: str, text: str, save_dir: str = "data/"):
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, f"{filename}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path