import pytesseract
import fitz 
from PIL import Image
import io, os

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page_num, page in enumerate(doc, start=1):
        text += f"\n--- Page {page_num} ---\n"
        text += page.get_text()
    return text

def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image, lang="eng")

def save_text_to_file(filename: str, text: str, save_dir: str = "data/"):
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, f"{filename}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path