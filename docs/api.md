# API Documentation

This document provides information about the API endpoints available in the Redoc document research and theme identification application.

## Base URL

All API endpoints are available at the backend service URL, typically:

- Development: `http://localhost:8000`
- Production: `https://redoc-backend-production.up.railway.app/`

## Endpoints

### Document Management

#### `GET /documents`

Retrieve a list of all uploaded documents.

**Response:**

```json
{
  "documents": [
    {
      "id": 1,
      "filename": "document1.pdf",
      "title": "Document 1",
      "size": 1024,
      "upload_date": "2023-05-01"
    }
  ]
}
```

#### `GET /documents/{document_id}`

Retrieve a specific document's content.

**Parameters:**

- `document_id` (path): The ID of the document

**Response:**

```json
{
  "id": 1,
  "filename": "document1.pdf",
  "title": "Document 1",
  "content": "Document content...",
  "paragraphs": [
    { 
      "id": "para-id-1", 
      "content": "Paragraph content...", 
      "index": 0 
    }
  ]
}
```

#### `POST /upload`

Upload a new document.

**Request Body:**

- Form data with:
  - `file`: The document file to upload

**Response:**

```json
{
  "id": 1,
  "filename": "uploaded_document.pdf",
  "message": "Document uploaded successfully"
}
```

### Query and Themes

#### `POST /query`

Query documents and generate themes.

**Request Body:**

```json
{
  "query": "What are the main policy recommendations?",
  "citation_level": "paragraph"  // Optional: "document", "paragraph", or "sentence"
}
```

**Response:**

```json
{
  "query": "What are the main policy recommendations?",
  "results": [
    {
      "document_id": 1,
      "filename": "document1.pdf",
      "matched_text": "Matched content from the document...",
      "relevance": 0.92
    }
  ],
  "themes": [
    {
      "id": 1,
      "theme_name": "Theme Name",
      "summary": "Theme summary...",
      "supporting_documents": ["document1.pdf", "document2.pdf"]
    }
  ]
}
```

### Theme Citations

#### `GET /themes/{theme_id}/citations`

Get citations for a theme at different granularity levels.

**Parameters:**

- `theme_id` (path): The ID of the theme
- `citation_level` (query): The citation granularity level (document, paragraph, or sentence)

**Response:**

```json
{
  "theme_id": 1,
  "citation_level": "paragraph",
  "citations": [
    {
      "theme_id": 1,
      "document_id": 1,
      "citation_type": "paragraph",
      "reference_id": "para-id-1",
      "content": "Paragraph content...",
      "relevance": 0.85,
      "citation": "document1.pdf, Page 1, Para 2",
      "paragraph_index": 2,
      "sentence_index": null
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: The request was malformed
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An error occurred on the server

## Example Usage

### Query Documents

```javascript
// JavaScript Example
const response = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What are the main policy recommendations?',
    citation_level: 'paragraph'
  })
});
const data = await response.json();
console.log(data.themes);
```

### Get Theme Citations

```javascript
// JavaScript Example
const themeId = 1;
const response = await fetch(`http://localhost:8000/themes/${themeId}/citations?citation_level=sentence`);
const data = await response.json();
console.log(data.citations);
```
