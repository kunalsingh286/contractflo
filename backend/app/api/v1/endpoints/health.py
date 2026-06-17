"""Health check endpoints."""

from fastapi import APIRouter

from app.core.version import APP_VERSION

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "contractflo-api",
        "version": APP_VERSION,
    }
