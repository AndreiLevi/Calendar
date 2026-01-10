from .numerology_engine import NumerologyEngine
from typing import Dict, Any

class NumerologyExpertAgent:
    """
    Agent that provides high-level interpretations of numerological data.
    """
    def __init__(self):
        self.engine = NumerologyEngine()

    def get_profile(self, dob: str, name: str) -> Dict[str, Any]:
        lp = self.engine.calculate_life_path(dob)
        expr = self.engine.calculate_expression(name)
        py = self.engine.calculate_personal_year(dob)
        
        return {
            "life_path": lp,
            "expression": expr,
            "personal_year": py,
            "summary": self._interpret_life_path(lp)
        }

    def _interpret_life_path(self, lp: int) -> str:
        interpretations = {
            1: "The Leader: Independent, ambitious, and creative.",
            2: "The Diplomat: Cooperative, sensitive, and balanced.",
            3: "The Communicator: Expressive, social, and optimistic.",
            4: "The Builder: Practical, disciplined, and organized.",
            5: "The Adventurer: Versatile, freedom-loving, and dynamic.",
            6: "The Nurturer: Responsible, compassionate, and family-oriented.",
            7: "The Seeker: Analytical, introspective, and spiritual.",
            8: "The Achiever: Ambitious, authoritative, and success-oriented.",
            9: "The Humanitarian: Compassionate, generous, and idealistic.",
            11: "The Visionary: Intuitive, inspiring, and enlightened.",
            22: "The Master Builder: Powerful, practical, and manifesting.",
            33: "The Master Teacher: Self-sacrificing, guiding, and healing."
        }
        return interpretations.get(lp, "A unique path of self-discovery.")

    def get_productivity_forecast(self, vibration: int) -> Dict[str, Any]:
        """
        Returns productivity suggestions based on the daily vibration.
        """
        forecasts = {
            1: {"focus": "Initiation", "tasks": ["Start new projects", "Pitch ideas", "Take the lead"]},
            2: {"focus": "Cooperation", "tasks": ["Team meetings", "Negotiations", "Client support"]},
            3: {"focus": "Creativity", "tasks": ["Content creation", "Brainstorming", "Social media"]},
            4: {"focus": "Organization", "tasks": ["Admin work", "Budgeting", "Cleaning/Sorting"]},
            5: {"focus": "Expansion", "tasks": ["Networking", "Sales calls", "Travel/Motion"]},
            6: {"focus": "Responsibility", "tasks": ["Team support", "Design work", "Mentoring"]},
            7: {"focus": "Analysis", "tasks": ["Research", "Code review", "Strategic planning"]},
            8: {"focus": "Power/Finance", "tasks": ["Executive decisions", "Financial reviews", "Management"]},
            9: {"focus": "Completion", "tasks": ["Finishing touches", "Retrospectives", "Decluttering"]},
            11: {"focus": "Vision", "tasks": ["Big picture planning", "Inspiration", "Teaching"]},
            22: {"focus": "Mastery", "tasks": ["Large scale building", "System architecture", "Global impact"]},
        }
        return forecasts.get(vibration, {"focus": "Balance", "tasks": ["Review goals", "Rest"]})

    def get_daily_insight(self, dob: str, date: str) -> str:
        vibe = self.engine.get_daily_vibration(dob, date)
        forecast = self.get_productivity_forecast(vibe)
        return f"Today's vibration is {vibe}. It's a day for {'action' if vibe % 2 != 0 else 'reflection'}."
