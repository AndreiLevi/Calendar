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
        self.model_name = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")

        if api_key:
            self.client = OpenAI(
                base_url=base_url,
                api_key=api_key,
            )
        else:
            self.client = None
            print("WARNING: OPENROUTER_API_KEY not set. Orchestrator will return mock data.")

    def synthesize_daily_strategy(self, 
                                  numerology: Dict, 
                                  mayan: Dict, 
                                  jyotish: Dict, 
                                  user_name: str) -> str:
        
        if not self.client:
            return "AI Key missing. Please set OPENROUTER_API_KEY in Railway to receive real insights."

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
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a mystical yet practical strategic advisor using ancient wisdom."},
                    {"role": "user", "content": prompt}
                ],
                headers={
                    "HTTP-Referer": "https://calendar-app.com", # Required by OpenRouter
                    "X-Title": "Universal Calendar",
                }
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error gathering wisdom: {str(e)}"

    def ask_agent(self, question: str, context_data: Dict, language: str = "ru") -> str:
        """
        Answers specific user questions based on provided agent data context.
        Example: "What is the current muhurta and is it good for signing a contract?"
        """
        if not self.client:
            return "AI Key missing. Cannot generate natural language answer."

        lang_instruction = "Respond in Russian." if language == "ru" else "Respond in English."

        prompt = f"""
        You are a mystical yet practical structural advisor. 
        The user has asked a specific question about astrological/numerological/time elements.
        
        USER QUESTION: "{question}"
        
        AVAILABLE CONTEXT DATA:
        {context_data}
        
        INSTRUCTIONS:
        1. Answer the user's question directly using ONLY the provided context data.
        2. If the data to answer the question is not in the context, politely state that you don't have that specific data right now.
        3. Be concise, practical, and insightful. Do not dump the raw JSON data.
        4. {lang_instruction}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a mystical yet practical calendar advisor."},
                    {"role": "user", "content": prompt}
                ],
                headers={
                    "HTTP-Referer": "https://calendar-app.com",
                    "X-Title": "Universal Calendar",
                }
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error analyzing question: {str(e)}"
