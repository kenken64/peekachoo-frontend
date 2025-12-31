# Peekachoo Frontend - Railway Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway

## Environment Variables

The application supports **both build-time and runtime** environment variable injection.

### Build-Time Variables (Railway Build Args)
Set in Railway dashboard - these are baked into the build:

```
VITE_API_URL=https://your-backend-url.railway.app/api
```

### Runtime Variables (Container Environment)
Also set in Railway dashboard - these override build-time vars at container startup:

```
VITE_API_URL=https://your-backend-url.railway.app/api
```

**How it works:**
1. Railway passes `VITE_API_URL` as a build argument to Docker
2. Webpack injects it during the build process
3. At container startup, `docker-entrypoint.sh` creates `env-config.js` with runtime values
4. The app checks `window._env_.API_URL` first (runtime), then falls back to build-time values

Replace `your-backend-url.railway.app` with your actual backend Railway URL.

## Deployment Steps

### Option 1: Deploy via Railway Dashboard

1. Go to https://railway.app
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Choose `peekachoo-frontend` repository
5. Railway will auto-detect the Dockerfile
6. Add environment variable `VITE_API_URL` in the Variables tab
7. Deploy!

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (or create new)
railway link

# Set environment variables
railway variables set VITE_API_URL=https://your-backend-url.railway.app/api

# Deploy
railway up
```

## Build Process

The Dockerfile uses a multi-stage build:

1. **Stage 1 (Builder)**:
   - Uses Node.js 16 Alpine
   - Installs dependencies
   - Runs production build (`npm run deploy`)

2. **Stage 2 (Server)**:
   - Uses nginx Alpine
   - Serves static files from `/build` directory
   - Listens on port 8080

## Files

- `Dockerfile` - Multi-stage build configuration
- `nginx.conf` - Nginx server configuration
- `.dockerignore` - Excludes unnecessary files from build
- `railway.toml` - Railway-specific deployment settings

## Nginx Configuration

The nginx config includes:
- Gzip compression
- Static asset caching (1 year)
- SPA routing support
- Security headers

## Health Check

Railway will check the root path (`/`) for health status.

## Troubleshooting

### Build fails with peer dependency errors
The Dockerfile uses `--legacy-peer-deps` flag to handle this.

### Environment variables not working
Make sure `VITE_API_URL` is set in Railway dashboard before deployment.

### 404 errors on routes
The nginx config includes SPA support with `try_files` directive.

## Port Configuration

Railway automatically sets the PORT environment variable. The nginx config listens on port 8080, which Railway will map to the public URL.
