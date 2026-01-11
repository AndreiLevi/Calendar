import swisseph as swe
from datetime import datetime, timezone
from typing import Dict, Any

class JyotishAgent:
    """
    Agent for calculating Vedic Astrology (Jyotish) Panchanga elements:
    Tithi, Nakshatra, and Yoga.
    Uses 'pyswisseph' (Swiss Ephemeris) for high-precision calculations.
    """

    def __init__(self):
        # Set Sidereal Mode (Lahiri Ayanamsha)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        self.NAKSHATRAS = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", 
            "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", 
            "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", 
            "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", 
            "Uttara Bhadrapada", "Revati"
        ]

        self.TITHIS = [
            "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", 
            "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", 
            "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
            "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", 
            "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", 
            "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
        ]

        self.YOGAS = [
            "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", 
            "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda", 
            "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", 
            "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", 
            "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", 
            "Indra", "Vaidhriti"
        ]

    def _get_julian_day(self, date_str: str) -> float:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        # Convert to UTC if not already
        dt_utc = dt.astimezone(timezone.utc)
        return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, 
                          dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0)

    def calculate_panchanga(self, date_str: str) -> Dict[str, Any]:
        jd = self._get_julian_day(date_str)

        # Calculate positions (SIDEREAL)
        # SUN
        sun_res = swe.calc_ut(jd, swe.SUN, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
        sun_long = sun_res[0][0]

        # MOON
        moon_res = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
        moon_long = moon_res[0][0]

        # 1. NAKSHATRA (Moon Longitude / 13.3333 deg)
        nakshatra_idx = int(moon_long / (360 / 27))
        nakshatra_name = self.NAKSHATRAS[nakshatra_idx % 27]

        # 2. TITHI (Moon - Sun) / 12 deg
        diff = moon_long - sun_long
        if diff < 0:
            diff += 360
        tithi_idx = int(diff / 12)
        tithi_name = self.TITHIS[tithi_idx % 30]
        # Determine Paksha (Waxing/Waning)
        paksha = "Shukla" if tithi_idx < 15 else "Krishna"

        # 3. YOGA (Sun + Moon) / 13.3333 deg
        total = sun_long + moon_long
        if total > 360:
            total -= 360
        yoga_idx = int(total / (360 / 27))
        yoga_name = self.YOGAS[yoga_idx % 27]

        return {
            "nakshatra": {
                "number": nakshatra_idx + 1,
                "name": nakshatra_name
            },
            "tithi": {
                "number": tithi_idx + 1,
                "name": tithi_name,
                "paksha": paksha
            },
            "yoga": {
                "number": yoga_idx + 1,
                "name": yoga_name
            }
        }
