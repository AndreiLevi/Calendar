"""
Base Agent Interface for Calendar Agents.

All agents should inherit from BaseAgent to ensure a consistent interface
that enables:
1. CLI access
2. API access
3. External integrations (n8n, Telegram, etc.)
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Location:
    """Geographic location with coordinates and timezone."""
    latitude: float
    longitude: float
    timezone: Optional[str] = None  # e.g., "Europe/Moscow", "Asia/Jerusalem"
    name: Optional[str] = None      # e.g., "Moscow", "Tel Aviv"


class BaseAgent(ABC):
    """
    Abstract base class for all Calendar agents.
    
    Provides a standard interface for:
    - Getting current moment data
    - Getting birth/natal data
    - Comparing current to natal (optional)
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of the agent."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Brief description of what this agent calculates."""
        pass
    
    @abstractmethod
    def get_current_data(
        self, 
        dt: datetime, 
        location: Optional[Location] = None
    ) -> Dict[str, Any]:
        """
        Calculate data for the given datetime.
        
        Args:
            dt: The datetime to calculate for (should be timezone-aware)
            location: Optional geographic location for location-dependent calculations
            
        Returns:
            Dictionary with calculated data specific to this agent
        """
        pass
    
    def get_birth_data(
        self, 
        birth_dt: datetime, 
        location: Optional[Location] = None
    ) -> Dict[str, Any]:
        """
        Calculate natal/birth data.
        
        Default implementation just calls get_current_data.
        Override if birth calculations differ from current calculations.
        
        Args:
            birth_dt: Birth datetime (should be timezone-aware)
            location: Birth location
            
        Returns:
            Dictionary with natal data
        """
        return self.get_current_data(birth_dt, location)
    
    def compare(
        self, 
        current: Dict[str, Any], 
        birth: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare current data to birth/natal data.
        
        Override this method for agents that provide transit-to-natal analysis.
        
        Args:
            current: Data from get_current_data()
            birth: Data from get_birth_data()
            
        Returns:
            Dictionary with comparison/analysis results
        """
        return {}
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.name}>"
