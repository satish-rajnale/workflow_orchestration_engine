from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import Settings

app = FastAPI(title="Workflow Orchestration Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=Settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Routers will be included after they are created to avoid import errors
from .routers import auth, workflows, me, ws
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(ws.router)



from .db import Base, engine
Base.metadata.create_all(bind=engine)
