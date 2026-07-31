from fastapi import FastAPI

app = FastAPI(
    title="TEAM_TECH Backend",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}