from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import logging
from app.models.route import RouteResponse, RoutePlan, RouteStep, TransitInfo
from app.services.odsay_service import odsay_service
from app.services.map_service import map_service
from app.services.openai_service import openai_service
from app.api.stores import STORES # Provide access to store data

logger = logging.getLogger(__name__)
router = APIRouter()

class QuickRouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_store_id: str

class RoutePlanRequest(BaseModel):
    start_lat: float
    start_lng: float
    store_ids: List[str]
    language: str = "en"

def get_store_by_id(store_id: str):
    for store in STORES:
        if store.id == store_id:
            return store
    return None

@router.post("/quick", response_model=TransitInfo)
async def get_quick_route(request: QuickRouteRequest):
    if not STORES:
        raise HTTPException(status_code=503, detail="Route service unavailable (No static stores)")
        
    store = get_store_by_id(request.end_store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    transit = await odsay_service.get_transit_route(
        request.start_lat, request.start_lng,
        store.location.lat, store.location.lng
    )
    
    links = map_service.generate_navigation_links(
        request.start_lat, request.start_lng,
        store.location.lat, store.location.lng,
        store.name.en
    )
    
    return TransitInfo(
        method=transit["method"],
        duration_min=transit["duration_min"],
        odsay_summary=transit["odsay_summary"],
        navigation_links=links
    )

@router.post("/plan", response_model=RouteResponse)
async def plan_shopping_route(request: RoutePlanRequest):
    if not STORES:
        raise HTTPException(status_code=503, detail="Route service unavailable (No static stores)")

    if not request.store_ids:
        raise HTTPException(status_code=400, detail="No stores selected")
    
    selected_stores = [get_store_by_id(sid) for sid in request.store_ids if get_store_by_id(sid)]
    
    if not selected_stores:
        raise HTTPException(status_code=404, detail="No valid stores found")

    # 1. Optimize Order using GPT-4o (Solving TSP heuristically)
    # Construct context for GPT
    store_locations = [
        {"id": s.id, "name": s.name.en, "lat": s.location.lat, "lng": s.location.lng, "hours": s.hours.open + "-" + s.hours.close}
        for s in selected_stores
    ]
    
    start_loc = {"lat": request.start_lat, "lng": request.start_lng}
    
    prompt = f"""
    Optimize the visiting order for a shopping trip in Seoul.
    Start Location: {start_loc}
    Stores to Visit: {json.dumps(store_locations)}
    
    Task: Return the optimal sequence of store IDs to minimize travel time and fit within opening hours.
    Return JSON ONLY: {{"order": ["store_id_1", "store_id_2", ...]}}
    """
    
    try:
        response = await openai_service.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        optimized_order_ids = json.loads(content)["order"]
    except Exception as e:
        logger.error(f"Route optimization failed: {e}")
        # Fallback: maintain original selection order
        optimized_order_ids = request.store_ids

    # 2. Build Route Steps
    steps = []
    current_lat, current_lng = request.start_lat, request.start_lng
    total_time = 0
    
    for idx, sid in enumerate(optimized_order_ids):
        store = get_store_by_id(sid)
        if not store: continue
        
        # Get transit from current loc to this store
        transit = await odsay_service.get_transit_route(
            current_lat, current_lng,
            store.location.lat, store.location.lng
        )
        
        links = map_service.generate_navigation_links(
            current_lat, current_lng,
            store.location.lat, store.location.lng,
            store.name.en
        )
        
        transit_info = TransitInfo(
            method=transit["method"],
            duration_min=transit["duration_min"],
            odsay_summary=transit["odsay_summary"],
            navigation_links=links
        )
        
        # Assume 45 mins shopping time per store
        shopping_time = 45
        total_time += transit["duration_min"] + shopping_time
        
        # Mock arrival time calculation (start at 10:00 AM)
        # Real impl would use datetime
        arrival_time = "10:00 AM" # Placeholder
        
        steps.append(RouteStep(
            order=idx + 1,
            store_id=store.id,
            store_name=store.name.en, # Should use language pref
            arrival_time=arrival_time,
            shopping_time_min=shopping_time,
            transit_to_next=transit_info # Note: This is transit TO this store from previous point
        ))
        
        # Update current loc
        current_lat, current_lng = store.location.lat, store.location.lng

    route_plan = RoutePlan(
        total_time_min=total_time,
        total_stores=len(steps),
        schedule=steps,
        tips=["Wear comfortable shoes!", "Check for tax refund at these stores."]
    )

    return RouteResponse(route=route_plan)
