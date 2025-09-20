from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stt import router as stt_router
from generate import router as generate_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(stt_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
