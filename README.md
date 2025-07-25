# Redoc

Document research and theme identification application with multi-level citation capabilities.

## Overview

Redoc is a chatbot-style application that can:

1. Analyze 75+ documents
2. Identify common themes across documents
3. Provide cited responses to queries
4. Support multi-level citation (document, paragraph, sentence)

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Document Processing**: Langchain, ChromaDB, Postgresql

## Project Structure

- `backend/`: FastAPI backend service
- `frontend/`: React frontend application
- `tests/`: Test suite (backend unit/integration, frontend unit, E2E tests)
- `docs/`: Documentation (API docs, user guide)
- `dataset/`: Sample documents (PDF files)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Abhinavexists/Redoc.git
   cd Redoc
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

   **Recommended**: Install with `uv` (faster, more reliable):

   ```bash
   cd backend
   uv venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e .
   ```

   This method leverages the `pyproject.toml` file for more consistent dependency management.

3. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```
  
### Running the Application

#### Backend

```bash
# (http://localhost:8000)
cd backend 
python run.py
```

#### Frontend

```bash
# Frontend (http://localhost:3000)
npm run dev
```

## Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user.md)
- [Architecture](docs/architecture.md)
- [Test](tests/test.md)

## Demo

[video](https://github.com/user-attachments/assets/4098ea40-ea06-426f-9f17-063a5af8265f)

## License

MIT
