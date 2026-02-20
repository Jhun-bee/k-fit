import os
import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.utils.cache import cache

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY")
        self.seoul_lat = 37.5665
        self.seoul_lon = 126.9780
        self.cache_key = "weather_seoul"
        self.cache_ttl = 3600  # 1 hour

    async def get_seoul_weather(self) -> Dict[str, Any]:
        # Check cache
        cached_weather = cache.get(self.cache_key)
        if cached_weather:
            return cached_weather

        # Try OpenWeatherMap
        weather = await self._get_from_openweather()
        
        # Fallback to Open-Meteo
        if not weather:
            weather = await self._get_from_openmeteo()

        # Default fallback if both fail
        if not weather:
            weather = {
                "temp": 20,
                "condition": "Sunny",
                "humidity": 50,
                "note": "Weather data unavailable, using defaults."
            }

        # Cache result
        cache.set(self.cache_key, weather, self.cache_ttl)
        return weather

    async def _get_from_openweather(self) -> Optional[Dict[str, Any]]:
        if not self.openweather_api_key:
            return None

        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": self.seoul_lat,
            "lon": self.seoul_lon,
            "appid": self.openweather_api_key,
            "units": "metric"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "temp": int(data["main"]["temp"]),
                    "condition": data["weather"][0]["main"],
                    "humidity": data["main"]["humidity"]
                }
        except Exception as e:
            logger.error(f"OpenWeather API failed: {e}")
            return None

    async def _get_from_openmeteo(self) -> Optional[Dict[str, Any]]:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": self.seoul_lat,
            "longitude": self.seoul_lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                current = data["current"]
                
                # Convert WMO weather code to text condition
                weather_code = current["weather_code"]
                condition = self._map_wmo_code(weather_code)

                return {
                    "temp": int(current["temperature_2m"]),
                    "condition": condition,
                    "humidity": current["relative_humidity_2m"]
                }
        except Exception as e:
            logger.error(f"Open-Meteo API failed: {e}")
            return None

    def _map_wmo_code(self, code: int) -> str:
        # Simplified WMO code mapping
        if code == 0: return "Clear"
        if code in [1, 2, 3]: return "Cloudy"
        if code in [45, 48]: return "Fog"
        if code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: return "Rain"
        if code in [71, 73, 75, 77, 85, 86]: return "Snow"
        if code in [95, 96, 99]: return "Thunderstorm"
        return "Unknown"

weather_service = WeatherService()
