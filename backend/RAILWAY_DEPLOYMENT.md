# 🚀 Railway Deployment Guide

## 📋 **Prerequisites**

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway CLI** (optional): `npm install -g @railway/cli`

## 🔧 **Configuration Files**

### **1. railway.json** ✅
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### **2. Procfile** ✅
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### **3. runtime.txt** ✅
```
python-3.11.7
```

### **4. Dockerfile** ✅
- Updated for Railway deployment
- Uses `$PORT` environment variable
- Includes health checks
- Non-root user for security

## 🌍 **Environment Variables**

Set these environment variables in Railway dashboard:

### **Required Variables:**
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Redis
REDIS_URL=redis://username:password@host:port/database

# Ably (for real-time features)
ABLY_API_KEY=your-ably-api-key

# CORS (comma-separated)
CORS_ORIGINS=https://your-frontend-domain.com,https://another-domain.com

# Environment
ENVIRONMENT=production
DEBUG=False
```

### **Optional Variables:**
```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT Configuration
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## 🚀 **Deployment Steps**

### **Method 1: Railway Dashboard (Recommended)**

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**
   - Railway will auto-detect it's a Python project
   - Set the root directory to `backend/` (if your backend is in a subdirectory)
   - Railway will use the `railway.json` configuration

3. **Add Environment Variables**
   - Go to your service settings
   - Add all required environment variables
   - Save changes

4. **Deploy**
   - Railway will automatically deploy on every push to main branch
   - Monitor the deployment logs

### **Method 2: Railway CLI**

1. **Install CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL="your-database-url"
   railway variables set JWT_SECRET_KEY="your-secret-key"
   # ... set all other variables
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## 🗄️ **Database Setup**

### **Option 1: Railway PostgreSQL**
1. Add PostgreSQL plugin in Railway
2. Copy the connection string to `DATABASE_URL`
3. Railway will automatically run migrations

### **Option 2: External Database**
1. Use any PostgreSQL provider (Supabase, Neon, etc.)
2. Set the connection string in `DATABASE_URL`

## 🔴 **Redis Setup**

### **Option 1: Railway Redis**
1. Add Redis plugin in Railway
2. Copy the connection string to `REDIS_URL`

### **Option 2: External Redis**
1. Use any Redis provider (Upstash, Redis Cloud, etc.)
2. Set the connection string in `REDIS_URL`

## 🔍 **Health Check**

The application includes a health check endpoint at `/health`:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T12:00:00Z"
}
```

## 📊 **Monitoring**

### **Railway Dashboard**
- View deployment logs
- Monitor resource usage
- Check environment variables
- View service health

### **Application Logs**
```bash
railway logs
```

### **Custom Metrics**
Add logging to your application:
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Port Issues**
   - Ensure using `$PORT` environment variable
   - Check `railway.json` start command

2. **Database Connection**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Railway

3. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match config.py

4. **Dependencies**
   - Verify all packages in requirements.txt
   - Check for missing system dependencies

### **Debug Commands:**
```bash
# Check logs
railway logs

# SSH into container
railway shell

# Check environment variables
railway variables

# Restart service
railway service restart
```

## 🔒 **Security Best Practices**

1. **Environment Variables**
   - Never commit secrets to Git
   - Use Railway's encrypted variables
   - Rotate secrets regularly

2. **Database**
   - Use SSL connections
   - Restrict database access
   - Regular backups

3. **Application**
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all inputs

## 📈 **Scaling**

### **Automatic Scaling**
Railway can automatically scale based on:
- CPU usage
- Memory usage
- Request volume

### **Manual Scaling**
```bash
railway scale web=2
```

### **Resource Limits**
Monitor and adjust:
- CPU allocation
- Memory allocation
- Disk space

## 🔄 **CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## 📞 **Support**

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Create issues in your repository

## ✅ **Deployment Checklist**

- [ ] Repository connected to Railway
- [ ] All environment variables set
- [ ] Database configured and accessible
- [ ] Redis configured and accessible
- [ ] Health check endpoint working
- [ ] CORS origins configured
- [ ] JWT secret key set
- [ ] Ably API key configured (if using real-time features)
- [ ] Email configuration set (if using email features)
- [ ] Application logs monitored
- [ ] Performance metrics checked
- [ ] Security measures implemented
