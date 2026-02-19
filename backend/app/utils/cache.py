import time
from typing import Any, Optional, Dict

class TTLCache:
    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}

    def set(self, key: str, value: Any, ttl: int) -> None:
        self._cache[key] = value
        self._expiry[key] = time.time() + ttl

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        
        if time.time() > self._expiry[key]:
            self.pud(key)
            return None
            
        return self._cache[key]
    
    def pud(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]
        if key in self._expiry:
            del self._expiry[key]

    def clear(self) -> None:
        self._cache.clear()
        self._expiry.clear()

cache = TTLCache()
