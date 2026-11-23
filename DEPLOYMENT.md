# Hosting & Deployment Guide

This project consists of 4 parts:
1. **Database**: PostgreSQL (already cloud-hosted on [Neon](https://neon.tech))
2. **AI Service**: Python FastAPI (`ai-service/`)
3. **Backend API**: Spring Boot (`backend/`)
4. **Frontend UI**: React + Vite (`frontend/`)

---

## Architecture Flow in Production

```
Browser -> Hosted Frontend (Vercel/Netlify)
               |
               v (HTTPS REST API with JWT)
           Hosted Backend (Render/Railway)
             /       \
            v         v
     Neon PostgreSQL   Hosted AI Service (Render/Railway/HF Spaces)
```

---

## Free & Recommended Hosting Architecture

### Option 1 (Recommended):
- **Database**: Already hosted on Neon (No action needed)
- **Backend**: Hosted on [Render](https://render.com) (Web Service using Docker or Java)
- **AI Service**: Hosted on [Render](https://render.com) (Web Service using Docker or Python)
- **Frontend**: Hosted on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

---

## Step 1: Deploy AI Service (FastAPI) on Render

1. Create a new **Web Service** on Render connected to your GitHub repository.
2. Root Directory: `ai-service`
3. Environment: `Docker` (or Python 3.11 with Build Command `pip install -r requirements.txt` and Start Command `uvicorn app:app --host 0.0.0.0 --port $PORT`).
4. Copy your AI Service URL once deployed (e.g. `https://career-ai-service.onrender.com`).

---

## Step 2: Deploy Backend (Spring Boot) on Render

1. Create a new **Web Service** on Render connected to your GitHub repository.
2. Root Directory: `backend`
3. Environment: `Docker` (uses `backend/Dockerfile`).
4. Set Environment Variables in Render Dashboard:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://ep-nameless-bonus-ao7hwmx2-pooler.c-2.ap-southeast-1.aws.neon.tech/careerguidance?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `neondb_owner`
   - `SPRING_DATASOURCE_PASSWORD`: `<your-neon-password>`
   - `JWT_SECRET`: `<your-jwt-secret>`
   - `JWT_EXPIRATION_MS`: `86400000`
   - `AI_SERVICE_BASE_URL`: `https://career-ai-service.onrender.com` (from Step 1)
   - `NLP_SERVICE_URL`: `https://career-ai-service.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app,http://localhost:5173`
5. Copy your Backend URL once deployed (e.g. `https://career-backend.onrender.com`).

---

## Step 3: Deploy Frontend on Vercel or Netlify

### Deploying to Vercel:
1. Import your GitHub repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://career-backend.onrender.com` (your backend URL without trailing slash)
5. Click **Deploy**.

---

## Docker Compose (Full Stack Single-Host Deployment)

If deploying to a VPS (e.g. AWS EC2, DigitalOcean Droplet, Linode):
```bash
docker compose up -d --build
```
This builds and launches all 3 services mapped to their respective ports.
