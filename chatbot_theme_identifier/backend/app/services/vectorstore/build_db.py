from app.services.vectorstore.document_indexing import build_vector_store

result = build_vector_store("data")
if result is None:
    print("Vector store was not created. Upload documents to create a vector store.")
else:
    print('Continue with the next step')