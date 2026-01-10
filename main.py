from agents.numerology_expert import NumerologyExpertAgent
from agents.marketing_agent import MarketingCreativeAgent

def main():
    expert = NumerologyExpertAgent()
    marketing = MarketingCreativeAgent()
    
    dob = "1990-01-01"
    name = "John Doe"
    
    print("--- User Profile ---")
    profile = expert.get_profile(dob, name)
    print(profile)
    
    print("\n--- Marketing Script ---")
    script = marketing.generate_video_script(profile)
    print(script)
    
    print("\n--- Daily Insight ---")
    insight = expert.get_daily_insight(dob, "2026-01-10")
    print(insight)

if __name__ == "__main__":
    main()
