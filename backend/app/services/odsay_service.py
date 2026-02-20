import os
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ODsayService:
    def __init__(self):
        self.api_key = os.getenv("ODSAY_API_KEY")
        self.base_url = "https://api.odsay.com/v1/api"

    async def get_transit_route(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "method": "Unknown",
                "duration_min": 0,
                "odsay_summary": "ODsay API Key missing"
            }

        endpoint = "/searchPubTransPathT"
        params = {
            "apiKey": self.api_key,
            "SX": start_lng,
            "SY": start_lat,
            "EX": end_lng,
            "EY": end_lat,
            "opt": 0, # 0: Sort by time
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}{endpoint}", params=params, timeout=5.0)
                
                if response.status_code != 200:
                    logger.error(f"ODsay API failed: {response.status_code} {response.text}")
                    return {
                        "method": "Train/Bus",
                        "duration_min": 30, # Fallback estimate
                        "odsay_summary": "Transit info unavailable"
                    }
                
                data = response.json()
                
                if "result" not in data or "path" not in data["result"]:
                     return {
                        "method": "Walking/Taxi",
                        "duration_min": 15,
                        "odsay_summary": "No direct transit found"
                    }

                best_path = data["result"]["path"][0]
                info = best_path["info"]
                
                # Determine main method
                path_type = best_path["pathType"] # 1: Subway, 2: Bus, 3: Mixed
                method = "Subway" if path_type == 1 else "Bus" if path_type == 2 else "Bus+Subway"
                
                # Format summary
                total_time = info["totalTime"]
                payment = info["payment"]
                
                return {
                    "method": method,
                    "duration_min": total_time,
                    "odsay_summary": f"{method}, approx {total_time} mins, {payment} KRW"
                }

        except Exception as e:
            logger.error(f"ODsay service error: {e}")
            return {
                "method": "Unknown",
                "duration_min": 0,
                "odsay_summary": "Service error"
            }

odsay_service = ODsayService()
