# Backend Services

Two Docker services + Redis managed addon.

## Services
- `server/` — Node.js Socket.io server (port 3001)
- `services/transcription/` — Python FastAPI (port 8000)
- Redis — managed by Render or Railway

## Local Development

```bash
cd backend
docker compose up
```

This starts:
- Redis on `:6379`
- Node.js server on `:3001`
- FastAPI transcription on `:8000`

## Deploy to Render

### Node Server
1. render.com → New Web Service → GitHub → select repo
2. Root directory: `backend/server`
3. Runtime: Docker
4. Add env vars from `server/.env.example`

### FastAPI
1. render.com → New Web Service → GitHub → select repo
2. Root directory: `backend/services/transcription`
3. Runtime: Docker
4. Add env vars from `services/transcription/.env.example`

### Redis
1. render.com → New → Redis
2. Copy Internal Redis URL → paste into both services as `REDIS_URL`

## Deploy Sequence

1. **Deploy Redis** on Render (free tier) → copy Internal Redis URL
2. **Deploy Node server** → set `REDIS_URL` to internal URL from step 1
3. **Deploy FastAPI** → set `REDIS_URL` to internal URL from step 1
4. **Note both Render URLs** (e.g. `https://interview-ai-server.onrender.com`)
5. **Deploy frontend** on Vercel → set `NEXT_PUBLIC_SOCKET_URL` to Node server URL
6. **Update CORS** on Node server → set `NEXT_PUBLIC_APP_URL` to Vercel URL
7. **Update Supabase webhook** → point to FastAPI Render URL
8. **Verify health checks**:
   ```bash
   curl https://your-app.vercel.app/api/health
   curl https://interview-ai-server.onrender.com/health
   curl https://interview-ai-transcription.onrender.com/health
   ```

## Environment Variables
See `.env.example` files in each service directory.
