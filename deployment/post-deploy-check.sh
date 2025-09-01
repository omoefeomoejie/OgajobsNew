#!/bin/bash

# Post-Deployment Health Check Script
# ===================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="https://ogajobs.ng"
TIMEOUT=30

echo -e "${BLUE}🔍 Post-Deployment Health Check${NC}"
echo "=================================="

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    if curl -sL -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$url" | grep -q "200"; then
        echo -e "${GREEN}✅ $description - OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FAILED${NC}"
        return 1
    fi
}

# Function to check resource
check_resource() {
    local url=$1
    local description=$2
    local expected_type=$3
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    local content_type=$(curl -sI --max-time $TIMEOUT "$url" | grep -i "content-type" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [[ $content_type == *"$expected_type"* ]]; then
        echo -e "${GREEN}✅ $description - OK ($content_type)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FAILED (Got: $content_type)${NC}"
        return 1
    fi
}

# Main health checks
echo -e "${YELLOW}🌐 Checking main pages...${NC}"

CHECKS_PASSED=0
TOTAL_CHECKS=0

# Basic page checks
PAGES=(
    "$SITE_URL|Home Page"
    "$SITE_URL/services|Services Page"
    "$SITE_URL/how-it-works|How It Works"
    "$SITE_URL/become-artisan|Become Artisan"
    "$SITE_URL/auth|Authentication"
)

for page in "${PAGES[@]}"; do
    IFS='|' read -ra PAGE_INFO <<< "$page"
    if check_url "${PAGE_INFO[0]}" "${PAGE_INFO[1]}"; then
        ((CHECKS_PASSED++))
    fi
    ((TOTAL_CHECKS++))
done

echo ""
echo -e "${YELLOW}📱 Checking PWA resources...${NC}"

# PWA and static resource checks
RESOURCES=(
    "$SITE_URL/manifest.json|PWA Manifest|application/json"
    "$SITE_URL/sw.js|Service Worker|javascript"
    "$SITE_URL/favicon.png|Favicon|image"
)

for resource in "${RESOURCES[@]}"; do
    IFS='|' read -ra RESOURCE_INFO <<< "$resource"
    if check_resource "${RESOURCE_INFO[0]}" "${RESOURCE_INFO[1]}" "${RESOURCE_INFO[2]}"; then
        ((CHECKS_PASSED++))
    fi
    ((TOTAL_CHECKS++))
done

echo ""
echo -e "${YELLOW}🔒 Checking security headers...${NC}"

# Security headers check
check_security_header() {
    local header=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    if curl -sI --max-time $TIMEOUT "$SITE_URL" | grep -qi "$header"; then
        echo -e "${GREEN}✅ $description - Present${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - Missing${NC}"
        return 1
    fi
}

SECURITY_HEADERS=(
    "X-Content-Type-Options|X-Content-Type-Options Header"
    "X-Frame-Options|X-Frame-Options Header"
    "Strict-Transport-Security|HSTS Header"
)

for header in "${SECURITY_HEADERS[@]}"; do
    IFS='|' read -ra HEADER_INFO <<< "$header"
    if check_security_header "${HEADER_INFO[0]}" "${HEADER_INFO[1]}"; then
        ((CHECKS_PASSED++))
    fi
    ((TOTAL_CHECKS++))
done

echo ""
echo -e "${YELLOW}⚡ Checking performance...${NC}"

# Performance check
check_performance() {
    echo -e "${YELLOW}Testing: Page load time${NC}"
    
    local load_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT "$SITE_URL")
    local load_time_ms=$(echo "$load_time * 1000" | bc -l | cut -d. -f1)
    
    if [ "$load_time_ms" -lt 3000 ]; then
        echo -e "${GREEN}✅ Page load time - ${load_time_ms}ms (Good)${NC}"
        return 0
    elif [ "$load_time_ms" -lt 5000 ]; then
        echo -e "${YELLOW}⚠️ Page load time - ${load_time_ms}ms (Acceptable)${NC}"
        return 1
    else
        echo -e "${RED}❌ Page load time - ${load_time_ms}ms (Slow)${NC}"
        return 1
    fi
}

if check_performance; then
    ((CHECKS_PASSED++))
fi
((TOTAL_CHECKS++))

echo ""
echo -e "${YELLOW}🔄 Checking client-side routing...${NC}"

# Client-side routing check
ROUTES=(
    "$SITE_URL/dashboard|Dashboard Route"
    "$SITE_URL/profile|Profile Route"
    "$SITE_URL/settings|Settings Route"
)

for route in "${ROUTES[@]}"; do
    IFS='|' read -ra ROUTE_INFO <<< "$route"
    if check_url "${ROUTE_INFO[0]}" "${ROUTE_INFO[1]}"; then
        ((CHECKS_PASSED++))
    fi
    ((TOTAL_CHECKS++))
done

# Summary
echo ""
echo -e "${BLUE}📊 HEALTH CHECK SUMMARY${NC}"
echo "=========================="
echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - CHECKS_PASSED))${NC}"

PASS_RATE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))
echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}"

echo ""
if [ "$PASS_RATE" -ge 80 ]; then
    echo -e "${GREEN}🎉 Deployment health check PASSED!${NC}"
    echo -e "${GREEN}✅ Site is ready for production use${NC}"
    exit 0
elif [ "$PASS_RATE" -ge 60 ]; then
    echo -e "${YELLOW}⚠️ Deployment health check PARTIAL${NC}"
    echo -e "${YELLOW}⚠️ Some issues detected, but site is functional${NC}"
    exit 1
else
    echo -e "${RED}❌ Deployment health check FAILED${NC}"
    echo -e "${RED}❌ Critical issues detected, review required${NC}"
    exit 2
fi