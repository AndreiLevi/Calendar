"""
Flexible Webhook Router for Cosmic Calendar.

A single POST /api/webhook endpoint that accepts JSON with "action" and "params",
understands what the caller wants, and routes to the appropriate agent(s).

Similar to MCP (Model Context Protocol) but over HTTP.

Usage:
    POST /api/webhook
    {
        "action": "get_hora",
        "params": {"latitude": 32.08, "longitude": 34.78, "language": "ru"}
    }

    Response:
    {
        "success": true,
        "action": "get_hora",
        "data": { ... },
        "timestamp": "2026-03-15T21:00:00+00:00"
    }
"""

import os
import traceback
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field


@dataclass
class WebhookAction:
    """Describes a single webhook action (like an MCP tool)."""
    name: str
    description: str
    handler: Callable
    required_params: List[str] = field(default_factory=list)
    optional_params: Dict[str, Any] = field(default_factory=dict)  # name -> default value


class WebhookRouter:
    """
    Routes incoming webhook requests to the appropriate agent handler.
    
    Acts like an MCP server: 
    - Callers can discover available actions via "list_actions"
    - Each action has required/optional params and a description
    - The router validates params and calls the right agent
    """

    def __init__(self):
        self._actions: Dict[str, WebhookAction] = {}
        self._api_key: Optional[str] = os.getenv("WEBHOOK_API_KEY")
        
        # Register built-in actions
        self._register_builtin_actions()

    def _register_builtin_actions(self):
        """Register the list_actions discovery action."""
        self.register(WebhookAction(
            name="list_actions",
            description="List all available webhook actions with their parameters (like MCP list_tools)",
            handler=self._handle_list_actions,
            required_params=[],
            optional_params={}
        ))

    def register(self, action: WebhookAction):
        """Register a new action in the router."""
        self._actions[action.name] = action

    def get_actions_list(self) -> List[Dict[str, Any]]:
        """Get list of all registered actions with metadata."""
        actions = []
        for name, action in sorted(self._actions.items()):
            actions.append({
                "action": name,
                "description": action.description,
                "required_params": action.required_params,
                "optional_params": {k: str(type(v).__name__) for k, v in action.optional_params.items()},
            })
        return actions

    def validate_api_key(self, provided_key: Optional[str]) -> bool:
        """Validate API key. If no key configured, allow all."""
        if not self._api_key:
            return True  # No key set = dev mode, allow all
        return provided_key == self._api_key

    async def dispatch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main dispatcher. Takes the webhook payload and routes to the right handler.
        
        Args:
            payload: {"action": "...", "params": {...}, "api_key": "..."}
            
        Returns:
            Structured response dict
        """
        action_name = payload.get("action")
        params = payload.get("params", {})
        api_key = payload.get("api_key")

        # Validate API key
        if not self.validate_api_key(api_key):
            return {
                "success": False,
                "error": "Invalid or missing API key",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Check action exists
        if not action_name:
            return {
                "success": False,
                "error": "Missing 'action' field. Use 'list_actions' to see available actions.",
                "available_actions": [a["action"] for a in self.get_actions_list()],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        action = self._actions.get(action_name)
        if not action:
            return {
                "success": False,
                "error": f"Unknown action: '{action_name}'",
                "available_actions": [a["action"] for a in self.get_actions_list()],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Validate required params
        missing = [p for p in action.required_params if p not in params]
        if missing:
            return {
                "success": False,
                "error": f"Missing required params for '{action_name}': {missing}",
                "required_params": action.required_params,
                "optional_params": list(action.optional_params.keys()),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Merge defaults for optional params
        full_params = {**action.optional_params, **params}

        # Execute handler
        try:
            result = action.handler(full_params)
            # Support async handlers
            if hasattr(result, '__await__'):
                result = await result

            return {
                "success": True,
                "action": action_name,
                "data": result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            traceback.print_exc()
            return {
                "success": False,
                "action": action_name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _handle_list_actions(self, params: Dict) -> List[Dict[str, Any]]:
        """Built-in: return all registered actions."""
        return self.get_actions_list()


def create_webhook_router(
    muhurtas_agent=None,
    transits_agent=None,
    jyotish_agent=None,
    mayan_agent=None,
    numerology_agent=None,
    orchestrator=None
) -> WebhookRouter:
    """
    Factory: creates a WebhookRouter with all agent actions registered.
    
    Pass in the agent instances from main.py. If an agent is None
    (e.g. pyswisseph not installed), its actions won't be registered.
    """
    router = WebhookRouter()

    # --- Muhurtas Agent ---
    if muhurtas_agent:
        def handle_muhurtas(params):
            from datetime import datetime as dt, timezone as tz
            datetime_str = params.get("datetime")
            if datetime_str:
                date = dt.fromisoformat(datetime_str.replace('Z', '+00:00'))
            else:
                date = dt.now(tz.utc)
            return muhurtas_agent.get_all_muhurtas(
                date, params["latitude"], params["longitude"], params.get("language", "ru")
            )

        router.register(WebhookAction(
            name="get_muhurtas",
            description="Get all muhurtas: Hora, Rahu Kala, Brahma Muhurta, Abhijit for given location",
            handler=handle_muhurtas,
            required_params=["latitude", "longitude"],
            optional_params={"language": "ru", "datetime": None}
        ))

        def handle_hora(params):
            from datetime import datetime as dt, timezone as tz
            return muhurtas_agent.get_current_hora(
                dt.now(tz.utc), params["latitude"], params["longitude"], params.get("language", "ru")
            )

        router.register(WebhookAction(
            name="get_hora",
            description="Get current planetary hour (Hora) for given location",
            handler=handle_hora,
            required_params=["latitude", "longitude"],
            optional_params={"language": "ru"}
        ))

        def handle_rahu_kala(params):
            from datetime import datetime as dt, timezone as tz
            return muhurtas_agent.get_rahu_kala(
                dt.now(tz.utc), params["latitude"], params["longitude"], params.get("language", "ru")
            )

        router.register(WebhookAction(
            name="get_rahu_kala",
            description="Get Rahu Kala (inauspicious period) for today at given location",
            handler=handle_rahu_kala,
            required_params=["latitude", "longitude"],
            optional_params={"language": "ru"}
        ))

    # --- Transits Agent ---
    if transits_agent:
        def handle_transits(params):
            from datetime import datetime as dt, timezone as tz
            datetime_str = params.get("datetime")
            if datetime_str:
                date = dt.fromisoformat(datetime_str.replace('Z', '+00:00'))
            else:
                date = dt.now(tz.utc)
            positions = transits_agent.get_current_positions(date, params.get("language", "ru"))
            significant = transits_agent.get_significant_transits(date, params.get("language", "ru"))
            return {
                "positions": positions,
                "significant_transits": significant
            }

        router.register(WebhookAction(
            name="get_transits",
            description="Get current positions of all 9 Vedic planets (Grahas) with retrograde status",
            handler=handle_transits,
            required_params=[],
            optional_params={"language": "ru", "datetime": None}
        ))

    # --- Jyotish Agent ---
    if jyotish_agent:
        def handle_panchanga(params):
            return jyotish_agent.calculate_panchanga(params["date"])

        router.register(WebhookAction(
            name="get_panchanga",
            description="Get Vedic Panchanga (Tithi, Nakshatra, Yoga) for a given date",
            handler=handle_panchanga,
            required_params=["date"],
            optional_params={}
        ))

    # --- Mayan Agent ---
    if mayan_agent:
        def handle_mayan(params):
            return mayan_agent.calculate_tzolkin(params["date"])

        router.register(WebhookAction(
            name="get_mayan",
            description="Get Mayan Tzolkin day (Kin, Seal, Tone, 13-Moon calendar) for a given date",
            handler=handle_mayan,
            required_params=["date"],
            optional_params={}
        ))

    # --- Numerology Agent ---
    if numerology_agent:
        def handle_numerology(params):
            profile = numerology_agent.get_profile(params["dob"], params.get("name", "User"))
            return profile

        router.register(WebhookAction(
            name="get_numerology",
            description="Get numerology profile: Life Path, Expression, Personal Year",
            handler=handle_numerology,
            required_params=["dob"],
            optional_params={"name": "User"}
        ))

        def handle_daily_vibration(params):
            vibe = numerology_agent.engine.get_daily_vibration(params["dob"], params.get("date"))
            forecast = numerology_agent.get_productivity_forecast(vibe)
            return {
                "vibration": vibe,
                "forecast": forecast,
                "insight": numerology_agent.get_daily_insight(params["dob"], params.get("date", None))
            }

        router.register(WebhookAction(
            name="get_daily_vibration",
            description="Get daily numerological vibration and productivity forecast",
            handler=handle_daily_vibration,
            required_params=["dob"],
            optional_params={"date": None}
        ))

    # --- Jyotish & Transits Combined (Birth Chart) ---
    if jyotish_agent and transits_agent:
        def handle_birth_chart(params):
            from datetime import datetime as dt, timezone as tz
            
            # Parse datetime
            datetime_str = params.get("datetime")
            date_only = params.get("date") # fallback
            
            if datetime_str:
                date_val = dt.fromisoformat(datetime_str.replace('Z', '+00:00'))
                # Also need a YYYY-MM-DD for panchanga if it's strict
                date_str = date_val.strftime('%Y-%m-%d')
            else:
                date_str = date_only
                # Assume noon UTC
                date_val = dt.strptime(date_str, '%Y-%m-%d').replace(hour=12, tzinfo=tz.utc)

            panchanga = jyotish_agent.calculate_panchanga(date_str)
            grahas = transits_agent.get_current_positions(date_val, params.get("language", "ru"))
            
            return {
                "panchanga": panchanga,
                "grahas": grahas["planets"]
            }

        router.register(WebhookAction(
            name="get_birth_chart",
            description="Get full Vedic birth chart (Panchanga + planetary positions) based on exact datetime",
            handler=handle_birth_chart,
            required_params=[],
            optional_params={"datetime": None, "date": "2000-01-01", "language": "ru"}
        ))

    # --- Full User Profile (All Systems) ---
    if numerology_agent and mayan_agent and jyotish_agent and transits_agent:
        def handle_get_full_profile(params):
            from datetime import datetime as dt, timezone as tz
            
            dob = params.get("dob", "2000-01-01")
            name = params.get("name", "User")
            datetime_str = params.get("datetime")
            language = params.get("language", "ru")
            
            # 1. Numerology
            num_profile = numerology_agent.get_profile(dob, name)
            
            # 2. Mayan
            mayan_profile = mayan_agent.calculate_tzolkin(dob)
            
            # 3. Jyotish (Birth Chart)
            if datetime_str:
                date_val = dt.fromisoformat(datetime_str.replace('Z', '+00:00'))
                date_str = date_val.strftime('%Y-%m-%d')
            else:
                date_str = dob
                date_val = dt.strptime(date_str, '%Y-%m-%d').replace(hour=12, tzinfo=tz.utc)

            panchanga = jyotish_agent.calculate_panchanga(date_str)
            grahas = transits_agent.get_current_positions(date_val, language)
            
            return {
                "user_info": {
                    "name": name,
                    "dob": dob,
                    "time_utc": datetime_str if datetime_str else "12:00:00 (assumed)"
                },
                "numerology": num_profile,
                "mayan": mayan_profile,
                "jyotish": {
                    "panchanga": panchanga,
                    "grahas": grahas["planets"]
                }
            }

        router.register(WebhookAction(
            name="get_full_profile",
            description="Get a complete unified profile (Numerology, Mayan, Vedic Birth Chart) in one call",
            handler=handle_get_full_profile,
            required_params=["dob"],
            optional_params={"name": "User", "datetime": None, "language": "ru"}
        ))

    # --- Strategy Orchestrator (AI) ---
    if orchestrator and mayan_agent and numerology_agent and jyotish_agent:
        def handle_analyze_day(params):
            dob = params["dob"]
            date = params["date"]
            name = params.get("name", "User")
            language = params.get("language", "ru")

            num_profile = numerology_agent.get_profile(dob, name)
            num_insight = numerology_agent.get_daily_insight(dob, date)
            mayan_data = mayan_agent.calculate_tzolkin(date)
            jyotish_data = jyotish_agent.calculate_panchanga(date)

            numerology_full = {"profile": num_profile, "daily_insight": num_insight}
            result = orchestrator.synthesize_daily_strategy(
                numerology=numerology_full,
                mayan=mayan_data,
                jyotish=jyotish_data,
                user_name=name,
                language=language
            )

            if isinstance(result, dict):
                return {"strategy": result.get("strategy"), "raw_data": {
                    "numerology": numerology_full,
                    "mayan": mayan_data,
                    "jyotish": jyotish_data
                }}
            return {"strategy": result}

        router.register(WebhookAction(
            name="analyze_day",
            description="Full AI synthesis: combines Numerology + Mayan + Jyotish into daily strategy via LLM",
            handler=handle_analyze_day,
            required_params=["dob", "date", "name"],
            optional_params={"language": "ru"}
        ))

        def handle_ask_agent(params):
            question = params.get("question")
            language = params.get("language", "ru")
            
            # The client decides what context data to request by providing these flags
            include_muhurtas = params.get("include_muhurtas", False)
            include_numerology = params.get("include_numerology", False)
            include_mayan = params.get("include_mayan", False)
            include_birth_chart = params.get("include_birth_chart", False)
            
            # Basic params needed for generation
            lat = params.get("latitude", 0.0)
            lon = params.get("longitude", 0.0)
            dob = params.get("dob", "2000-01-01")
            date_str = params.get("date", "2026-03-15")
            birth_time = params.get("birth_time", None)
            
            context_data = {}
            from datetime import datetime as dt, timezone as tz
            
            if include_muhurtas and muhurtas_agent:
                context_data["muhurtas"] = muhurtas_agent.get_all_muhurtas(dt.now(tz.utc), lat, lon, language)
            
            if include_numerology and numerology_agent:
                num_insight = numerology_agent.get_daily_insight(dob, date_str)
                context_data["numerology_daily"] = num_insight
                
            if include_mayan and mayan_agent:
                context_data["mayan"] = mayan_agent.calculate_tzolkin(date_str)
                
            if include_birth_chart and jyotish_agent and birth_time and lat and lon:
                context_data["birth_chart"] = jyotish_agent.calculate_birth_chart(dob, birth_time, lat, lon)
                
            # Synthesize answer
            answer = orchestrator.ask_agent(question, context_data, language)
            
            return {
                "question": question,
                "answer": answer,
                "context_used": list(context_data.keys())
            }

        router.register(WebhookAction(
            name="ask_agent",
            description="Ask the AI a specific question using a subset of agent data (e.g., 'What is the current muhurta?')",
            handler=handle_ask_agent,
            required_params=["question"],
            optional_params={
                "language": "ru",
                "include_muhurtas": False,
                "include_numerology": False,
                "include_mayan": False,
                "include_birth_chart": False,
                "latitude": 0.0,
                "longitude": 0.0,
                "dob": "2000-01-01",
                "date": "2026-03-15",
                "birth_time": None
            }
        ))

    return router
