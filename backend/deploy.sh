#!/bin/bash

# 🚀 Railway Deployment Script
# This script helps prepare and deploy the backend to Railway

set -e

echo "🚀 Starting Railway deployment preparation..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Check if project is initialized
if [ ! -f ".railway" ]; then
    echo "📁 Initializing Railway project..."
    railway init
fi

echo "✅ Railway project initialized!"

# Display current status
echo "📊 Current Railway status:"
railway status

echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables:"
echo "   railway variables set DATABASE_URL='your-database-url'"
echo "   railway variables set JWT_SECRET_KEY='your-secret-key'"
echo "   railway variables set REDIS_URL='your-redis-url'"
echo "   railway variables set ABLY_API_KEY='your-ably-key'"
echo "   railway variables set CORS_ORIGINS='https://your-frontend-domain.com'"
echo ""
echo "2. Deploy the application:"
echo "   railway up"
echo ""
echo "3. Check deployment status:"
echo "   railway logs"
echo ""
echo "📖 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
