from datetime import datetime, timedelta
import math
from typing import Dict, Any, Optional
from .mayan_data import MAYAN_DATA

class MayanAgent:
    """
    Agent for calculating Mayan Tzolkin and 13-Moon calendar data.
    """
    
    def __init__(self):
        # Anchor: Jan 10, 2026 = Kin 32
        self.ANCHOR_DATE = datetime(2026, 1, 10, 12, 0, 0)
        self.ANCHOR_KIN = 32

    def calculate_tzolkin(self, date_str: str) -> Dict[str, Any]:
        target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None)
        target_date = target_date.replace(hour=12, minute=0, second=0, microsecond=0)

        # Day Out of Time / Leap Day Logic
        if self._is_leap_day(target_date):
            return self._get_leap_day_response()

        raw_diff_days = (target_date - self.ANCHOR_DATE).days
        leap_days = self._count_leap_days(target_date, self.ANCHOR_DATE)
        
        # Adjust for leap days (Dreamspell ignores leap days)
        # Javascript: sign * leapDays
        # If target is AFTER anchor, we subtract leap days encountered to get "Dreamspell days"
        # If target is BEFORE anchor, we add leap days (effectively subtracting negative diff)
        
        if raw_diff_days >= 0:
            effective_days = raw_diff_days - leap_days
        else:
            effective_days = raw_diff_days + leap_days

        kin = (self.ANCHOR_KIN + effective_days) % 260
        while kin <= 0:
            kin += 260

        seal_index = (kin - 1) % 20
        tone_index = (kin - 1) % 13

        seal_data = MAYAN_DATA["seals"][seal_index]
        tone_data = MAYAN_DATA["tones"][tone_index]
        colors = ["Красный", "Белый", "Синий", "Желтый"]
        color = colors[seal_index % 4]

        moon_data = self._calculate_13moon_date(target_date)
        year_data = self._calculate_year_bearer(target_date, kin, moon_data)

        return {
            "kin": kin,
            "seal": seal_index + 1,
            "sealName": seal_data["name"],
            "mayanSealName": seal_data["mayanName"],
            "tone": tone_index + 1,
            "toneName": tone_data["name"],
            "mayanToneName": tone_data["mayanName"],
            "color": color,
            "fullTitle": f"{tone_data['name']} {seal_data['name']}",
            "fullMayanTitle": f"{tone_data['mayanName']} {seal_data['mayanName']}",
            "action": seal_data["action"],
            "power": seal_data["power"],
            "essence": seal_data["essence"],
            "toneAction": tone_data["action"],
            "tonePower": tone_data["power"],
            "toneEssence": tone_data["essence"],
            "toneQuestion": tone_data.get("question", ""),
            "moon": moon_data,
            "year": year_data
        }

    def _calculate_13moon_date(self, date: datetime) -> Dict[str, Any]:
        year = date.year
        # 13 Moon New Year is always July 26
        start_of_moon_year = datetime(year, 7, 26, 12, 0, 0)

        if date < start_of_moon_year:
            year -= 1
            start_of_moon_year = datetime(year, 7, 26, 12, 0, 0)

        day_diff = (date - start_of_moon_year).days
        # Subtract leap days if any occurred between start of moon year and date (rare, only if logic spans Feb 29)
        # Actually in Dreamspell, Feb 29 is skipped. 
        # Since our start is July 26, we only cross Feb 29 if we are looking at dates after Feb.
        leap_days = self._count_leap_days(date, start_of_moon_year)
        day_diff -= leap_days

        if day_diff == 364:
             return {
                "number": 0,
                "name": "День Вне Времени",
                "totem": "Галактический",
                "day": 0,
                "fullDate": "День Вне Времени",
                "question": "Я есмь Праздник Жизни"
            }

        moon_index = math.floor(day_diff / 28)
        day_of_moon = (day_diff % 28) + 1

        if 0 <= moon_index < len(MAYAN_DATA["moons"]):
            moon = MAYAN_DATA["moons"][moon_index]
            totem = MAYAN_DATA["totems"][moon_index]
            return {
                "number": moon_index + 1,
                "name": moon["name"],
                "question": moon["question"],
                "totem": totem,
                "day": day_of_moon,
                "fullDate": f"{moon['name']} {day_of_moon}"
            }
        return {}

    def _calculate_year_bearer(self, date: datetime, current_kin: int, moon_data: Dict) -> Optional[Dict]:
        if moon_data.get("number") == 0:
            return None
        
        total_days = ((moon_data["number"] - 1) * 28) + moon_data["day"]
        offset = total_days - 1
        
        year_kin = current_kin - offset
        while year_kin <= 0:
            year_kin += 260
            
        seal_index = (year_kin - 1) % 20
        tone_index = (year_kin - 1) % 13
        
        seal_data = MAYAN_DATA["seals"][seal_index]
        tone_data = MAYAN_DATA["tones"][tone_index]
        color = ["Красного", "Белого", "Синего", "Желтого"][seal_index % 4]
        
        return {
            "kin": year_kin,
            "name": f"Год {tone_data['name']} {seal_data['name']}",
            "seal": seal_data['name'],
            "tone": tone_data['name'],
            "color": color
        }

    def _is_leap_day(self, date: datetime) -> bool:
        return date.month == 2 and date.day == 29

    def _get_leap_day_response(self) -> Dict[str, Any]:
        return {
            "kin": "0.0",
            "seal": 0,
            "sealName": "Хунаб Ку",
            "tone": 0,
            "toneName": "День Вне Времени",
            "color": "Зеленый",
            "fullTitle": "День Вне Времени (Хунаб Ку)",
            "fullMayanTitle": "0.0.Hunab Ku",
            "moon": {"number": 0, "name": "Хунаб Ку", "day": 0}
        }

    def _count_leap_days(self, d1: datetime, d2: datetime) -> int:
        start = min(d1, d2)
        end = max(d1, d2)
        count = 0
        for year in range(start.year, end.year + 1):
             if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
                 leap_day = datetime(year, 2, 29, 12, 0, 0)
                 if start < leap_day < end:
                     count += 1
        return count
