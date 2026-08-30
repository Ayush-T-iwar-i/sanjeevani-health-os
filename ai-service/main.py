from fastapi import FastAPI
from routes.triage_ai import router as triage_router

app = FastAPI(title="Sanjeevani AI Service", version="0.1.0")

app.include_router(triage_router, prefix="/api/ai")

@app.get("/health")
def health():
    return {"status": "ok", "service": "sanjeevani-ai"}
