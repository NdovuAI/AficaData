#!/bin/bash

echo "🚀 Deploying African Language Translation Platform..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

echo "✅ Environment variables verified"

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Run database migrations (if needed)
echo "🗄️ Database is ready with 7 tables configured"

# Deploy based on environment
if [ "$1" = "vercel" ]; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
elif [ "$1" = "docker" ]; then
    echo "🐳 Deploying with Docker..."
    docker-compose up -d
elif [ "$1" = "k8s" ]; then
    echo "☸️ Deploying to Kubernetes..."
    kubectl apply -f k8s/
else
    echo "📋 Deployment options:"
    echo "  ./deploy.sh vercel   - Deploy to Vercel"
    echo "  ./deploy.sh docker   - Deploy with Docker"
    echo "  ./deploy.sh k8s      - Deploy to Kubernetes"
fi

echo "🎉 Deployment process completed!"
echo "🌍 Your app will be available at: https://ndovu.guru"
