import os
from openai import OpenAI
from typing import Dict

class StrategyOrchestrator:
    """
    The 'Master Mind' that synthesizes data from all agents into a cohesive strategy.
    Uses OpenRouter (connects to DeepSeek, Claude, GPT-4, etc) via OpenAI compatible API.
    """

    def __init__(self):
        # Configure API Key (User needs to set OPENROUTER_API_KEY in env)
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = "https://openrouter.ai/api/v1"
        
        # Default to a high-quality model (User can override via ENV)
        self.model_name = os.getenv("OPENROUTER_MODEL", "anthropic/claude-4.5-sonnet")

        if api_key:
            self.client = OpenAI(
                base_url=base_url,
                api_key=api_key,
                default_headers={
                    "HTTP-Referer": "https://calendar-app.com",
                    "X-Title": "Universal Calendar",
                }
            )
        else:
            self.client = None
            print("WARNING: OPENROUTER_API_KEY not set. Orchestrator will return mock data.")

    def synthesize_daily_strategy(self, 
                                  numerology: Dict, 
                                  mayan: Dict, 
                                  jyotish: Dict, 
                                  user_name: str,
                                  language: str = "ru") -> str:
        
        if not self.client:
            return "AI Key missing. Please set OPENROUTER_API_KEY in Railway to receive real insights."

        # Language Prompt Logic
        lang_instruction = "Response MUST be in Russian."
        if language == "en":
            lang_instruction = "Response MUST be in English."
        elif language == "he":
            lang_instruction = "Response MUST be in Hebrew."

        # Construct the context
        prompt = f"""
        Act as a Wise Strategic Advisor for {user_name}.
        Synthesize the following 3 spiritual energies into a concise, tactical daily strategy.

        IMPORTANT INSTRUCTION:
        The input data below might be in Russian or another language. 
        You MUST process the meaning of the data but generate your final response ENTIRELY in {language.upper()}.
        Do not output any Russian text if the target language is not Russian.

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
        - {lang_instruction}
        - DO NOT list the data again.
        - Combine the themes. Example: If Mayan is "Action" but Tithi is "Empty", advise "Cautious Action".
        - Be direct, empowering, and mystical but practical.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a mystical yet practical strategic advisor using ancient wisdom."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error gathering wisdom: {str(e)}"
