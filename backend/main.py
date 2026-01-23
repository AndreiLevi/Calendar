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

# Try to import pyswisseph-dependent agents
try:
    from agents.muhurtas_agent import MuhurtasAgent
    from agents.transits_agent import TransitsAgent
    SWISSEPH_AVAILABLE = True
except ImportError as e:
    print(f"Warning: pyswisseph not available, muhurtas and transits disabled: {e}")
    MuhurtasAgent = None
    TransitsAgent = None
    SWISSEPH_AVAILABLE = False

# Try to import task service (may fail if tables don't exist)
try:
    from services.task_service import TaskService, TaskCreate, TaskUpdate, TaskStatus, TaskType
    TASK_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: TaskService import failed: {e}")
    TaskService = None
    TASK_SERVICE_AVAILABLE = False

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

# Initialize pyswisseph-dependent agents (only if available)
muhurtas_agent = MuhurtasAgent() if SWISSEPH_AVAILABLE and MuhurtasAgent else None
transits_agent = TransitsAgent() if SWISSEPH_AVAILABLE and TransitsAgent else None

# Initialize Profile Service
try:
    profile_service = ProfileService()
except ValueError as e:
    print(f"Warning: ProfileService not initialized: {e}")
    profile_service = None

# Initialize Task Service
task_service = None
if TASK_SERVICE_AVAILABLE and TaskService:
    try:
        task_service = TaskService()
    except ValueError as e:
        print(f"Warning: TaskService not initialized: {e}")

class DateRequest(BaseModel):
    dob: str
    date: str
    name: str = "User"
    language: str = "ru" # Default to Russian
    birth_time: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    return {
        "status": "ok", 
        "service": "Calendar Orchestrator",
        "services": {
            "profile": profile_service is not None,
            "tasks": task_service is not None,
            "muhurtas": muhurtas_agent is not None,
            "transits": transits_agent is not None,
            "pyswisseph": SWISSEPH_AVAILABLE
        }
    }

class MuhurtasRequest(BaseModel):
    latitude: float
    longitude: float
    datetime_str: Optional[str] = None  # ISO format, defaults to now
    language: str = "ru"

@app.post("/api/muhurtas")
def get_muhurtas(request: MuhurtasRequest):
    """Get planetary hours (Hora), Rahu Kala, Brahma Muhurta for given location"""
    if not muhurtas_agent:
        raise HTTPException(status_code=503, detail="Muhurtas service unavailable (pyswisseph not installed)")
    
    from datetime import datetime, timezone
    
    try:
        if request.datetime_str:
            dt = datetime.fromisoformat(request.datetime_str.replace('Z', '+00:00'))
        else:
            dt = datetime.now(timezone.utc)
        
        result = muhurtas_agent.get_all_muhurtas(
            dt, 
            request.latitude, 
            request.longitude, 
            request.language
        )
        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hora")
def get_current_hora(latitude: float, longitude: float, language: str = "ru"):
    """Quick endpoint to get just the current planetary hour"""
    if not muhurtas_agent:
        raise HTTPException(status_code=503, detail="Hora service unavailable (pyswisseph not installed)")
    
    from datetime import datetime, timezone
    
    try:
        dt = datetime.now(timezone.utc)
        hora = muhurtas_agent.get_current_hora(dt, latitude, longitude, language)
        return {"success": True, "hora": hora}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transits")
def get_transits(language: str = "ru"):
    """Get current planetary positions (transits)"""
    if not transits_agent:
        raise HTTPException(status_code=503, detail="Transits service unavailable (pyswisseph not installed)")
    
    from datetime import datetime, timezone
    
    try:
        dt = datetime.now(timezone.utc)
        positions = transits_agent.get_current_positions(dt, language)
        significant = transits_agent.get_significant_transits(dt, language)
        return {
            "success": True,
            "positions": positions,
            "significant_transits": significant
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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

        # Calculate Birth Chart if data available
        birth_chart = None
        if request.birth_time and request.latitude and request.longitude:
            try:
                birth_chart = jyotish_agent.calculate_birth_chart(
                    birth_date=request.dob,
                    birth_time=request.birth_time,
                    latitude=request.latitude,
                    longitude=request.longitude
                )
            except Exception as e:
                print(f"Error calculating birth chart for analysis: {e}")

        # 2. Synthesize with AI
        numerology_full = {"profile": num_profile, "daily_insight": num_insight}
        result = orchestrator.synthesize_daily_strategy(
            numerology=numerology_full,
            mayan=mayan_data,
            jyotish=jyotish_data,
            user_name=request.name,
            language=request.language,
            birth_chart=birth_chart
        )
        
        # Handle backward compatibility if it returns just string (unlikely with recent change but safe)
        if isinstance(result, dict):
            strategy_text = result.get("strategy")
            debug_prompt = result.get("debug_prompt")
        else:
            strategy_text = result
            debug_prompt = "Not available"

        return {
            "strategy": strategy_text,
            "debug_prompt": debug_prompt,
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
        # Return error as JSON instead of 500 for better visibility in Frontend
        return {
            "success": False, 
            "error": str(e),
            "traceback": traceback.format_exc()
        }

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

# ==================== TASK MANAGEMENT ====================

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: str = "flexible"  # rigid, flexible, recurring, intention
    scheduled_at: Optional[str] = None
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None
    project_id: Optional[str] = None
    life_sphere: Optional[str] = None

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None
    project_id: Optional[str] = None
    life_sphere: Optional[str] = None

@app.get("/api/tasks")
async def get_tasks(
    user_id: str = Header(..., alias="X-User-Id"),
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    life_sphere: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = 100
):
    """Get user's tasks with optional filters"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        status_enum = TaskStatus(status) if status else None
        type_enum = TaskType(task_type) if task_type else None
        tasks = await task_service.get_tasks(
            user_id, status_enum, type_enum, life_sphere, project_id, limit
        )
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(
    request: TaskCreateRequest,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Create a new task"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        from datetime import datetime, date as date_type
        task_data = TaskCreate(
            title=request.title,
            description=request.description,
            task_type=TaskType(request.task_type),
            scheduled_at=datetime.fromisoformat(request.scheduled_at) if request.scheduled_at else None,
            due_date=date_type.fromisoformat(request.due_date) if request.due_date else None,
            estimated_duration=request.estimated_duration,
            project_id=request.project_id,
            life_sphere=request.life_sphere
        )
        task = await task_service.create_task(user_id, task_data)
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task(
    task_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Get a single task"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        task = await task_service.get_task(user_id, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"task": task}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}")
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Update a task"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        from datetime import datetime, date as date_type
        updates = TaskUpdate(
            title=request.title,
            description=request.description,
            task_type=TaskType(request.task_type) if request.task_type else None,
            status=TaskStatus(request.status) if request.status else None,
            scheduled_at=datetime.fromisoformat(request.scheduled_at) if request.scheduled_at else None,
            due_date=date_type.fromisoformat(request.due_date) if request.due_date else None,
            estimated_duration=request.estimated_duration,
            project_id=request.project_id,
            life_sphere=request.life_sphere
        )
        task = await task_service.update_task(user_id, task_id, updates)
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Delete a task"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        await task_service.delete_task(user_id, task_id)
        return {"success": True, "message": "Task deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Mark a task as completed"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        task = await task_service.complete_task(user_id, task_id)
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/{task_id}/start")
async def start_task(
    task_id: str,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Mark a task as in progress"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        task = await task_service.start_task(user_id, task_id)
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/{task_id}/snooze")
async def snooze_task(
    task_id: str,
    snooze_until: Optional[str] = None,
    user_id: str = Header(..., alias="X-User-Id")
):
    """Snooze a task"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        from datetime import datetime
        snooze_dt = datetime.fromisoformat(snooze_until) if snooze_until else None
        task = await task_service.snooze_task(user_id, task_id, snooze_dt)
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/today")
async def get_today_tasks(user_id: str = Header(..., alias="X-User-Id")):
    """Get pending tasks for today"""
    if not task_service:
        raise HTTPException(status_code=503, detail="Task service unavailable")
    try:
        tasks = await task_service.get_pending_tasks_for_today(user_id)
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
