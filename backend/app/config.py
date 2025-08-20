from typing import List


class Settings:
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/workflows"
    jwt_secret_key: str = "CHANGE_ME_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    redis_url: str = "redis://redis:6379/0"
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]



