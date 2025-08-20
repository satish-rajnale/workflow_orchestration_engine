import json
from typing import Any, Optional
import redis
from ..config import Settings


class RedisCache:
    def __init__(self) -> None:
        self.client = redis.Redis.from_url(Settings.redis_url, decode_responses=True)

    def get_json(self, key: str) -> Optional[Any]:
        data = self.client.get(key)
        if not data:
            return None
        try:
            return json.loads(data)
        except Exception:
            return None

    def set_json(self, key: str, value: Any, ex_seconds: int | None = 3600) -> None:
        self.client.set(key, json.dumps(value), ex=ex_seconds)

    def delete(self, key: str) -> None:
        self.client.delete(key)


cache = RedisCache()
