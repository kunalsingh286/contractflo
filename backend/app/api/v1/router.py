"""API v1 routes."""

from fastapi import APIRouter

from app.api import contracts
from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(contracts.router)
