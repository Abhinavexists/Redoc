import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../..")))

from .document_indexing import build_vector_store

result = build_vector_store("data/")
if result is None:
    print("Vector store was not created. Upload documents to create a vector store.")
else:
    print("Vector store created successfully.")
