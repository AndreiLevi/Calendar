import sys
import os

# Add backend directory to path so we can import agents
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.mayan_agent import MayanAgent

def test_mayan():
    agent = MayanAgent()
    # Test Anchor Date: Jan 10, 2026
    date = "2026-01-10"
    print(f"Testing Mayan Agent for {date}...")
    
    result = agent.calculate_tzolkin(date)
    
    print(f"Kin: {result['kin']} (Expected: 32)")
    print(f"Seal: {result['sealName']} (Expected: Человек)")
    print(f"Tone: {result['toneName']} (Expected: Ритмический)")
    print(f"Color: {result['color']} (Expected: Желтый)")
    print("-" * 20)
    print("Full Context:", result['fullTitle'])

if __name__ == "__main__":
    test_mayan()
