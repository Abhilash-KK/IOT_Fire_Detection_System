# ==============================================================================
# IoT Fire Detection System - Backend Dockerfile for Render Web Service
# ==============================================================================
FROM python:3.12-slim as base

# Set environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (including curl for container health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code and Alembic migrations
COPY backend /app/backend
COPY alembic.ini /app/alembic.ini

# Expose server port
EXPOSE 8000

# Health check using FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Production startup: automatically apply Alembic migrations on startup, then start Uvicorn
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
