"""
Muhurtas Agent - Planetary Hours, Rahu Kala, Brahma Muhurta, and other time divisions.

This module calculates various Vedic time divisions (muhurtas) that are used
to determine auspicious and inauspicious periods throughout the day.

Requires:
- pyswisseph (Swiss Ephemeris) for sunrise/sunset calculations
- User's geographic coordinates for accurate calculations
"""

import swisseph as swe
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass

# Planetary order for Hora calculation
# Starting from Sunday's first hour (Sun) and cycling through
HORA_PLANETS = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]
HORA_PLANETS_RU = ["Солнце", "Венера", "Меркурий", "Луна", "Сатурн", "Юпитер", "Марс"]

# Day rulers (for determining first hora of the day)
DAY_RULERS = {
    0: "Sun",      # Sunday
    1: "Moon",     # Monday
    2: "Mars",     # Tuesday
    3: "Mercury",  # Wednesday
    4: "Jupiter",  # Thursday
    5: "Venus",    # Friday
    6: "Saturn",   # Saturday
}

# Rahu Kala timing (portion of day, 0-7, where day is divided into 8 parts from sunrise to sunset)
# Each day has a different 1/8th portion ruled by Rahu
RAHU_KALA_PORTIONS = {
    0: 7,  # Sunday: 8th portion (7th index, 0-based)
    1: 1,  # Monday: 2nd portion
    2: 6,  # Tuesday: 7th portion
    3: 4,  # Wednesday: 5th portion
    4: 5,  # Thursday: 6th portion
    5: 3,  # Friday: 4th portion
    6: 2,  # Saturday: 3rd portion
}

# Gulika (Mandi) Kala portions
GULIKA_KALA_PORTIONS = {
    0: 6,  # Sunday
    1: 5,  # Monday
    2: 4,  # Tuesday
    3: 3,  # Wednesday
    4: 2,  # Thursday
    5: 1,  # Friday
    6: 0,  # Saturday
}

# Yamaghanda Kala portions
YAMAGHANDA_PORTIONS = {
    0: 4,  # Sunday
    1: 3,  # Monday
    2: 2,  # Tuesday
    3: 1,  # Wednesday
    4: 0,  # Thursday
    5: 6,  # Friday
    6: 5,  # Saturday
}


@dataclass
class SunTimes:
    """Sunrise and sunset times for a given date and location."""
    sunrise: datetime
    sunset: datetime
    day_duration: timedelta
    night_duration: timedelta


class MuhurtasAgent:
    """
    Agent for calculating Vedic time divisions (Muhurtas).
    
    Provides:
    - Planetary Hours (Hora)
    - Rahu Kala
    - Brahma Muhurta
    - Gulika Kala
    - Yamaghanda
    - Abhijit Muhurta
    """
    
    name = "Muhurtas Agent"
    description = "Calculates planetary hours and auspicious/inauspicious time periods"
    
    def __init__(self):
        # Swiss Ephemeris path (uses default if not set)
        pass
    
    def _get_julian_day(self, dt: datetime) -> float:
        """Convert datetime to Julian Day."""
        # Ensure we're working with UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt_utc = dt.astimezone(timezone.utc)
        
        return swe.julday(
            dt_utc.year, 
            dt_utc.month, 
            dt_utc.day,
            dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        )
    
    def _jd_to_datetime(self, jd: float, tz: timezone = timezone.utc) -> datetime:
        """Convert Julian Day to datetime."""
        # swe.revjul returns (year, month, day, hour_decimal)
        year, month, day, hour_decimal = swe.revjul(jd)
        
        hours = int(hour_decimal)
        minutes = int((hour_decimal - hours) * 60)
        seconds = int(((hour_decimal - hours) * 60 - minutes) * 60)
        
        dt = datetime(year, month, day, hours, minutes, seconds, tzinfo=timezone.utc)
        return dt.astimezone(tz) if tz != timezone.utc else dt
    
    def get_sun_times(
        self, 
        date: datetime, 
        latitude: float, 
        longitude: float
    ) -> SunTimes:
        """
        Calculate sunrise and sunset for a given date and location.
        
        Args:
            date: The date to calculate for
            latitude: Geographic latitude
            longitude: Geographic longitude
            
        Returns:
            SunTimes dataclass with sunrise, sunset, and duration info
        """
        # Get Julian Day for midnight UTC of the given date
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        
        # Start from midnight of the given date
        midnight = date.replace(hour=0, minute=0, second=0, microsecond=0)
        jd_start = self._get_julian_day(midnight)
        
        # Calculate sunrise
        # swe.rise_trans(jd_start, planet, geopos, atpress, attemp, rsmi)
        # rsmi: 1 = rise, 2 = set
        geopos = (longitude, latitude, 0)  # (lon, lat, altitude)
        
        try:
            sunrise_result = swe.rise_trans(
                jd_start, 
                swe.SUN, 
                geopos,
                0,  # atmospheric pressure (0 = default)
                0,  # temperature (0 = default)
                swe.CALC_RISE | swe.BIT_DISC_CENTER
            )
            sunrise_jd = sunrise_result[1][0]
            
            sunset_result = swe.rise_trans(
                jd_start,
                swe.SUN,
                geopos,
                0,
                0,
                swe.CALC_SET | swe.BIT_DISC_CENTER
            )
            sunset_jd = sunset_result[1][0]
        except Exception as e:
            # Fallback to approximate times if calculation fails
            # (can happen at extreme latitudes)
            sunrise_jd = jd_start + 0.25  # ~6 AM
            sunset_jd = jd_start + 0.75   # ~6 PM
        
        sunrise_dt = self._jd_to_datetime(sunrise_jd, date.tzinfo)
        sunset_dt = self._jd_to_datetime(sunset_jd, date.tzinfo)
        
        day_duration = sunset_dt - sunrise_dt
        
        # Night duration (sunset to next sunrise)
        # For simplicity, we'll approximate as 24h - day_duration
        night_duration = timedelta(hours=24) - day_duration
        
        return SunTimes(
            sunrise=sunrise_dt,
            sunset=sunset_dt,
            day_duration=day_duration,
            night_duration=night_duration
        )
    
    def get_current_hora(
        self, 
        dt: datetime, 
        latitude: float, 
        longitude: float,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Calculate the current Planetary Hour (Hora).
        
        The day is divided into 12 day-hours (sunrise to sunset) and 
        12 night-hours (sunset to sunrise). Each hour is ruled by a planet.
        
        Args:
            dt: Current datetime
            latitude: Geographic latitude
            longitude: Geographic longitude
            language: "ru" or "en"
            
        Returns:
            Dictionary with current hora information
        """
        sun_times = self.get_sun_times(dt, latitude, longitude)
        
        # Determine if it's day or night
        is_day = sun_times.sunrise <= dt < sun_times.sunset
        
        if is_day:
            # Day hora duration = day_duration / 12
            hora_duration = sun_times.day_duration / 12
            time_since_start = dt - sun_times.sunrise
            hora_index = int(time_since_start / hora_duration)
        else:
            # Night hora
            hora_duration = sun_times.night_duration / 12
            if dt >= sun_times.sunset:
                time_since_start = dt - sun_times.sunset
            else:
                # After midnight, before sunrise
                time_since_start = dt - (sun_times.sunset - timedelta(days=1))
            hora_index = int(time_since_start / hora_duration) + 12  # Offset by 12 for night
        
        # Get day of week to determine starting planet
        weekday = dt.weekday()  # Monday = 0, Sunday = 6
        # Convert to Sunday = 0
        weekday_sun = (weekday + 1) % 7
        
        # Starting planet index for this day
        day_ruler = DAY_RULERS[weekday_sun]
        start_index = HORA_PLANETS.index(day_ruler)
        
        # Current hora planet
        planet_index = (start_index + hora_index) % 7
        planet_en = HORA_PLANETS[planet_index]
        planet_ru = HORA_PLANETS_RU[planet_index]
        
        # Calculate hora start and end times
        if is_day:
            hora_start = sun_times.sunrise + (hora_index * hora_duration)
            hora_end = hora_start + hora_duration
        else:
            night_hora_index = hora_index - 12
            hora_start = sun_times.sunset + (night_hora_index * hora_duration)
            hora_end = hora_start + hora_duration
        
        return {
            "planet": planet_ru if language == "ru" else planet_en,
            "planet_en": planet_en,
            "is_day": is_day,
            "hora_number": (hora_index % 12) + 1,
            "start": hora_start.isoformat(),
            "end": hora_end.isoformat(),
            "duration_minutes": int(hora_duration.total_seconds() / 60),
            "quality": self._get_hora_quality(planet_en, language)
        }
    
    def _get_hora_quality(self, planet: str, language: str = "ru") -> str:
        """Get the quality/meaning of a planetary hora."""
        qualities = {
            "Sun": ("Власть, авторитет, важные решения", "Authority, power, important decisions"),
            "Moon": ("Эмоции, путешествия, общение", "Emotions, travel, communication"),
            "Mars": ("Действие, конкуренция, физическая активность", "Action, competition, physical activity"),
            "Mercury": ("Коммуникация, торговля, обучение", "Communication, trade, learning"),
            "Jupiter": ("Удача, расширение, духовность", "Luck, expansion, spirituality"),
            "Venus": ("Любовь, искусство, удовольствия", "Love, art, pleasures"),
            "Saturn": ("Ограничения, структура, терпение", "Limitations, structure, patience"),
        }
        idx = 0 if language == "ru" else 1
        return qualities.get(planet, ("", ""))[idx]
    
    def get_rahu_kala(
        self, 
        dt: datetime, 
        latitude: float, 
        longitude: float,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Calculate Rahu Kala for the given day.
        
        Rahu Kala is an inauspicious period of approximately 1.5 hours each day,
        during which new ventures should be avoided.
        
        Args:
            dt: Current datetime
            latitude: Geographic latitude
            longitude: Geographic longitude
            language: "ru" or "en"
            
        Returns:
            Dictionary with Rahu Kala start, end, and status
        """
        sun_times = self.get_sun_times(dt, latitude, longitude)
        
        # Day is divided into 8 parts
        portion_duration = sun_times.day_duration / 8
        
        weekday = dt.weekday()
        weekday_sun = (weekday + 1) % 7
        
        rahu_portion = RAHU_KALA_PORTIONS[weekday_sun]
        
        rahu_start = sun_times.sunrise + (rahu_portion * portion_duration)
        rahu_end = rahu_start + portion_duration
        
        is_active = rahu_start <= dt < rahu_end
        
        return {
            "name": "Раху Кала" if language == "ru" else "Rahu Kala",
            "start": rahu_start.isoformat(),
            "end": rahu_end.isoformat(),
            "duration_minutes": int(portion_duration.total_seconds() / 60),
            "is_active": is_active,
            "warning": (
                "Неблагоприятное время для новых начинаний" 
                if language == "ru" 
                else "Inauspicious time for new beginnings"
            ) if is_active else None
        }
    
    def get_brahma_muhurta(
        self, 
        dt: datetime, 
        latitude: float, 
        longitude: float,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Calculate Brahma Muhurta (96 minutes before sunrise).
        
        This is considered the most auspicious time for meditation,
        spiritual practice, and study.
        
        Args:
            dt: Current datetime
            latitude: Geographic latitude
            longitude: Geographic longitude
            language: "ru" or "en"
            
        Returns:
            Dictionary with Brahma Muhurta timing
        """
        sun_times = self.get_sun_times(dt, latitude, longitude)
        
        # Brahma Muhurta: 96 minutes (1 hr 36 min) before sunrise
        brahma_duration = timedelta(minutes=96)
        brahma_start = sun_times.sunrise - brahma_duration
        brahma_end = sun_times.sunrise
        
        is_active = brahma_start <= dt < brahma_end
        
        return {
            "name": "Брахма Мухурта" if language == "ru" else "Brahma Muhurta",
            "start": brahma_start.isoformat(),
            "end": brahma_end.isoformat(),
            "is_active": is_active,
            "quality": (
                "Самое благоприятное время для духовной практики"
                if language == "ru"
                else "Most auspicious time for spiritual practice"
            )
        }
    
    def get_abhijit_muhurta(
        self, 
        dt: datetime, 
        latitude: float, 
        longitude: float,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Calculate Abhijit Muhurta (midday auspicious period).
        
        The 8th muhurta of the day (around solar noon), considered
        universally auspicious.
        
        Args:
            dt: Current datetime
            latitude: Geographic latitude
            longitude: Geographic longitude
            language: "ru" or "en"
            
        Returns:
            Dictionary with Abhijit Muhurta timing
        """
        sun_times = self.get_sun_times(dt, latitude, longitude)
        
        # Day divided into 15 muhurtas
        muhurta_duration = sun_times.day_duration / 15
        
        # Abhijit is the 8th muhurta
        abhijit_start = sun_times.sunrise + (7 * muhurta_duration)
        abhijit_end = abhijit_start + muhurta_duration
        
        is_active = abhijit_start <= dt < abhijit_end
        
        return {
            "name": "Абхиджит Мухурта" if language == "ru" else "Abhijit Muhurta",
            "start": abhijit_start.isoformat(),
            "end": abhijit_end.isoformat(),
            "is_active": is_active,
            "quality": (
                "Универсально благоприятное время"
                if language == "ru"
                else "Universally auspicious time"
            )
        }
    
    def get_all_muhurtas(
        self, 
        dt: datetime, 
        latitude: float, 
        longitude: float,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Get all muhurta calculations for given datetime and location.
        
        Args:
            dt: Current datetime
            latitude: Geographic latitude
            longitude: Geographic longitude
            language: "ru" or "en"
            
        Returns:
            Dictionary with all calculated muhurtas
        """
        sun_times = self.get_sun_times(dt, latitude, longitude)
        
        return {
            "sun_times": {
                "sunrise": sun_times.sunrise.isoformat(),
                "sunset": sun_times.sunset.isoformat(),
                "day_duration_hours": sun_times.day_duration.total_seconds() / 3600
            },
            "hora": self.get_current_hora(dt, latitude, longitude, language),
            "rahu_kala": self.get_rahu_kala(dt, latitude, longitude, language),
            "brahma_muhurta": self.get_brahma_muhurta(dt, latitude, longitude, language),
            "abhijit_muhurta": self.get_abhijit_muhurta(dt, latitude, longitude, language),
        }


# CLI support
if __name__ == "__main__":
    import sys
    from datetime import datetime, timezone
    
    agent = MuhurtasAgent()
    
    # Default: Moscow
    lat, lon = 55.7558, 37.6173
    
    if len(sys.argv) >= 3:
        lat = float(sys.argv[1])
        lon = float(sys.argv[2])
    
    now = datetime.now(timezone.utc)
    
    print(f"Muhurtas for {now.isoformat()}")
    print(f"Location: {lat}, {lon}")
    print("-" * 40)
    
    result = agent.get_all_muhurtas(now, lat, lon, "ru")
    
    print(f"Sunrise: {result['sun_times']['sunrise']}")
    print(f"Sunset: {result['sun_times']['sunset']}")
    print()
    print(f"Current Hora: {result['hora']['planet']} ({result['hora']['quality']})")
    print()
    print(f"Rahu Kala: {result['rahu_kala']['start']} - {result['rahu_kala']['end']}")
    print(f"  Active: {result['rahu_kala']['is_active']}")
    print()
    print(f"Brahma Muhurta: {result['brahma_muhurta']['start']} - {result['brahma_muhurta']['end']}")
    print(f"  Active: {result['brahma_muhurta']['is_active']}")
