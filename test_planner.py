from agents.numerology_expert import NumerologyExpertAgent

def test_planner():
    expert = NumerologyExpertAgent()
    
    print("\n--- Productivity Forecast Test ---")
    for vibe in [1, 4, 7]:
        forecast = expert.get_productivity_forecast(vibe)
        print(f"Vibration {vibe} ({forecast['focus']}): {forecast['tasks']}")

if __name__ == "__main__":
    test_planner()
