# 🚀 Vercel Deployment Guide - Frontend

## 📋 **Prerequisites**

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **Node.js**: Version 16 or higher

## 🔧 **Configuration Files**

### **1. vercel.json** ✅
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/manifest.json",
      "dest": "/manifest.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### **2. package.json** ✅
- Already configured with proper build scripts
- Uses `react-scripts` for building
- Output directory is `build/`

## 🌍 **Environment Variables**

### **Required Environment Variable:**
```bash
REACT_APP_API_BASE_URL=https://your-backend-url.railway.app
```

### **Setting Environment Variables:**

#### **Method 1: Vercel Dashboard**
1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add:
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://your-backend-url.railway.app`
   - **Environment**: Production, Preview, Development

#### **Method 2: Vercel CLI**
```bash
vercel env add REACT_APP_API_BASE_URL
# Enter: https://your-backend-url.railway.app
```

## 🚀 **Deployment Steps**

### **Method 1: Vercel CLI (Recommended)**

#### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

#### **Step 2: Login to Vercel**
```bash
vercel login
```

#### **Step 3: Navigate to Frontend Directory**
```bash
cd frontend
```

#### **Step 4: Deploy**
```bash
vercel
```

#### **Step 5: Follow the Prompts**
- Set up and deploy? → `Y`
- Which scope? → Select your account
- Link to existing project? → `N` (for first deployment)
- Project name? → `workflow-frontend` (or your preferred name)
- In which directory is your code located? → `./` (current directory)
- Want to override the settings? → `N`

#### **Step 6: Set Environment Variables**
```bash
vercel env add REACT_APP_API_BASE_URL
# Enter your backend URL: https://your-backend-url.railway.app
```

#### **Step 7: Redeploy with Environment Variables**
```bash
vercel --prod
```

### **Method 2: Vercel Dashboard**

#### **Step 1: Connect Repository**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `frontend/`

#### **Step 2: Configure Build Settings**
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

#### **Step 3: Add Environment Variables**
1. Go to Project Settings → Environment Variables
2. Add `REACT_APP_API_BASE_URL` with your backend URL

#### **Step 4: Deploy**
1. Click "Deploy"
2. Vercel will automatically build and deploy your app

## 🔧 **Build Configuration**

### **Build Process**
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Output goes to build/ directory
```

### **Build Output**
- Static files in `build/` directory
- Optimized for production
- Includes all assets (JS, CSS, images)

## 🌐 **Domain Configuration**

### **Custom Domain (Optional)**
1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Configure DNS settings
4. Wait for SSL certificate

### **Default Vercel Domain**
- Format: `your-project.vercel.app`
- Automatically provided
- HTTPS enabled by default

## 🔍 **Testing Deployment**

### **1. Check Build Logs**
- View build logs in Vercel dashboard
- Check for any build errors
- Verify environment variables are loaded

### **2. Test Application**
- Visit your deployed URL
- Test all major features
- Check API connectivity

### **3. Check Environment Variables**
```javascript
// In browser console
console.log(process.env.REACT_APP_API_BASE_URL);
```

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Build Failures**
```bash
# Check build locally first
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

#### **2. Environment Variables Not Loading**
- Ensure variable name starts with `REACT_APP_`
- Check Vercel dashboard settings
- Redeploy after adding variables

#### **3. API Connection Issues**
- Verify backend URL is correct
- Check CORS configuration on backend
- Ensure backend is deployed and running

#### **4. Routing Issues**
- Check `vercel.json` rewrites configuration
- Ensure React Router is configured correctly

### **Debug Commands:**
```bash
# Check Vercel CLI version
vercel --version

# List projects
vercel ls

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## 📊 **Monitoring**

### **Vercel Analytics**
- View page views and performance
- Monitor Core Web Vitals
- Track user behavior

### **Function Logs**
- View serverless function logs
- Monitor API calls
- Debug issues

## 🔄 **Continuous Deployment**

### **Automatic Deployments**
- Every push to main branch triggers deployment
- Preview deployments for pull requests
- Automatic rollback on failures

### **Manual Deployments**
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## 🔒 **Security**

### **Environment Variables**
- Never commit secrets to Git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly

### **HTTPS**
- Automatically enabled
- SSL certificates managed by Vercel
- HSTS headers included

## 📈 **Performance**

### **Optimizations**
- Automatic code splitting
- Static asset optimization
- CDN distribution
- Edge caching

### **Monitoring**
- Core Web Vitals tracking
- Performance analytics
- Error monitoring

## ✅ **Deployment Checklist**

- [ ] Vercel CLI installed and logged in
- [ ] Environment variables configured
- [ ] Backend URL set correctly
- [ ] Build passes locally
- [ ] Application deployed successfully
- [ ] All features working
- [ ] API connectivity verified
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Monitoring set up

## 📞 **Support**

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Discord**: [discord.gg/vercel](https://discord.gg/vercel)
- **GitHub Issues**: Create issues in your repository

## 🚀 **Quick Deploy Command**

```bash
# One-liner deployment
cd frontend && vercel --prod
```
