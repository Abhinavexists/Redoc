FROM python:3.10-slim

# Create a non-root user
RUN useradd -m appuser

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies as root
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Change ownership of files to the non-root user
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["python", "run.py"]
