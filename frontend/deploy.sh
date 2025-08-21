#!/bin/bash

# 🚀 Vercel Frontend Deployment Script

set -e

echo "🚀 Starting Vercel frontend deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "📁 Initializing Vercel project..."
    vercel
fi

echo "✅ Vercel project initialized!"

# Check if environment variable is set
if ! vercel env ls | grep -q "REACT_APP_API_BASE_URL"; then
    echo "⚠️  REACT_APP_API_BASE_URL not found. Please set it:"
    echo "   vercel env add REACT_APP_API_BASE_URL"
    echo "   Then enter your backend URL (e.g., https://your-backend.railway.app)"
fi

# Display current status
echo "📊 Current Vercel status:"
vercel ls

echo ""
echo "🔧 Next steps:"
echo "1. Set environment variable (if not already set):"
echo "   vercel env add REACT_APP_API_BASE_URL"
echo ""
echo "2. Deploy to production:"
echo "   vercel --prod"
echo ""
echo "3. Check deployment status:"
echo "   vercel logs"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md"
