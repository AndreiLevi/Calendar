import asyncio
import os
from typing import Optional
from dotenv import load_dotenv

import mcp.types as types
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio

from agents.numerology_expert import NumerologyExpertAgent
from agents.mayan_agent import MayanAgent
from agents.jyotish_agent import JyotishAgent
from orchestrator import StrategyOrchestrator

try:
    from agents.muhurtas_agent import MuhurtasAgent
    from agents.transits_agent import TransitsAgent
    SWISSEPH_AVAILABLE = True
except ImportError:
    MuhurtasAgent = None
    TransitsAgent = None
    SWISSEPH_AVAILABLE = False


# Initialize environment and agents
load_dotenv()

numerology_agent = NumerologyExpertAgent()
mayan_agent = MayanAgent()
jyotish_agent = JyotishAgent()
orchestrator = StrategyOrchestrator()

muhurtas_agent = MuhurtasAgent() if SWISSEPH_AVAILABLE and MuhurtasAgent else None
transits_agent = TransitsAgent() if SWISSEPH_AVAILABLE and TransitsAgent else None

# Initialize MCP Server
server = Server("cosmic-calendar-mcp")

# Define Agent Workspace (Sandbox for files)
WORKSPACE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".agent_workspace")
os.makedirs(WORKSPACE_DIR, exist_ok=True)

def resolve_workspace_path(filename: str) -> str:
    """Ensure path is within the designated workspace"""
    safe_name = os.path.basename(filename) # Prevent directory traversal 
    return os.path.join(WORKSPACE_DIR, safe_name)

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available tools for the MCP client.
    """
    tools = [
        types.Tool(
            name="get_panchanga",
            description="Get Vedic Panchanga (Tithi, Nakshatra, Yoga) for a given date. Date format: YYYY-MM-DD",
            inputSchema={
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"}
                },
                "required": ["date"]
            }
        ),
        types.Tool(
            name="get_mayan_tzolkin",
            description="Get Mayan Tzolkin day (Kin, Seal, Tone, 13-Moon calendar) for a given date. Date format: YYYY-MM-DD",
            inputSchema={
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"}
                },
                "required": ["date"]
            }
        ),
        types.Tool(
            name="get_numerology_profile",
            description="Get numerology profile (Life Path, Expression, Personal Year) for a given date of birth. DOB format: YYYY-MM-DD",
            inputSchema={
                "type": "object",
                "properties": {
                    "dob": {"type": "string", "description": "Date of birth in YYYY-MM-DD format"},
                    "name": {"type": "string", "description": "Name of the person (optional)", "default": "User"}
                },
                "required": ["dob"]
            }
        ),
        types.Tool(
            name="analyze_day_strategy",
            description="Full AI synthesis: combines Numerology + Mayan + Jyotish into daily strategy via LLM",
            inputSchema={
                "type": "object",
                "properties": {
                    "dob": {"type": "string", "description": "Date of birth (YYYY-MM-DD)"},
                    "date": {"type": "string", "description": "Target date for analysis (YYYY-MM-DD)"},
                    "name": {"type": "string", "description": "Name of the user"},
                    "language": {"type": "string", "description": "Language for the response (e.g. 'ru' or 'en')", "default": "ru"},
                    "birth_time": {"type": "string", "description": "Optional birth time (HH:MM)"},
                    "latitude": {"type": "number", "description": "Optional latitude"},
                    "longitude": {"type": "number", "description": "Optional longitude"}
                },
                "required": ["dob", "date", "name"]
            }
        )
    ]
        
    tools.extend([
        types.Tool(
            name="read_file",
            description="Read content of a file (useful for reading instructions or long context). Access is restricted to the .agent_workspace directory.",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {"type": "string", "description": "Name of the file to read (e.g. instruction.md). Path traversal is prevented."}
                },
                "required": ["filename"]
            }
        ),
        types.Tool(
            name="write_file",
            description="Write content to a file. Access is restricted to the .agent_workspace directory.",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {"type": "string", "description": "Name of the file to write to (e.g. strategy.md)."},
                    "content": {"type": "string", "description": "The markdown or text content to write."}
                },
                "required": ["filename", "content"]
            }
        ),
        types.Tool(
            name="list_workspace_files",
            description="List all available files in the agent workspace directory.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ])
    
    if SWISSEPH_AVAILABLE:
        tools.append(
            types.Tool(
                name="get_current_transits",
                description="Get current positions of all 9 Vedic planets (Grahas)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "datetime_iso": {"type": "string", "description": "ISO datetime string, e.g. 2026-03-16T12:00:00Z. If empty, uses now."}
                    }
                }
            )
        )
        
    return tools

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Handle tool execution requests.
    """
    if not arguments:
        arguments = {}

    try:
        # get_panchanga
        if name == "get_panchanga":
            date_str = arguments.get("date")
            result = jyotish_agent.calculate_panchanga(date_str)
            return [types.TextContent(type="text", text=str(result))]

        # get_mayan_tzolkin
        elif name == "get_mayan_tzolkin":
            date_str = arguments.get("date")
            result = mayan_agent.calculate_tzolkin(date_str)
            return [types.TextContent(type="text", text=str(result))]

        # get_numerology_profile
        elif name == "get_numerology_profile":
            dob = arguments.get("dob")
            user_name = arguments.get("name", "User")
            result = numerology_agent.get_profile(dob, user_name)
            return [types.TextContent(type="text", text=str(result))]
            
        # get_current_transits
        elif name == "get_current_transits" and SWISSEPH_AVAILABLE:
            dt_iso = arguments.get("datetime_iso")
            from datetime import datetime, timezone
            if dt_iso:
                dt = datetime.fromisoformat(dt_iso.replace('Z', '+00:00'))
            else:
                dt = datetime.now(timezone.utc)
                
            positions = transits_agent.get_current_positions(dt, "ru")
            return [types.TextContent(type="text", text=str(positions))]

        # analyze_day_strategy
        elif name == "analyze_day_strategy":
            dob = arguments.get("dob")
            date_str = arguments.get("date")
            user_name = arguments.get("name")
            lang = arguments.get("language", "ru")
            
            b_time = arguments.get("birth_time")
            lat = arguments.get("latitude")
            lon = arguments.get("longitude")

            num_profile = numerology_agent.get_profile(dob, user_name)
            num_insight = numerology_agent.get_daily_insight(dob, date_str)
            mayan_data = mayan_agent.calculate_tzolkin(date_str)
            jyotish_data = jyotish_agent.calculate_panchanga(date_str)
            
            birth_chart = None
            if b_time and lat and lon:
                birth_chart = jyotish_agent.calculate_birth_chart(dob, b_time, lat, lon)

            numerology_full = {"profile": num_profile, "daily_insight": num_insight}
            
            result = orchestrator.synthesize_daily_strategy(
                numerology=numerology_full,
                mayan=mayan_data,
                jyotish=jyotish_data,
                user_name=user_name,
                language=lang,
                birth_chart=birth_chart
            )
            
            return [types.TextContent(type="text", text=str(result))]

        # FILE OPERATIONS
        elif name == "read_file":
            filename = arguments.get("filename")
            safe_path = resolve_workspace_path(filename)
            if not os.path.exists(safe_path):
                return [types.TextContent(type="text", text=f"Error: File '{filename}' not found in workspace.")]
            with open(safe_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return [types.TextContent(type="text", text=content)]
            
        elif name == "write_file":
            filename = arguments.get("filename")
            content = arguments.get("content")
            safe_path = resolve_workspace_path(filename)
            with open(safe_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return [types.TextContent(type="text", text=f"File '{filename}' successfully written.")]
            
        elif name == "list_workspace_files":
            files = os.listdir(WORKSPACE_DIR)
            if not files:
                return [types.TextContent(type="text", text="Workspace is empty.")]
            return [types.TextContent(type="text", text="Files in workspace:\n" + "\n".join(files))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        import traceback
        return [types.TextContent(type="text", text=f"Error: {str(e)}\n\n{traceback.format_exc()}")]


async def main():
    # Run the server using stdin/stdout streams
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="cosmic-calendar-mcp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
