#!/bin/bash
###############################################################################
# EcoBridge Backend - Deployment Script
###############################################################################
#
# DESCRIPTION:
#   This script builds and deploys the EcoBridge serverless backend using
#   AWS SAM (Serverless Application Model). It packages the Lambda functions
#   with their shared modules, validates the SAM template, builds the
#   application, and provides deployment commands.
#
# PREREQUISITES:
#   - AWS CLI installed and configured (aws configure)
#   - AWS SAM CLI installed (https://docs.aws.amazon.com/sam/latest/developerguide/install-sam-cli.html)
#   - Valid AWS credentials with permissions for Lambda, API Gateway,
#     DynamoDB, IAM, CloudFormation, and S3
#   - Python 3.12 installed (for local build/testing)
#
# USAGE:
#   First-time deployment:
#     ./scripts/deploy.sh --guided
#
#   Subsequent deployments:
#     ./scripts/deploy.sh
#
# WHAT THIS SCRIPT DOES:
#   1. Sets the working directory relative to the backend/ folder
#   2. Validates the SAM template at infrastructure/template.yaml
#   3. Builds the SAM application (packages Lambda code with dependencies)
#   4. Deploys to AWS (guided mode for first deploy, standard for subsequent)
#
###############################################################################

set -e

# Set working directory to the backend/ folder (where this script lives is scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_PATH="$BACKEND_DIR/infrastructure/template.yaml"

cd "$BACKEND_DIR"

echo "============================================================"
echo "  EcoBridge Backend - Deployment"
echo "============================================================"
echo ""

# Step 1: Verify prerequisites
echo "[1/4] Verifying prerequisites..."
echo ""

if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed."
    echo "Install it from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo "ERROR: AWS SAM CLI is not installed."
    echo "Install it from: https://docs.aws.amazon.com/sam/latest/developerguide/install-sam-cli.html"
    exit 1
fi

echo "  ✓ AWS CLI found"
echo "  ✓ SAM CLI found"
echo ""

# Step 2: Validate SAM template
echo "[2/4] Validating SAM template..."
echo "  Template: $TEMPLATE_PATH"
echo ""

if [ ! -f "$TEMPLATE_PATH" ]; then
    echo "ERROR: SAM template not found at $TEMPLATE_PATH"
    echo "Make sure infrastructure/template.yaml exists."
    exit 1
fi

sam validate --template-file "$TEMPLATE_PATH"
echo ""
echo "  ✓ Template is valid"
echo ""

# Step 3: Build the SAM application
echo "[3/4] Building SAM application..."
echo "  This packages each Lambda function with its shared modules."
echo ""

sam build --template-file "$TEMPLATE_PATH"
echo ""
echo "  ✓ Build complete"
echo ""

# Step 4: Deploy
echo "[4/4] Deploying to AWS..."
echo ""

if [ "$1" == "--guided" ]; then
    echo "  Running guided deployment (first-time setup)..."
    echo "  You will be prompted for stack name, region, and other options."
    echo ""
    sam deploy --guided --template-file "$TEMPLATE_PATH"
else
    echo "  Running standard deployment using saved configuration..."
    echo "  (Use --guided flag for first-time deployment)"
    echo ""
    sam deploy --template-file "$TEMPLATE_PATH"
fi

echo ""
echo "============================================================"
echo "  Deployment complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Note the API Gateway endpoint URL from the outputs above"
echo "  2. Run the seed script to populate mock data:"
echo "     python scripts/seed_data.py"
echo "  3. Update the frontend API_URL to point to your endpoint"
echo ""
