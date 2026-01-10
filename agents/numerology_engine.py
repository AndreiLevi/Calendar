import math
from datetime import datetime
from typing import Dict, List, Optional

class NumerologyEngine:
    """
    Core engine for numerological calculations.
    Supports Pythagorean system for names and standard digit reduction.
    """
    
    PYTHAGOREAN_CHART = {
        'A': 1, 'J': 1, 'S': 1,
        'B': 2, 'K': 2, 'T': 2,
        'C': 3, 'L': 3, 'U': 3,
        'D': 4, 'M': 4, 'V': 4,
        'E': 5, 'N': 5, 'W': 5,
        'F': 6, 'O': 6, 'X': 6,
        'G': 7, 'P': 7, 'Y': 7,
        'H': 8, 'Q': 8, 'Z': 8,
        'I': 9, 'R': 9
    }

    @staticmethod
    def reduce_digits(n: int, reduce_to_master: bool = True) -> int:
        """Reduces a number to a single digit or master number (11, 22, 33)."""
        while n > 9:
            if reduce_to_master and n in [11, 22, 33]:
                return n
            n = sum(int(digit) for digit in str(n))
        return n

    def calculate_life_path(self, dob: str) -> int:
        """
        Calculates Life Path Number from date of birth (YYYY-MM-DD).
        """
        try:
            date_obj = datetime.strptime(dob, "%Y-%m-%d")
            year_red = self.reduce_digits(date_obj.year)
            month_red = self.reduce_digits(date_obj.month)
            day_red = self.reduce_digits(date_obj.day)
            
            return self.reduce_digits(year_red + month_red + day_red)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format.")

    def calculate_expression(self, name: str) -> int:
        """
        Calculates Expression (Destiny) Number from full name.
        """
        name = name.upper().replace(" ", "")
        total = sum(self.PYTHAGOREAN_CHART.get(char, 0) for char in name)
        return self.reduce_digits(total)

    def calculate_personal_year(self, dob: str, year: Optional[int] = None) -> int:
        """
        Calculates Personal Year Number for a given year (defaults to current).
        """
        if year is None:
            year = datetime.now().year
            
        try:
            date_obj = datetime.strptime(dob, "%Y-%m-%d")
            month_red = self.reduce_digits(date_obj.month)
            day_red = self.reduce_digits(date_obj.day)
            year_red = self.reduce_digits(year)
            
            return self.reduce_digits(month_red + day_red + year_red)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format.")

    def get_daily_vibration(self, dob: str, date: Optional[str] = None) -> int:
        """
        Calculates the vibration for a specific day.
        """
        if date is None:
            date_obj = datetime.now()
        else:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            
        personal_year = self.calculate_personal_year(dob, date_obj.year)
        month_red = self.reduce_digits(date_obj.month)
        day_red = self.reduce_digits(date_obj.day)
        
        return self.reduce_digits(personal_year + month_red + day_red)

if __name__ == "__main__":
    # Quick test
    engine = NumerologyEngine()
    print(f"Life Path (1990-01-01): {engine.calculate_life_path('1990-01-01')}")
    print(f"Expression (John Doe): {engine.calculate_expression('John Doe')}")
    print(f"Personal Year 2024: {engine.calculate_personal_year('1990-01-01', 2024)}")
