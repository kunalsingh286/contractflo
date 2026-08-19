"""ContractFlo API application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware
from app.core.rate_limit import limiter
from app.core.version import APP_VERSION


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    yield

def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )
    
    # Configure rate limiter
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Standardize exception responses
    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": str(exc.status_code),
                    "message": str(exc.detail),
                    "request_id": getattr(request.state, "request_id", "unknown")
                }
            }
        )
        
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "422",
                    "message": "Validation Error",
                    "details": exc.errors(),
                    "request_id": getattr(request.state, "request_id", "unknown")
                }
            }
        )

    @application.exception_handler(Exception)
    async def generic_exception_handler(request, exc):
        import traceback
        traceback.print_exc()
        # Do not expose raw python exceptions to the frontend in production
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "500",
                    "message": "Internal Server Error",
                    "request_id": getattr(request.state, "request_id", "unknown")
                }
            }
        )

    application.add_middleware(RequestIDMiddleware)
    
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return application


app = create_app()
