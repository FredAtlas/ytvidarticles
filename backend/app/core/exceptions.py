"""Custom exceptions and error handlers."""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from loguru import logger


class TAGException(Exception):
    """Base exception for TAG AI Platform."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ArticleNotFoundException(TAGException):
    """Article not found."""

    def __init__(self, article_id: int):
        super().__init__(
            message=f"Article with ID {article_id} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class GenerationException(TAGException):
    """Content generation failed."""

    def __init__(self, message: str):
        super().__init__(
            message=f"Content generation failed: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class QualityCheckException(TAGException):
    """Quality check failed."""

    def __init__(self, message: str):
        super().__init__(
            message=f"Quality check failed: {message}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class PublishingException(TAGException):
    """Publishing failed."""

    def __init__(self, platform: str, message: str):
        super().__init__(
            message=f"Publishing to {platform} failed: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


async def tag_exception_handler(request: Request, exc: TAGException):
    """Handle TAG custom exceptions."""
    logger.error(f"TAGException: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": exc.__class__.__name__}
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)}
    )
