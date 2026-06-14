#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# EcoBridge — Full Serverless Deployment Script
# Deploys: Backend (SAM) + Frontend (S3 + CloudFront)
# Region: ap-south-1 (Mumbai)
# All within AWS Free Tier
# ═══════════════════════════════════════════════════════════════════════════════

set -e

REGION="ap-south-1"
STACK_NAME="ecobridge-stack"
FRONTEND_BUCKET="ecobridge-frontend-$(aws sts get-caller-identity --query Account --output text)"

echo "═══════════════════════════════════════════════════════"
echo "  EcoBridge Serverless Deployment"
echo "  Region: $REGION"
echo "═══════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Deploy Backend via SAM
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Step 1: Building & deploying backend (SAM)..."
cd backend/infrastructure

sam build

sam deploy \
  --stack-name $STACK_NAME \
  --region $REGION \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --resolve-s3

# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text)

echo "✓ Backend deployed: $API_ENDPOINT"
cd ../..

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Build Frontend with the deployed API URL
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Step 2: Building frontend with API URL..."

# Write .env.production with the deployed API URL
echo "VITE_ECOBRIDGE_API_URL=$API_ENDPOINT" > .env.production

# Build the React app
npm run build

echo "✓ Frontend built (dist/ folder ready)"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Create S3 bucket for frontend hosting
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Step 3: Setting up S3 bucket for frontend..."

# Create bucket (ignore error if already exists)
aws s3 mb "s3://$FRONTEND_BUCKET" --region $REGION 2>/dev/null || true

# Enable static website hosting
aws s3 website "s3://$FRONTEND_BUCKET" \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket "$FRONTEND_BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$FRONTEND_BUCKET/*\"
  }]
}"

# Disable block public access
aws s3api put-public-access-block --bucket "$FRONTEND_BUCKET" --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "✓ S3 bucket configured: $FRONTEND_BUCKET"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Upload frontend to S3
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Step 4: Uploading frontend to S3..."

aws s3 sync dist/ "s3://$FRONTEND_BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.html"

# Upload HTML files with no-cache
aws s3 sync dist/ "s3://$FRONTEND_BUCKET" \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --include "*.html" \
  --exclude "*" 

echo "✓ Frontend uploaded"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: Output final URLs
# ─────────────────────────────────────────────────────────────────────────────
WEBSITE_URL="http://$FRONTEND_BUCKET.s3-website.$REGION.amazonaws.com"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  🌐 Frontend:  $WEBSITE_URL"
echo "  🔌 Backend:   $API_ENDPOINT"
echo "  📦 S3 Bucket: $FRONTEND_BUCKET"
echo "  📊 Stack:     $STACK_NAME"
echo ""
echo "  Free Tier Usage:"
echo "  • S3: Static hosting (5GB free)"  
echo "  • Lambda: Serverless compute (1M requests/month free)"
echo "  • DynamoDB: On-demand (25GB free)"
echo "  • API Gateway: REST API (1M calls/month free)"
echo "  • Rekognition: Image analysis (5,000/month free)"
echo ""
echo "═══════════════════════════════════════════════════════"
