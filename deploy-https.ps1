# ═══════════════════════════════════════════════════════════════════════════════
# EcoBridge — HTTPS Serverless Deployment (CloudFront + S3)
# 
# CloudFront provides FREE HTTPS with AWS-managed SSL certificates.
# No custom domain needed — you get a https://d1234xyz.cloudfront.net URL.
#
# Backend API Gateway already has HTTPS by default.
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$REGION = "ap-south-1"
$STACK_NAME = "ecobridge-stack"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$FRONTEND_BUCKET = "ecobridge-frontend-$ACCOUNT_ID"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EcoBridge HTTPS Deployment (CloudFront + S3)" -ForegroundColor Cyan
Write-Host "  Region: $REGION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Deploy Backend via SAM (already HTTPS via API Gateway)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 1: Deploying backend..." -ForegroundColor Yellow

Push-Location backend/infrastructure
sam build
sam deploy `
  --stack-name $STACK_NAME `
  --region $REGION `
  --capabilities CAPABILITY_IAM `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --resolve-s3
Pop-Location

$API_ENDPOINT = (aws cloudformation describe-stacks `
  --stack-name $STACK_NAME `
  --region $REGION `
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" `
  --output text)

Write-Host "✓ Backend (HTTPS): $API_ENDPOINT" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Build Frontend
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 2: Building frontend..." -ForegroundColor Yellow

"VITE_ECOBRIDGE_API_URL=$API_ENDPOINT" | Out-File -FilePath .env.production -Encoding utf8NoBOM
npm run build

Write-Host "✓ Frontend built" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Create S3 Bucket (private — CloudFront will access it via OAC)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 3: Creating S3 bucket (private)..." -ForegroundColor Yellow

aws s3 mb "s3://$FRONTEND_BUCKET" --region $REGION 2>$null

Write-Host "✓ S3 bucket: $FRONTEND_BUCKET" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Create CloudFront Distribution (FREE HTTPS!)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 4: Creating CloudFront distribution (HTTPS)..." -ForegroundColor Yellow

# Create Origin Access Control
$OAC_NAME = "ecobridge-oac"
$OAC_EXISTS = (aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" --output text 2>$null)

if (-not $OAC_EXISTS) {
  $OAC_CONFIG = @"
{
  "Name": "$OAC_NAME",
  "Description": "OAC for EcoBridge frontend",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
"@
  $OAC_CONFIG | Out-File -FilePath oac-config.json -Encoding utf8NoBOM
  $OAC_ID = (aws cloudfront create-origin-access-control --origin-access-control-config file://oac-config.json --query "OriginAccessControl.Id" --output text)
  Remove-Item oac-config.json
} else {
  $OAC_ID = $OAC_EXISTS
}

Write-Host "  OAC ID: $OAC_ID"

# Check if distribution already exists
$EXISTING_DIST = (aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$FRONTEND_BUCKET.s3.$REGION.amazonaws.com'].Id" --output text 2>$null)

if (-not $EXISTING_DIST -or $EXISTING_DIST -eq "None") {
  # Create CloudFront distribution
  $CF_CONFIG = @"
{
  "CallerReference": "ecobridge-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "EcoBridge Frontend - HTTPS",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-$FRONTEND_BUCKET",
      "DomainName": "$FRONTEND_BUCKET.s3.$REGION.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "$OAC_ID"
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$FRONTEND_BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] },
    "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] },
    "ForwardedValues": { "QueryString": false, "Cookies": { "Forward": "none" } },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }]
  },
  "PriceClass": "PriceClass_200"
}
"@
  $CF_CONFIG | Out-File -FilePath cf-config.json -Encoding utf8NoBOM
  $DIST_ID = (aws cloudfront create-distribution --distribution-config file://cf-config.json --query "Distribution.Id" --output text)
  $CF_DOMAIN = (aws cloudfront get-distribution --id $DIST_ID --query "Distribution.DomainName" --output text)
  Remove-Item cf-config.json
} else {
  $DIST_ID = $EXISTING_DIST
  $CF_DOMAIN = (aws cloudfront get-distribution --id $DIST_ID --query "Distribution.DomainName" --output text)
}

Write-Host "  Distribution ID: $DIST_ID"
Write-Host "✓ CloudFront: https://$CF_DOMAIN" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: Set S3 bucket policy to allow CloudFront access
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 5: Setting bucket policy for CloudFront..." -ForegroundColor Yellow

$BUCKET_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$FRONTEND_BUCKET/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/$DIST_ID"
      }
    }
  }]
}
"@
$BUCKET_POLICY | Out-File -FilePath bucket-policy.json -Encoding utf8NoBOM
aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET --policy file://bucket-policy.json
Remove-Item bucket-policy.json

Write-Host "✓ Bucket policy set" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6: Upload frontend to S3
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 6: Uploading frontend..." -ForegroundColor Yellow

aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete --region $REGION

Write-Host "✓ Frontend uploaded" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7: Invalidate CloudFront cache
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Step 7: Invalidating CloudFront cache..." -ForegroundColor Yellow

aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" >$null 2>&1

Write-Host "✓ Cache invalidated" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ HTTPS DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🔒 Frontend (HTTPS): https://$CF_DOMAIN" -ForegroundColor White
Write-Host "  🔒 Backend  (HTTPS): $API_ENDPOINT" -ForegroundColor White
Write-Host ""
Write-Host "  ⚡ CloudFront takes 5-10 minutes to fully deploy." -ForegroundColor Yellow
Write-Host "  📷 Webcam will work on https:// (secure context)." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Free Tier: CloudFront gives 1TB transfer/month free!" -ForegroundColor Cyan
Write-Host ""
