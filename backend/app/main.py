from fastapi import FastAPI
from app.routes.upload import router as upload_router

app = FastAPI(
    title="TEAM_TECH Backend",
    version="1.0.0"
)

app.include_router(upload_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}