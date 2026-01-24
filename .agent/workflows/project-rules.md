---
description: Project structure and deployment rules for Cosmic Calendar
---

# Calendar Project Structure

## Folder Layout

- `C:\Users\User\CAlendar\Calendar` - **Local workspace** (what you edit)
  - This folder is also the GitHub repository that gets deployed
  - `/frontend` - Vite React app
  - `/backend` - FastAPI Python backend
  - `/agents` - Python agents (Muhurtas, Transits, Jyotish)

## Deployment

- **Backend**: Deploys to Railway from `backend/` folder
- **Frontend**: Deploys to Railway from `frontend/` folder (or separate Netlify)
- **GitHub repo**: Push to main branch triggers Railway auto-deploy

## Environment Variables

- **Local dev**: Use `.env.local` in `frontend/` for `VITE_API_URL`
- **Production**: Set `VITE_API_URL` in Railway/Netlify dashboard

## Important Notes

- Backend requires `pyswisseph` which only installs on Linux (Railway works, Windows fails)
- Frontend connects to Railway backend via `VITE_API_URL`
- Always commit and push changes to see them in production
