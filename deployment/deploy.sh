#!/bin/bash

# OgaJobs Production Deployment Script for AfeesHost
# ==================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ogajobs"
BUILD_DIR="dist"
BACKUP_DIR="backups"
DEPLOYMENT_LOG="deployment.log"

echo -e "${BLUE}🚀 Starting OgaJobs Production Deployment${NC}"
echo "=================================================="

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $DEPLOYMENT_LOG
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    exit 1
fi

log "Pre-deployment checks completed"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --only=production
check_success "Dependencies installation"

# Run linting
echo -e "${YELLOW}🔍 Running code linting...${NC}"
npm run lint
check_success "Code linting"

# Run security scan
echo -e "${YELLOW}🔒 Running security scan...${NC}"
if [ -f "scripts/security-scan.js" ]; then
    node scripts/security-scan.js
    check_success "Security scan"
fi

# Create backup of current deployment (if exists)
if [ -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}💾 Creating backup...${NC}"
    mkdir -p $BACKUP_DIR
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    cp -r $BUILD_DIR "$BACKUP_DIR/$BACKUP_NAME"
    log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf $BUILD_DIR
check_success "Clean previous build"

# Build for production
echo -e "${YELLOW}🏗️ Building for production...${NC}"
export NODE_ENV=production
npm run build
check_success "Production build"

# Validate build output
echo -e "${YELLOW}🔍 Validating build output...${NC}"

# Check if index.html exists
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ index.html not found in build output${NC}"
    exit 1
fi

# Check build size
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
echo -e "${BLUE}📊 Build size: $BUILD_SIZE${NC}"

# Run bundle analysis
if [ -f "scripts/bundle-analyzer.js" ]; then
    echo -e "${YELLOW}📈 Running bundle analysis...${NC}"
    node scripts/bundle-analyzer.js
fi

# Performance audit
if [ -f "scripts/performance-audit.js" ]; then
    echo -e "${YELLOW}⚡ Running performance audit...${NC}"
    node scripts/performance-audit.js
fi

# Copy additional files
echo -e "${YELLOW}📁 Copying additional files...${NC}"

# Copy .htaccess for Apache (AfeesHost typically uses Apache)
if [ -f "public/.htaccess" ]; then
    cp public/.htaccess $BUILD_DIR/
    log ".htaccess copied to build directory"
fi

# Copy robots.txt
if [ -f "public/robots.txt" ]; then
    cp public/robots.txt $BUILD_DIR/
    log "robots.txt copied to build directory"
fi

# Copy manifest.json (already should be there from build)
if [ -f "$BUILD_DIR/manifest.json" ]; then
    log "PWA manifest.json confirmed in build"
fi

# Generate deployment info
echo -e "${YELLOW}📝 Generating deployment info...${NC}"
cat > $BUILD_DIR/deployment-info.json << EOF
{
  "projectName": "$PROJECT_NAME",
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildSize": "$BUILD_SIZE",
  "environment": "production",
  "host": "afeeshost",
  "version": "${npm_package_version:-1.0.0}",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

# Final validation
echo -e "${YELLOW}🔎 Final validation...${NC}"

# Check for critical files
CRITICAL_FILES=("index.html" "manifest.json" ".htaccess")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$BUILD_DIR/$file" ]; then
        echo -e "${GREEN}✅ $file found${NC}"
    else
        echo -e "${YELLOW}⚠️ $file not found (may be optional)${NC}"
    fi
done

# Display deployment summary
echo ""
echo -e "${BLUE}📋 DEPLOYMENT SUMMARY${NC}"
echo "======================================"
echo -e "Project: ${GREEN}$PROJECT_NAME${NC}"
echo -e "Environment: ${GREEN}Production${NC}"
echo -e "Build Directory: ${GREEN}$BUILD_DIR${NC}"
echo -e "Build Size: ${GREEN}$BUILD_SIZE${NC}"
echo -e "Deployment Time: ${GREEN}$(date)${NC}"
echo ""

# Instructions for AfeesHost upload
echo -e "${BLUE}📤 AFEESHOST UPLOAD INSTRUCTIONS${NC}"
echo "======================================"
echo -e "1. ${YELLOW}Compress the '$BUILD_DIR' directory${NC}"
echo -e "2. ${YELLOW}Upload to AfeesHost File Manager${NC}"
echo -e "3. ${YELLOW}Extract in public_html directory${NC}"
echo -e "4. ${YELLOW}Update DNS if needed${NC}"
echo -e "5. ${YELLOW}Configure SSL certificate${NC}"
echo -e "6. ${YELLOW}Test the deployment${NC}"
echo ""

echo -e "${GREEN}✅ Deployment preparation completed successfully!${NC}"
echo -e "${BLUE}📁 Upload the contents of '$BUILD_DIR' to AfeesHost${NC}"

log "Deployment preparation completed successfully"