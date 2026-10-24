from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routers import health, readings, stats, devices


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="IoT Fire Detection System API",
    description=(
        "Production-ready backend API for IoT Fire Detection System using ESP32 DevKit V1, "
        "IR Flame Sensor, PostgreSQL datastore, and React Dashboard."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router)
app.include_router(readings.router)
app.include_router(stats.router)
app.include_router(devices.router)


@app.get("/", tags=["Root"])
def root():
    """Returns basic API service metadata and endpoint links."""
    return {
        "service": "IoT Fire Detection System Backend",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "ingest_reading": "POST /api/readings",
            "latest_reading": "GET /api/readings/latest",
            "historical_readings": "GET /api/readings",
            "system_statistics": "GET /api/stats",
            "registered_devices": "GET /api/devices"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request.",
            "detail": str(exc) if settings.ENVIRONMENT != "production" else None
        }
    )
