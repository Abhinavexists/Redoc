import os
import shutil
from langchain_chroma import Chroma
from .gemini_embeddings import GeminiEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LC_Document

CHROMA_DB_PATH = "chroma_store"

def build_vector_store(directory_path: str = "data/"):
    all_docs = []
    
    if not os.path.isabs(directory_path):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.abspath(os.path.join(current_dir, "../../../"))
        directory_path = os.path.join(backend_dir, directory_path)
    
    print(f"Looking for text files in: {directory_path}")
    
    if not os.path.exists(directory_path):
        print(f"Directory {directory_path} does not exist. Creating it.")
        os.makedirs(directory_path, exist_ok=True)
        return None
    
    txt_files = [f for f in os.listdir(directory_path) if f.endswith(".txt")]
    if not txt_files:
        print(f"No .txt files found in {directory_path}. Vector store creation skipped.")
        return None
    
    print(f"Found {len(txt_files)} text files: {', '.join(txt_files)}")
    
    for filename in txt_files:
        path = os.path.join(directory_path, filename)
        try:
            loader = TextLoader(path)
            documents = loader.load()

            for doc in documents:
                doc.metadata["filename"] = filename
            all_docs.extend(documents)
            print(f"Processed {filename}: {len(documents)} document chunks")
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")

    if not all_docs:
        print("No documents were loaded. Vector store creation skipped.")
        return None
    
    print(f"Total document chunks: {len(all_docs)}")
    
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        split_docs = text_splitter.split_documents(all_docs)
        print(f"Split into {len(split_docs)} chunks")

        if os.path.exists(CHROMA_DB_PATH):
            print(f"Removing existing vector store at {CHROMA_DB_PATH}")
            shutil.rmtree(CHROMA_DB_PATH)

        print("Creating vector store with embeddings...")
        embedding_function = GeminiEmbeddings()
        
        vectordb = Chroma.from_documents(
            documents=split_docs,
            embedding=embedding_function,
            persist_directory=CHROMA_DB_PATH
        )
            
        print(f"Vector store created successfully at {CHROMA_DB_PATH}")
        return vectordb
    except Exception as e:
        print(f"Error creating vector store: {str(e)}")
        return None