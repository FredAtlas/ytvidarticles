"""
Application settings and configuration management.
Uses Pydantic for validation and environment variable loading.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "TAG AI Platform"
    version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    log_level: str = "INFO"

    # API
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5173",
    ]

    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 300  # 5 minutes default

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # OpenAI
    openai_api_key: str
    openai_org_id: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    max_tokens_per_request: int = 4000
    ai_generation_timeout: int = 300  # 5 minutes

    # Perplexity
    perplexity_api_key: Optional[str] = None

    # Ollama (Local AI)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"

    # ElevenLabs (Audio)
    elevenlabs_api_key: Optional[str] = None

    # Gaming APIs
    steam_api_key: Optional[str] = None
    igdb_client_id: Optional[str] = None
    igdb_client_secret: Optional[str] = None
    twitch_client_id: Optional[str] = None
    twitch_client_secret: Optional[str] = None

    # WordPress Publishing
    wordpress_api_url: str = "https://twoaveragegamers.com/wp-json/wp/v2"
    wordpress_username: Optional[str] = None
    wordpress_app_password: Optional[str] = None

    # Social Media
    twitter_api_key: Optional[str] = None
    twitter_api_secret: Optional[str] = None
    twitter_access_token: Optional[str] = None
    twitter_access_secret: Optional[str] = None
    facebook_access_token: Optional[str] = None
    facebook_page_id: Optional[str] = None

    # Storage
    upload_dir: str = "./data/uploads"
    max_file_size: int = 52428800  # 50MB
    allowed_file_types: list[str] = [".jpg", ".jpeg", ".png", ".gif", ".mp3", ".wav", ".txt", ".md"]
    s3_bucket: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None

    # Performance
    max_concurrent_generations: int = 5
    content_quality_threshold: float = 0.85

    # Features
    enable_ab_testing: bool = False
    enable_voice_commands: bool = False
    enable_offline_mode: bool = False

    # Monitoring
    sentry_dsn: Optional[str] = None
    enable_metrics: bool = True
    prometheus_port: int = 9090

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
