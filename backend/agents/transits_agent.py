"""
Transits Agent - Current Planetary Positions and Transit Analysis.

Calculates the current positions of all 9 Vedic planets (Grahas)
and can compare them to natal positions for transit analysis.

Uses Swiss Ephemeris for high-precision calculations.
"""

import swisseph as swe
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


# Vedic planet mappings
PLANETS = {
    swe.SUN: ("Sun", "Солнце", "Surya"),
    swe.MOON: ("Moon", "Луна", "Chandra"),
    swe.MARS: ("Mars", "Марс", "Mangala"),
    swe.MERCURY: ("Mercury", "Меркурий", "Budha"),
    swe.JUPITER: ("Jupiter", "Юпитер", "Guru"),
    swe.VENUS: ("Venus", "Венера", "Shukra"),
    swe.SATURN: ("Saturn", "Сатурн", "Shani"),
    swe.MEAN_NODE: ("Rahu", "Раху", "Rahu"),  # North Node
}

# Ketu is calculated as 180° from Rahu
KETU_NAMES = ("Ketu", "Кету", "Ketu")

# Rashis (Signs)
RASHIS = [
    ("Aries", "Овен", "Mesha"),
    ("Taurus", "Телец", "Vrishabha"),
    ("Gemini", "Близнецы", "Mithuna"),
    ("Cancer", "Рак", "Karka"),
    ("Leo", "Лев", "Simha"),
    ("Virgo", "Дева", "Kanya"),
    ("Libra", "Весы", "Tula"),
    ("Scorpio", "Скорпион", "Vrishchika"),
    ("Sagittarius", "Стрелец", "Dhanu"),
    ("Capricorn", "Козерог", "Makara"),
    ("Aquarius", "Водолей", "Kumbha"),
    ("Pisces", "Рыбы", "Meena"),
]

# Nakshatras
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
]


@dataclass
class PlanetPosition:
    """Position of a planet in the zodiac."""
    planet_id: int
    name_en: str
    name_ru: str
    name_sanskrit: str
    longitude: float
    latitude: float
    speed: float  # degrees per day
    is_retrograde: bool
    rashi_num: int  # 0-11
    rashi_en: str
    rashi_ru: str
    rashi_degree: float  # degree within sign (0-30)
    nakshatra_num: int  # 0-26
    nakshatra: str
    nakshatra_pada: int  # 1-4


class TransitsAgent:
    """
    Agent for calculating current planetary positions (transits).
    
    Provides:
    - Current positions of all 9 Grahas
    - Sign (Rashi) and Nakshatra placements
    - Retrograde status
    - Speed of motion
    """
    
    name = "Transits Agent"
    description = "Calculates current planetary positions and transit analysis"
    
    def __init__(self):
        # Set Sidereal Mode (Lahiri Ayanamsha) for Vedic calculations
        swe.set_sid_mode(swe.SIDM_LAHIRI)
    
    def _get_julian_day(self, dt: datetime) -> float:
        """Convert datetime to Julian Day."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt_utc = dt.astimezone(timezone.utc)
        
        return swe.julday(
            dt_utc.year,
            dt_utc.month,
            dt_utc.day,
            dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        )
    
    def _get_rashi(self, longitude: float) -> tuple:
        """Get Rashi (sign) from longitude."""
        rashi_num = int(longitude / 30) % 12
        rashi_degree = longitude % 30
        return rashi_num, rashi_degree
    
    def _get_nakshatra(self, longitude: float) -> tuple:
        """Get Nakshatra from longitude."""
        nakshatra_span = 360 / 27  # 13.333... degrees
        nakshatra_num = int(longitude / nakshatra_span) % 27
        
        # Pada (quarter) of nakshatra
        pada_span = nakshatra_span / 4
        position_in_nakshatra = longitude % nakshatra_span
        pada = int(position_in_nakshatra / pada_span) + 1
        
        return nakshatra_num, pada
    
    def _calculate_planet(
        self, 
        jd: float, 
        planet_id: int,
        names: tuple
    ) -> PlanetPosition:
        """Calculate position for a single planet."""
        # Use sidereal flag for Vedic astrology
        result = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
        
        longitude = result[0][0]
        latitude = result[0][1]
        speed = result[0][3]  # Speed in longitude (deg/day)
        
        # Retrograde if speed is negative
        is_retrograde = speed < 0
        
        rashi_num, rashi_degree = self._get_rashi(longitude)
        nakshatra_num, pada = self._get_nakshatra(longitude)
        
        return PlanetPosition(
            planet_id=planet_id,
            name_en=names[0],
            name_ru=names[1],
            name_sanskrit=names[2],
            longitude=round(longitude, 4),
            latitude=round(latitude, 4),
            speed=round(speed, 4),
            is_retrograde=is_retrograde,
            rashi_num=rashi_num,
            rashi_en=RASHIS[rashi_num][0],
            rashi_ru=RASHIS[rashi_num][1],
            rashi_degree=round(rashi_degree, 2),
            nakshatra_num=nakshatra_num,
            nakshatra=NAKSHATRAS[nakshatra_num],
            nakshatra_pada=pada
        )
    
    def get_current_positions(
        self, 
        dt: datetime,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Get positions of all 9 Grahas.
        
        Args:
            dt: Datetime to calculate for
            language: "ru", "en", or "sa" (Sanskrit)
            
        Returns:
            Dictionary with all planetary positions
        """
        jd = self._get_julian_day(dt)
        
        positions = {}
        
        # Calculate main planets
        for planet_id, names in PLANETS.items():
            pos = self._calculate_planet(jd, planet_id, names)
            key = pos.name_en.lower()
            positions[key] = self._position_to_dict(pos, language)
        
        # Calculate Ketu (180° from Rahu)
        rahu_pos = positions["rahu"]
        ketu_longitude = (float(rahu_pos["longitude"]) + 180) % 360
        
        rashi_num, rashi_degree = self._get_rashi(ketu_longitude)
        nakshatra_num, pada = self._get_nakshatra(ketu_longitude)
        
        positions["ketu"] = {
            "name": KETU_NAMES[0] if language == "en" else KETU_NAMES[1],
            "longitude": round(ketu_longitude, 4),
            "rashi": RASHIS[rashi_num][0] if language == "en" else RASHIS[rashi_num][1],
            "rashi_degree": round(rashi_degree, 2),
            "nakshatra": NAKSHATRAS[nakshatra_num],
            "nakshatra_pada": pada,
            "is_retrograde": True  # Nodes always retrograde
        }
        
        return {
            "timestamp": dt.isoformat(),
            "planets": positions,
            "retrograde_planets": self._get_retrograde_list(positions, language)
        }
    
    def _position_to_dict(self, pos: PlanetPosition, language: str) -> Dict[str, Any]:
        """Convert PlanetPosition to dictionary."""
        name = pos.name_en if language == "en" else pos.name_ru
        rashi = pos.rashi_en if language == "en" else pos.rashi_ru
        
        return {
            "name": name,
            "longitude": pos.longitude,
            "rashi": rashi,
            "rashi_degree": pos.rashi_degree,
            "nakshatra": pos.nakshatra,
            "nakshatra_pada": pos.nakshatra_pada,
            "speed": pos.speed,
            "is_retrograde": pos.is_retrograde
        }
    
    def _get_retrograde_list(
        self, 
        positions: Dict[str, Any],
        language: str
    ) -> List[str]:
        """Get list of retrograde planets."""
        retrograde = []
        for key, pos in positions.items():
            if pos.get("is_retrograde") and key not in ["rahu", "ketu"]:
                retrograde.append(pos["name"])
        return retrograde
    
    def get_significant_transits(
        self,
        dt: datetime,
        language: str = "ru"
    ) -> List[Dict[str, Any]]:
        """
        Identify significant current transits.
        
        Args:
            dt: Datetime to analyze
            language: Output language
            
        Returns:
            List of significant transits with descriptions
        """
        positions = self.get_current_positions(dt, language)
        planets = positions["planets"]
        
        significant = []
        
        # Check for retrograde planets (always significant)
        for name in positions["retrograde_planets"]:
            significant.append({
                "type": "retrograde",
                "planet": name,
                "description": (
                    f"{name} ретроградный — время для переосмысления"
                    if language == "ru"
                    else f"{name} is retrograde — time for reflection"
                )
            })
        
        # Check for planets in key degrees (0-3° or 27-30° = sign change soon)
        for key, pos in planets.items():
            degree = pos["rashi_degree"]
            if degree <= 3:
                significant.append({
                    "type": "new_sign",
                    "planet": pos["name"],
                    "sign": pos["rashi"],
                    "description": (
                        f"{pos['name']} только вошёл в {pos['rashi']}"
                        if language == "ru"
                        else f"{pos['name']} just entered {pos['rashi']}"
                    )
                })
            elif degree >= 27:
                significant.append({
                    "type": "leaving_sign",
                    "planet": pos["name"],
                    "sign": pos["rashi"],
                    "description": (
                        f"{pos['name']} скоро покинет {pos['rashi']}"
                        if language == "ru"
                        else f"{pos['name']} is about to leave {pos['rashi']}"
                    )
                })
        
        return significant


# CLI support
if __name__ == "__main__":
    from datetime import datetime, timezone
    
    agent = TransitsAgent()
    now = datetime.now(timezone.utc)
    
    print(f"Planetary Positions for {now.isoformat()}")
    print("=" * 50)
    
    result = agent.get_current_positions(now, "en")
    
    for planet, data in result["planets"].items():
        retro = " (R)" if data.get("is_retrograde") else ""
        print(f"{data['name']:10} {data['rashi']:12} {data['rashi_degree']:5.1f}° {data['nakshatra']:20}{retro}")
    
    print("\nSignificant Transits:")
    for transit in agent.get_significant_transits(now, "en"):
        print(f"  • {transit['description']}")
