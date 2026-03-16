---
description: Project structure and deployment rules for Cosmic Calendar
---

# Cosmic Calendar Project Rules

## 📁 Project Structure

```
C:\Users\User\CAlendar\Calendar\  ← GitHub repo, deployed to Railway
├── frontend/                     ← Vite React app
│   ├── src/
│   │   ├── components/          ← Sidebar, Layout, ParticleBackground
│   │   ├── pages/               ← TransitsPage, TimePage, ProjectsPage
│   │   ├── utils/               ← numerologyEngine, mayanEngine, jyotishEngine
│   │   ├── App.jsx              ← Dashboard page
│   │   ├── api.js               ← API functions (cosmicAPI, profileAPI)
│   │   └── main.jsx             ← React Router setup
│   └── .env.local               ← Local VITE_API_URL (not committed)
├── backend/                      ← FastAPI Python backend
│   ├── main.py                  ← API endpoints
│   ├── services/                ← task_service, profile_service
│   └── database/                ← SQL migrations
└── agents/                       ← Python agents
    ├── muhurtas_agent.py        ← Hora, Rahu Kala, Brahma Muhurta
    ├── transits_agent.py        ← Planetary positions (Vedic)
    └── jyotish_agent.py         ← Panchanga calculations
```

## 🚀 Deployment

| Component | Platform | Trigger |
|-----------|----------|---------|
| Backend   | Railway  | Push to `main` branch |
| Frontend  | Railway/Netlify | Push to `main` branch |

**Backend URL**: `https://merry-flow-production.up.railway.app`

## 🔧 Environment Variables

### Local Development

- Create `frontend/.env.local`:

  ```
  VITE_API_URL=https://merry-flow-production.up.railway.app
  ```

### Production (Railway)

- `SUPABASE_URL`, `SUPABASE_KEY` — for database
- `OPENAI_API_KEY` — for AI strategy
- `VITE_API_URL` — for frontend

## ⚠️ Important Constraints

1. **pyswisseph** — Only installs on Linux. Backend runs on Railway, NOT locally on Windows
2. **State Management** — Profile data stored in `Layout.jsx` context, shared via `useOutletContext()`
3. **Routing** — Using `react-router-dom@7.x` with nested routes

## 🕵️ Observability (Opik)

We use **Opik** for tracing LLM calls and debugging agents.

### Local Setup

1. **Start Opik**:

   ```powershell
   & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose --profile opik up -d
   ```

   (Run inside `C:\Users\User\opik\deployment\docker-compose`)

2. **Dashboard**: [http://localhost:5173](http://localhost:5173)
3. **Usage**:
   - Add `@track` decorator to agent methods.
   - Ensure `opik` is installed and configured in `main.py`.

## 📝 Development Logs

All work should be tracked in artifacts:

- `task.md` — Current task checklist
- `implementation_plan.md` — Architecture decisions
- `walkthrough.md` — Completed work summary

### Session Log Location

`C:\Users\User\.gemini\antigravity\brain\ebc4216a-0737-4453-91e8-ea9b83541f4d\`

## 🔄 Workflow

// turbo-all

1. Make changes locally in `C:\Users\User\CAlendar\Calendar\`
2. Test with `npm run dev` (frontend)
3. Commit: `git add . && git commit -m "message"`
4. Deploy: `git push` — Railway auto-deploys
