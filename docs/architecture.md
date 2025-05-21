# Architecture

This document provides a comprehensive overview of the document research and theme identification application architecture.

## System Overview

It is a web application that enables users to:

1. Upload and manage documents
2. Query documents using natural language
3. Identify common themes across documents
4. View citations at various levels of granularity (document, paragraph, sentence)

The application follows a client-server architecture with a clear separation between the frontend and backend components.

## Architecture Diagram
![Architecture](/images/Architecture.png)


## Backend Architecture

The backend uses FastAPI as the web framework and follows a modular, layered architecture.

### Directory Structure

```
backend/
├── app/
│   │
│   ├── api/                          # API endpoints
│   │   ├── documents.py              # Document retrieval endpoints
│   │   ├── query.py                  # Query processing endpoints
│   │   ├── theme_identification.py   # Theme endpoints
│   │   └── upload.py                 # Document upload endpoints
│   │
│   ├── core/                         # Core application components
│   │   └── init_db.py                # Database configuration
│   │
│   ├── models/                       # Data models
│   │   └── document.py               # Document model
│   │
│   ├── services/                     # Business logic services
│      ├── document_service.py        # Document processing
│      ├── ocr.py                     # PDF text extraction
│      ├── text_analysis.py           # Text analysis and parsing
│      ├── theme_identification.py    # Theme identification
│      │
│      └── vectorstore/ 
│          ├── build_db.py            # Vector database services
│          ├── document_indexing.py   
│          ├── gemini_embedding.py
│          ├── query_engine.py        
│          └── query_processor.py     # Vector query processing
│   
├── Dockerfile                        # Docker 
├── pyproject.toml                    # Project info
├── railway.toml                      # Railway's Configuration
├── main.py                           # Application entry point
├── config.py                         # Configuration settings
├── run.py                            # Entry Point 
└── requirements.txt                  # Project dependencies
```

### Key Components

#### 1. API Layer

The API layer consists of FastAPI routers that handle HTTP requests and responses. Each router focuses on a specific aspect of the application:

- **documents.py**: Handles document retrieval and listing
- **query.py**: Processes user queries against the document collection
- **theme_identification.py**: Manages theme identification and citation
- **upload.py**: Handles document upload and processing

#### 2. Service Layer

The service layer contains the business logic of the application:

- **DocumentService**: Manages document storage, retrieval, and processing
- **TextAnalyzer**: Analyzes document text, splitting it into paragraphs and sentences
- **ThemeIdentifier**: Identifies themes across documents using AI
- **VectorStore/QueryProcessor**: Processes queries against vector embeddings

#### 3. Data Layer

The data layer includes models and database interactions:

- **Document**: Represents a document in the system
- **ChromaDB**: Vector database for semantic search

### Key Flows

#### Document Upload Flow

1. Client uploads a PDF file to `/upload` endpoint
2. `upload.py` validates the file and passes it to DocumentService
3. DocumentService extracts text using OCR service
4. TextAnalyzer parses the document into paragraphs and sentences
5. Document content and structure are stored in the database
6. Document embeddings are created and stored in ChromaDB

#### Query and Theme Identification Flow

1. Client sends a query to `/query` endpoint
2. QueryProcessor retrieves relevant documents using vector search
3. ThemeIdentifier processes the search results to identify themes
4. Themes and query results are returned to the client

#### Theme Citation Flow

1. Client requests citations for a theme at a specific level
2. ThemeCitation service retrieves the appropriate citations
3. Citations are formatted according to the requested level (document/paragraph/sentence)
4. Formatted citations are returned to the client

## Frontend Architecture

The frontend is built with React, TypeScript, and Tailwind CSS.

### Directory Structure

```
frontend/
├── public/                             # Static assets
├── src/
│   ├── assets/                         # Images and other assets
│   ├── components/                     # React components
│   │   ├── ThemeDisplay.tsx            # Theme display component
│   │   ├── ThemeCitationVisualizer.tsx # Citation visualizer
│   │   └── ui/                         # UI components
│   ├── lib/                            # Utility functions
│   ├── services/                       # API service clients
│   │   └── api.ts                      # API client
│   ├── types/                          # TypeScript type definitions
│   └── App.tsx                         # Main application component
└── package.json                        # Project dependencies
```

### Key Components

#### 1. ThemeDisplay

ThemeDisplay is responsible for rendering the list or chart view of identified themes. It allows:

- Filtering themes by search term or document
- Toggling between list and chart views
- Loading more themes when available
- Viewing theme citations

#### 2. ThemeCitationVisualizer

ThemeCitationVisualizer displays citations for a selected theme at different granularity levels:

- Document level: Shows citation at document level
- Paragraph level: Shows citation at paragraph level
- Sentence level: Shows citation at sentence level

#### 3. API Service

The API service provides methods to interact with the backend:

- `getDocuments()`: Get all documents
- `getDocumentContent()`: Get document content
- `queryDocuments()`: Query documents and get themes
- `getThemeCitations()`: Get citations for a theme
- `uploadDocument()`: Upload a document

## Text Analysis and Citation Architecture

The multi-level citation system is a core feature of Wasserstoff. Here's how it works:

### Text Analysis Pipeline

1. **Document Processing**:
   - PDF text extraction using PyMuPDF
   - Initial text cleaning

2. **Paragraph Extraction**:
   - Text split into paragraphs based on double line breaks
   - Position tracking to maintain document location information
   - Unique ID generation for each paragraph

3. **Sentence Extraction**:
   - Each paragraph split into sentences using NLTK
   - Position tracking relative to paragraph and document
   - Unique ID generation for each sentence

### Citation Levels

1. **Document Level**:
   - Format: "document.pdf"
   - Provides document attribution with minimal granularity

2. **Paragraph Level**:
   - Format: "document.pdf, Page X, Para Y"
   - Provides page and paragraph location

3. **Sentence Level**:
   - Format: "document.pdf, Page X, Para Y, Sentence Z"
   - Provides the most precise citation

### Citation Flow

1. Theme identification produces themes with supporting documents
2. When a citation level is selected, the backend retrieves:
   - Document level: Document metadata
   - Paragraph level: Specific paragraphs with their content
   - Sentence level: Specific sentences with their content
3. Citations are formatted according to their level
4. Frontend displays the citations with appropriate UI

## Vector Search Implementation

### Embedding Process

1. Documents are parsed into chunks (paragraphs or sentences)
2. Embeddings are generated for each chunk
3. Embeddings are stored in ChromaDB with their metadata

### Query Process

1. User query is converted to an embedding
2. Vector similarity search finds the most relevant chunks
3. Results are ranked by relevance score
4. Top results are returned for processing

## AI Theme Identification

### Theme Identification Process

1. Query results are collected from vector search
2. Results are formatted into context for the AI model
3. Google's Gemini model processes the context to identify themes
4. Themes are parsed from the model's response
5. Themes are returned with supporting documents and evidence

## Testing Architecture

The testing architecture is organized into three levels:

### 1. Unit Tests

Unit tests focus on testing individual components in isolation:

- `tests/backend/unit/`: Backend unit tests
- Testing services, utilities, and isolated functions

### 2. Integration Tests

Integration tests verify the interaction between components:

- `tests/backend/integration/`: Backend integration tests
- Testing API endpoints and service coordination



## Deployment Architecture

The application can be deployed as separate services or as a monolith
