from typing import Dict, Any
from app.models.route import NavigationLinks

class MapService:
    def generate_navigation_links(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float, dest_name: str) -> NavigationLinks:
        # Kakao Map Deep Link
        # Doc: https://apis.map.kakao.com/web/guide/#routeurl
        # Web: https://map.kakao.com/link/to/DestName,lat,lng
        # Mobile: kakaomap://route?sp=lat,lng&ep=lat,lng&by=PUBLICTRANSIT
        kakao_link = f"kakaomap://route?sp={start_lat},{start_lng}&ep={end_lat},{end_lng}&by=PUBLICTRANSIT"
        
        # Naver Map Deep Link
        # Doc: https://guide.ncloud-docs.com/docs/naveropenapiv3-maps-url-scheme-url-scheme
        # nmap://route/public?slat=...&slng=...&dlat=...&dlng=...&dname=...
        naver_link = f"nmap://route/public?slat={start_lat}&slng={start_lng}&dlat={end_lat}&dlng={end_lng}&dname={dest_name}"
        
        # Google Maps Deep Link
        # https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=lat,lng&travelmode=transit
        google_link = f"https://www.google.com/maps/dir/?api=1&origin={start_lat},{start_lng}&destination={end_lat},{end_lng}&travelmode=transit"
        
        return NavigationLinks(
            kakao=kakao_link,
            naver=naver_link,
            google=google_link
        )

    def get_kakao_web_fallback(self, dest_name: str, lat: float, lng: float) -> str:
        return f"https://map.kakao.com/link/to/{dest_name},{lat},{lng}"

map_service = MapService()
