# ═══════════════════════════════════════════════════════════════════════════════
# EcoBridge — Full Serverless Deployment (Windows PowerShell)
# Deploys: Backend (SAM) + Frontend (S3 Static Website)
# Region: ap-south-1 (Mumbai)
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$REGION = "ap-south-1"
$STACK_NAME = "ecobridge-stack"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$FRONTEND_BUCKET = "ecobridge-frontend-$ACCOUNT_ID"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EcoBridge Serverless Deployment" -ForegroundColor Cyan
Write-Host "  Region: $REGION | Account: $ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Deploy Backend via SAM
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 1: Building & deploying backend (SAM)..." -ForegroundColor Yellow

Set-Location backend/infrastructure

sam build
if ($LASTEXITCODE -ne 0) { Write-Host "SAM build failed!" -ForegroundColor Red; exit 1 }

sam deploy `
  --stack-name $STACK_NAME `
  --region $REGION `
  --capabilities CAPABILITY_IAM `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --resolve-s3

if ($LASTEXITCODE -ne 0) { Write-Host "SAM deploy failed!" -ForegroundColor Red; exit 1 }

# Get the API endpoint
$API_ENDPOINT = (aws cloudformation describe-stacks `
  --stack-name $STACK_NAME `
  --region $REGION `
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" `
  --output text)

Write-Host "✓ Backend deployed: $API_ENDPOINT" -ForegroundColor Green

Set-Location ../..

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Build Frontend
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 2: Building frontend with API URL..." -ForegroundColor Yellow

# Write production env file
"VITE_ECOBRIDGE_API_URL=$API_ENDPOINT" | Out-File -FilePath .env.production -Encoding utf8

# Build
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed!" -ForegroundColor Red; exit 1 }

Write-Host "✓ Frontend built" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Create S3 bucket
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 3: Setting up S3 static website..." -ForegroundColor Yellow

# Create bucket (ignore if exists)
aws s3 mb "s3://$FRONTEND_BUCKET" --region $REGION 2>$null

# Disable block public access
aws s3api put-public-access-block --bucket $FRONTEND_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy
$POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$FRONTEND_BUCKET/*"
  }]
}
"@
$POLICY | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET --policy file://bucket-policy.json
Remove-Item bucket-policy.json

# Enable website hosting
aws s3 website "s3://$FRONTEND_BUCKET" --index-document index.html --error-document index.html

Write-Host "✓ S3 bucket ready: $FRONTEND_BUCKET" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Upload frontend
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 4: Uploading frontend to S3..." -ForegroundColor Yellow

aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete --region $REGION

Write-Host "✓ Frontend uploaded" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────────────────────────
$WEBSITE_URL = "http://$FRONTEND_BUCKET.s3-website.$REGION.amazonaws.com"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  $WEBSITE_URL" -ForegroundColor White
Write-Host "  Backend:   $API_ENDPOINT" -ForegroundColor White
Write-Host "  S3 Bucket: $FRONTEND_BUCKET" -ForegroundColor White
Write-Host ""
Write-Host "  All within AWS Free Tier!" -ForegroundColor Cyan
Write-Host ""
