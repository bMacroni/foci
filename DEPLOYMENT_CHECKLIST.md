# Deployment Checklist

## Pre-Deployment
- [ ] Code is working locally
- [ ] All environment variables documented
- [ ] Repository pushed to GitHub
- [ ] Google OAuth credentials ready

## Backend Deployment (Railway)
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_AI_API_KEY`
  - [ ] `CORS_ORIGIN` (will be your Vercel URL)
- [ ] Deploy and get backend URL

## Frontend Deployment (Vercel)
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Framework preset: Vite
- [ ] Add environment variables:
  - [ ] `VITE_API_URL` (your Railway backend URL)
  - [ ] `VITE_GOOGLE_CLIENT_ID`
- [ ] Deploy and get frontend URL

## Post-Deployment
- [ ] Update Google OAuth with Vercel domain
- [ ] Test login functionality
- [ ] Test goal creation
- [ ] Test task creation
- [ ] Test AI chat
- [ ] Check all features work

## URLs to Save
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`
- Supabase Dashboard: `https://app.supabase.com`

## Quick Commands
```bash
# Test backend locally with production env
cd backend
npm start

# Test frontend locally with production API
cd frontend
VITE_API_URL=https://your-backend-url npm run dev
``` 