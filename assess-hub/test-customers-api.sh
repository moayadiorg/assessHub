#!/bin/bash

# Customer API Test Script
# Run after: npm run db:reset
# Start dev server: npm run dev

BASE_URL="http://localhost:3000"

echo "================================"
echo "Customer API Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: List all customers (should be empty initially)
echo -e "${YELLOW}Test 1: GET /api/customers${NC}"
curl -s -X GET "$BASE_URL/api/customers" | jq '.'
echo ""

# Test 2: Create a new customer
echo -e "${YELLOW}Test 2: POST /api/customers (create customer)${NC}"
CUSTOMER1=$(curl -s -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corporation"}')
echo "$CUSTOMER1" | jq '.'
CUSTOMER1_ID=$(echo "$CUSTOMER1" | jq -r '.id')
echo -e "${GREEN}Created customer ID: $CUSTOMER1_ID${NC}"
echo ""

# Test 3: Create another customer
echo -e "${YELLOW}Test 3: POST /api/customers (create another)${NC}"
CUSTOMER2=$(curl -s -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{"name": "TechStart Inc"}')
echo "$CUSTOMER2" | jq '.'
CUSTOMER2_ID=$(echo "$CUSTOMER2" | jq -r '.id')
echo ""

# Test 4: Try to create duplicate (should fail with 409)
echo -e "${YELLOW}Test 4: POST /api/customers (duplicate - should fail)${NC}"
curl -s -X POST "$BASE_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corporation"}' | jq '.'
echo ""

# Test 5: List all customers again
echo -e "${YELLOW}Test 5: GET /api/customers (list all)${NC}"
curl -s -X GET "$BASE_URL/api/customers" | jq '.'
echo ""

# Test 6: Get specific customer
echo -e "${YELLOW}Test 6: GET /api/customers/[id]${NC}"
curl -s -X GET "$BASE_URL/api/customers/$CUSTOMER1_ID" | jq '.'
echo ""

# Test 7: Update customer name
echo -e "${YELLOW}Test 7: PATCH /api/customers/[id]${NC}"
curl -s -X PATCH "$BASE_URL/api/customers/$CUSTOMER1_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp (Updated)"}' | jq '.'
echo ""

# Test 8: Search customers
echo -e "${YELLOW}Test 8: GET /api/customers?search=Acme${NC}"
curl -s -X GET "$BASE_URL/api/customers?search=Acme" | jq '.'
echo ""

# Test 9: Get assessment types (needed for next test)
echo -e "${YELLOW}Test 9: GET /api/assessment-types${NC}"
TYPES=$(curl -s -X GET "$BASE_URL/api/assessment-types")
echo "$TYPES" | jq '.'
TYPE_ID=$(echo "$TYPES" | jq -r '.[0].id')
echo -e "${GREEN}Using assessment type ID: $TYPE_ID${NC}"
echo ""

# Test 10: Create assessment with customerId
if [ ! -z "$TYPE_ID" ] && [ "$TYPE_ID" != "null" ]; then
  echo -e "${YELLOW}Test 10: POST /api/assessments (with customerId)${NC}"
  curl -s -X POST "$BASE_URL/api/assessments" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Q1 2024 Assessment\",
      \"customerId\": \"$CUSTOMER1_ID\",
      \"assessmentTypeId\": \"$TYPE_ID\",
      \"createdBy\": \"test@example.com\"
    }" | jq '.'
  echo ""
else
  echo -e "${RED}Skipping Test 10: No assessment types available${NC}"
  echo ""
fi

# Test 11: Create assessment with customerName (auto-create)
if [ ! -z "$TYPE_ID" ] && [ "$TYPE_ID" != "null" ]; then
  echo -e "${YELLOW}Test 11: POST /api/assessments (with customerName - auto-create)${NC}"
  curl -s -X POST "$BASE_URL/api/assessments" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Q2 2024 Assessment\",
      \"customerName\": \"GlobalTech Solutions\",
      \"assessmentTypeId\": \"$TYPE_ID\",
      \"createdBy\": \"test@example.com\"
    }" | jq '.'
  echo ""
else
  echo -e "${RED}Skipping Test 11: No assessment types available${NC}"
  echo ""
fi

# Test 12: Get customer with assessments
echo -e "${YELLOW}Test 12: GET /api/customers/[id] (should show assessments)${NC}"
curl -s -X GET "$BASE_URL/api/customers/$CUSTOMER1_ID" | jq '.'
echo ""

# Test 13: List all customers (should show updated counts)
echo -e "${YELLOW}Test 13: GET /api/customers (final list with counts)${NC}"
curl -s -X GET "$BASE_URL/api/customers" | jq '.'
echo ""

# Test 14: Try to delete customer with assessments (should fail)
echo -e "${YELLOW}Test 14: DELETE /api/customers/[id] (with assessments - should fail)${NC}"
curl -s -X DELETE "$BASE_URL/api/customers/$CUSTOMER1_ID" | jq '.'
echo ""

# Test 15: Delete customer without assessments (should succeed)
echo -e "${YELLOW}Test 15: DELETE /api/customers/[id] (without assessments - should succeed)${NC}"
curl -s -X DELETE "$BASE_URL/api/customers/$CUSTOMER2_ID" | jq '.'
echo ""

echo "================================"
echo "Test Suite Complete"
echo "================================"
