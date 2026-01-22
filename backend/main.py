import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from agents.numerology_expert import NumerologyExpertAgent
from agents.mayan_agent import MayanAgent
from agents.jyotish_agent import JyotishAgent
from orchestrator import StrategyOrchestrator
from services.profile_service import ProfileService

app = FastAPI(title="Calendar Orchestrator API")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents and Services
numerology_agent = NumerologyExpertAgent()
mayan_agent = MayanAgent()
jyotish_agent = JyotishAgent()
orchestrator = StrategyOrchestrator()

# Initialize Profile Service
try:
    profile_service = ProfileService()
except ValueError as e:
    print(f"Warning: ProfileService not initialized: {e}")
    profile_service = None

class DateRequest(BaseModel):
    dob: str
    date: str
    name: str = "User"
    language: str = "ru" # Default to Russian

class ProfileCreate(BaseModel):
    profile_name: str = "Main Profile"
    birth_date: str
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    birth_lat: Optional[float] = None
    birth_lng: Optional[float] = None
    birth_timezone: Optional[str] = None
    is_active: bool = True

class ProfileUpdate(BaseModel):
    profile_name: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    birth_lat: Optional[float] = None
    birth_lng: Optional[float] = None
    birth_timezone: Optional[str] = None
    is_active: Optional[bool] = None

class BirthChartRequest(BaseModel):
    birth_date: str
    birth_time: str
    latitude: float
    longitude: float

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Calendar Orchestrator"}

@app.post("/api/numerology")
def get_numerology(request: DateRequest):
    # Backward compatibility
    try:
        profile = numerology_agent.get_profile(request.dob, request.name)
        insight = numerology_agent.get_daily_insight(request.dob, request.date)
        return {
            "profile": profile,
            "daily_insight": insight
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
def analyze_day(request: DateRequest):
    try:
        # 1. Gather Data (Parallelizable in future)
        num_profile = numerology_agent.get_profile(request.dob, request.name)
        num_insight = numerology_agent.get_daily_insight(request.dob, request.date)
        
        mayan_data = mayan_agent.calculate_tzolkin(request.date)
        
        jyotish_data = jyotish_agent.calculate_panchanga(request.date)

        # 2. Synthesize with AI
        numerology_full = {"profile": num_profile, "daily_insight": num_insight}
        strategy_text = orchestrator.synthesize_daily_strategy(
            numerology=numerology_full,
            mayan=mayan_data,
            jyotish=jyotish_data,
            user_name=request.name,
            language=request.language
        )

        return {
            "strategy": strategy_text,
            "data": {
                "numerology": numerology_full,
                "mayan": mayan_data,
                "jyotish": jyotish_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/birth-chart")
def calculate_birth_chart(request: BirthChartRequest):
    """Calculate natal chart using birth time and location"""
    try:
        chart_data = jyotish_agent.calculate_birth_chart(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            latitude=request.latitude,
            longitude=request.longitude
        )
        return {"success": True, "chart": chart_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug-jyotish")
def debug_jyotish():
    """Manual trigger to test Birth Chart Calculation and see traceback"""
    try:
        # Test Case: Moscow, 2000-01-01 12:00
        result = jyotish_agent.calculate_birth_chart(
            birth_date="2000-01-01",
            birth_time="12:00",
            latitude=55.7558,
            longitude=37.6173
        )
        return {"status": "success", "result": result}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

# Profile Management Endpoints

@app.post("/api/profiles")
async def create_profile(profile_data: ProfileCreate, user_id: str = Header(..., alias="X-User-Id")):
    """Create a new birth profile"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        profile = await profile_service.create_profile(user_id, profile_data.dict())
        return {"success": True, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles")
async def get_profiles(user_id: str = Header(..., alias="X-User-Id")):
    """Get all profiles for a user"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        profiles = await profile_service.get_all_profiles(user_id)
        return {"profiles": profiles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles/active")
async def get_active_profile(user_id: str = Header(..., alias="X-User-Id")):
    """Get the active profile for a user"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        profile = await profile_service.get_active_profile(user_id)
        if profile:
            return {"profile": profile}
        else:
            return {"profile": None, "message": "No active profile found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Update a profile"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        # Filter out None values
        updates = {k: v for k, v in profile_data.dict().items() if v is not None}
        profile = await profile_service.update_profile(user_id, profile_id, updates)
        return {"success": True, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profiles/{profile_id}/switch")
async def switch_profile(
    profile_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Switch to a different profile"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        profile = await profile_service.switch_profile(user_id, profile_id)
        return {"success": True, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Delete a profile"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        await profile_service.delete_profile(user_id, profile_id)
        return {"success": True, "message": "Profile deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
async def get_logs(user_id: str = Header(..., alias="X-User-Id"), limit: int = 50):
    """Get recent action logs"""
    if not profile_service:
        raise HTTPException(status_code=503, detail="Profile service unavailable")
    try:
        logs = await profile_service.get_recent_logs(user_id, limit)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
