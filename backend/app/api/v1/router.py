"""API v1 routes."""

from fastapi import APIRouter

from app.api import contracts, copilot, intelligence, obligations, risks, search
from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(contracts.router)
api_router.include_router(intelligence.router)
api_router.include_router(risks.router)
api_router.include_router(obligations.router)
api_router.include_router(copilot.router)
api_router.include_router(search.router)
