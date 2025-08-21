from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from .db import engine, Base
from .services.scheduler import job_scheduler
from .services.email_monitor import email_monitor
from .services.ably_service import AblyService

app = FastAPI(title="Workflow Orchestration Engine", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
from .routers import auth, workflows, me, ws, jobs, tickets, users, emails

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(emails.router, prefix="/emails", tags=["emails"])
app.include_router(ws.router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Workflow Orchestration Engine...")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("🗄️  Database tables created successfully")
    except Exception as e:
        print(f"⚠️  Database table creation failed: {e}")
        print("📝 Make sure PostgreSQL is running and the database 'workflows' exists")
    
    # Initialize Ably realtime client
    await AblyService.init_ably_client()
    
    # Start job scheduler
    await job_scheduler.start()
    
    # Start email monitor as a background task
    asyncio.create_task(email_monitor.start_monitoring())
    
    print("✅ All services started successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown"""
    print("🛑 Shutting down Workflow Orchestration Engine...")
    
    # Stop job scheduler
    await job_scheduler.stop()
    
    # Stop email monitor
    await email_monitor.stop_monitoring()
    
    print("✅ All services stopped successfully!")


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Workflow Orchestration Engine is running"}
