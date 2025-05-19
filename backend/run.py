import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        timeout_keep_alive=120,  # Increase keep-alive timeout to 2 minutes
        limit_concurrency=10,    # Limit concurrent connections
        backlog=100              # Allow more pending connections
    ) 