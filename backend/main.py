import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.numerology_expert import NumerologyExpertAgent
from agents.mayan_agent import MayanAgent
from agents.jyotish_agent import JyotishAgent
from orchestrator import StrategyOrchestrator

app = FastAPI(title="Calendar Orchestrator API")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents
numerology_agent = NumerologyExpertAgent()
mayan_agent = MayanAgent()
jyotish_agent = JyotishAgent()
orchestrator = StrategyOrchestrator()

class DateRequest(BaseModel):
    dob: str
    date: str
    name: str = "User"
    language: str = "ru" # Default to Russian

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
