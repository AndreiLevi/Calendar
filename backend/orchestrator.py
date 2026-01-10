import os
import google.generativeai as genai
from typing import Dict

class StrategyOrchestrator:
    """
    The 'Master Mind' that synthesizes data from all agents into a cohesive strategy.
    Uses Google Gemini (or compatible LLM) to generate natural language insights.
    """

    def __init__(self):
        # Configure API Key (User needs to set GOOGLE_API_KEY in env)
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            print("WARNING: GOOGLE_API_KEY not set. Orchestrator will return mock data.")

    def synthesize_daily_strategy(self, 
                                  numerology: Dict, 
                                  mayan: Dict, 
                                  jyotish: Dict, 
                                  user_name: str) -> str:
        
        if not self.model:
            return "AI Key missing. Please set GOOGLE_API_KEY to receive real insights."

        # Construct the context
        prompt = f"""
        Act as a Wise Strategic Advisor for {user_name}.
        Synthesize the following 3 spiritual energies into a concise, tactical daily strategy.

        DATA:
        1. MAYAN (Tzolkin):
           - Kin: {mayan.get('kin')}
           - Tone: {mayan.get('toneName')} ({mayan.get('toneAction')})
           - Seal: {mayan.get('sealName')} ({mayan.get('action')}, {mayan.get('power')})
           - Color: {mayan.get('color')}

        2. NUMEROLOGY:
           - Personal Day: {numerology['daily_insight']} (Vibration context)
           - Life Path: {numerology['profile']['life_path']}

        3. JYOTISH (Vedic):
           - Tithi (Phase): {jyotish.get('tithi', {}).get('name')} ({jyotish.get('tithi', {}).get('paksha')})
           - Nakshatra: {jyotish.get('nakshatra', {}).get('name')}
           - Yoga: {jyotish.get('yoga', {}).get('name')}

        GOAL:
        Write a single paragraph (3-4 sentences) Strategic Advice. 
        - DO NOT list the data again.
        - Combine the themes. Example: If Mayan is "Action" but Tithi is "Empty", advise "Cautious Action".
        - Be direct, empowering, and mystical but practical.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error gathering wisdom: {str(e)}"
