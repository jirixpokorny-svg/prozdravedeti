#!/bin/bash
# Deploy script – spustit na Raspberry Pi
set -e

cd /home/pi/prozdravedeti

echo "📦 Pulling latest code..."
git pull

echo "🔨 Building Docker image..."
docker compose build --no-cache

echo "🚀 Starting container..."
docker compose up -d

echo "✅ Deployed! Running at http://localhost:4321"
docker compose logs --tail=20
