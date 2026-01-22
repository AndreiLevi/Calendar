import swisseph as swe
from datetime import datetime
import pytz
from timezonefinder import TimezoneFinder
from typing import Dict, Any
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JyotishAgent:
    """
    Agent for calculating Vedic Astrology (Jyotish) Panchanga elements:
    Tithi, Nakshatra, Yoga, and Birth Charts.
    Uses 'pyswisseph' (Swiss Ephemeris) for high-precision calculations.
    """

    def __init__(self):
        # Set Sidereal Mode (Lahiri Ayanamsha)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        # Initialize TimezoneFinder with low memory mode for Railway
        try:
            self.tf = TimezoneFinder(in_memory=False)
            logger.info("TimezoneFinder initialized in low-memory mode.")
        except Exception as e:
            logger.error(f"Failed to initialize TimezoneFinder: {e}")
            self.tf = None
        
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
        # Simple date parsing for Panchanga (assumes Noon UTC if no time)
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        if dt.tzinfo is None:
             dt = dt.replace(tzinfo=pytz.UTC)
        else:
             dt = dt.astimezone(pytz.UTC)
             
        return swe.julday(dt.year, dt.month, dt.day, 
                          dt.hour + dt.minute/60.0 + dt.second/3600.0)

    def calculate_panchanga(self, date_str: str) -> Dict[str, Any]:
        try:
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
        except Exception as e:
            logger.error(f"Error in calculate_panchanga: {e}")
            return {}

    def calculate_birth_chart(self, birth_date: str, birth_time: str, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Calculate natal chart using birth time and location.
        Automatically detects timezone to convert local birth time to UTC.
        """
        logger.info(f"Calculating birth chart for: {birth_date} {birth_time} at {latitude}, {longitude}")
        
        try:
            # 1. Detect Timezone
            timezone_str = "UTC"
            if self.tf:
                try:
                    found_tz = self.tf.timezone_at(lng=longitude, lat=latitude)
                    if found_tz:
                        timezone_str = found_tz
                except Exception as e:
                    logger.error(f"Timezone detection failed, defaulting to UTC. Error: {e}")
            else:
                 logger.warning("TimezoneFinder not available, using UTC")

            logger.info(f"Detected Timezone: {timezone_str}")
            local_tz = pytz.timezone(timezone_str)
            
            # 2. Create Timezone-Aware Datetime (Local Time)
            # Parse date components
            year, month, day = map(int, birth_date.split('-'))
            
            # Handle time formats: "HH:MM" or "HH:MM:SS"
            time_parts = list(map(int, birth_time.split(':')))
            hour = time_parts[0]
            minute = time_parts[1]
            # Ignore seconds if present
            
            dt_local = local_tz.localize(datetime(year, month, day, hour, minute, 0))
            
            # 3. Convert to UTC
            dt_utc = dt_local.astimezone(pytz.UTC)
            logger.info(f"UTC Time calculation: {dt_utc}")
            
            # 4. Calculate Julian Day
            jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, 
                            dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0)
            
            # 5. Calculate Houses (for Ascendant) - Placidus system
            houses_result = swe.houses(jd, latitude, longitude, b'P')
            ascendant_long = houses_result[0][0]  # Ascendant is 1st house cusp
            
            # 6. Calculate All Planets (Grahas)
            # Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu (Mean Node)
            planets_map = {
                "Sun": swe.SUN,
                "Moon": swe.MOON,
                "Mars": swe.MARS,
                "Mercury": swe.MERCURY,
                "Jupiter": swe.JUPITER,
                "Venus": swe.VENUS,
                "Saturn": swe.SATURN,
                "Rahu": swe.MEAN_NODE # Mean North Node
            }
            
            # Rashis (zodiac signs)
            rashis = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
            
            grahas = {}
            
            for name, planet_id in planets_map.items():
                res = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SWIEPH)
                long = res[0][0]
                rashi_idx = int(long / 30)
                
                # Calculate Nakshatra for all planets
                nakshatra_idx = int(long / (360 / 27))
                nakshatra_name = self.NAKSHATRAS[nakshatra_idx % 27]
                
                grahas[name] = {
                    "degree": round(long, 2),
                    "rashi": rashis[rashi_idx % 12],
                    "rashi_degree": round(long % 30, 2),
                    "nakshatra": nakshatra_name
                }
                
            # Calculate Ketu (always 180 degrees from Rahu)
            rahu_long = grahas["Rahu"]["degree"]
            ketu_long = (rahu_long + 180) % 360
            ketu_rashi_idx = int(ketu_long / 30)
            ketu_nakshatra_idx = int(ketu_long / (360 / 27))
            
            grahas["Ketu"] = {
                "degree": round(ketu_long, 2),
                "rashi": rashis[ketu_rashi_idx % 12],
                "rashi_degree": round(ketu_long % 30, 2),
                "nakshatra": self.NAKSHATRAS[ketu_nakshatra_idx % 27]
            }
            
            ascendant_rashi_idx = int(ascendant_long / 30)
            ascendant_nakshatra_idx = int(ascendant_long / (360 / 27))
            
            return {
                "timezone": timezone_str,
                "utc_time": dt_utc.isoformat(),
                "ascendant": {
                    "degree": round(ascendant_long, 2),
                    "rashi": rashis[ascendant_rashi_idx % 12],
                    "rashi_degree": round(ascendant_long % 30, 2),
                    "nakshatra": self.NAKSHATRAS[ascendant_nakshatra_idx % 27]
                },
                "grahas": grahas
            }
            
        except Exception as e:
            logger.error(f"CRITICAL ERROR in calculate_birth_chart: {e}", exc_info=True)
            raise e
