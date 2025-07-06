# MindGarden Deployment Guide (Free Tier)

## Overview
This guide will help you deploy MindGarden using free services:
- **Frontend**: Vercel (Free)
- **Backend**: Railway (Free tier with $5 credit) or Render (Free)

## Prerequisites
1. GitHub account
2. Vercel account (free)
3. Railway account (free) or Render account (free)
4. Supabase account (free tier)

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mindgarden.git
git push -u origin main
```

### 1.2 Update Environment Variables
You'll need to set up environment variables in both frontend and backend.

## Step 2: Deploy Backend (Railway - Recommended)

### 2.1 Railway Setup
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your mindgarden repository
5. Set the root directory to `backend`

### 2.2 Environment Variables in Railway
Add these environment variables in Railway dashboard:

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AI_API_KEY=your_google_ai_api_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### 2.3 Railway Configuration
Railway will automatically detect it's a Node.js app and run `npm start`.

## Step 3: Deploy Frontend (Vercel)

### 3.1 Vercel Setup
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Set the root directory to `frontend`
6. Framework preset: Vite

### 3.2 Environment Variables in Vercel
Add these environment variables in Vercel dashboard:

```
VITE_API_URL=https://your-railway-app-url.railway.app/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3.3 Deploy
Click "Deploy" and Vercel will build and deploy your app.

## Step 4: Update Google OAuth

### 4.1 Update Google Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized JavaScript origins":
   - `https://your-app-name.vercel.app`
5. Add your Vercel domain to "Authorized redirect URIs":
   - `https://your-app-name.vercel.app`

## Step 5: Test Your Deployment

### 5.1 Test Frontend
- Visit your Vercel URL
- Try logging in with Google
- Test creating goals and tasks

### 5.2 Test Backend
- Test API endpoints using your Railway URL
- Check logs in Railway dashboard

## Alternative: Render Backend

If you prefer Render over Railway:

### Render Setup
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Set root directory to `backend`
6. Build command: `npm install`
7. Start command: `npm start`

### Environment Variables in Render
Same as Railway, but add:
```
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure `CORS_ORIGIN` in backend matches your Vercel domain exactly

2. **Google OAuth Errors**
   - Verify your Google Client ID is correct
   - Check that your Vercel domain is added to Google Console

3. **API Connection Issues**
   - Verify `VITE_API_URL` points to your backend URL
   - Check that backend is running and accessible

4. **Build Errors**
   - Check Vercel build logs
   - Ensure all dependencies are in package.json

### Monitoring
- **Vercel**: Check deployment logs and analytics
- **Railway**: Monitor logs and resource usage
- **Supabase**: Check database logs and usage

## Cost Breakdown (Free Tier)

- **Vercel**: Free (100GB bandwidth, unlimited deployments)
- **Railway**: Free ($5 credit/month, enough for small apps)
- **Render**: Free (slower cold starts but works)
- **Supabase**: Free (500MB database, 50MB file storage)

## Next Steps

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up CI/CD for automatic deployments
4. Consider upgrading to paid tiers as your app grows

## Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set correctly
3. Test locally with production environment variables
4. Check the troubleshooting section above 