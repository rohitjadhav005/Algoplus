"""
AlgoPulse FastAPI Backend — Python 3.13
Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import metrics, data, transforms

app = FastAPI(
    title="AlgoPulse API",
    description="Python ML computation backend for AlgoPulse. Requires Python 3.13+.",
    version="1.0.0",
)

# Allow the Vite dev server (port 5173) and any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(transforms.router, prefix="/api/transforms", tags=["transforms"])


@app.get("/")
async def root():
    return {"message": "AlgoPulse API is running", "python_version": "3.13", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
