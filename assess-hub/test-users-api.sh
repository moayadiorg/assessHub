#!/bin/bash

# Test Users API Endpoints
# Run the dev server first: npm run dev

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "==================================="
echo "Users API Test Suite"
echo "==================================="
echo ""
echo "Note: This test assumes you're signed in as admin in your browser"
echo "and have a valid session cookie."
echo ""

# Test 1: List all users (GET /api/users)
echo "Test 1: GET /api/users - List all users"
curl -s "$API_URL/users" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 2: Create a new user (POST /api/users)
echo "Test 2: POST /api/users - Create new user"
NEW_USER=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.sa@example.com",
    "name": "Test Solution Architect",
    "role": "sa"
  }')
echo "$NEW_USER" | jq '.'
USER_ID=$(echo "$NEW_USER" | jq -r '.id')
echo ""
echo "-----------------------------------"
echo ""

# Test 3: Get user details (GET /api/users/[id])
echo "Test 3: GET /api/users/$USER_ID - Get user details"
curl -s "$API_URL/users/$USER_ID" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 4: Update user (PATCH /api/users/[id])
echo "Test 4: PATCH /api/users/$USER_ID - Update user role"
curl -s -X PATCH "$API_URL/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "reader",
    "name": "Updated Test User"
  }' | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 5: List users with filter (GET /api/users?role=reader)
echo "Test 5: GET /api/users?role=reader - Filter by role"
curl -s "$API_URL/users?role=reader" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 6: Search users (GET /api/users?search=test)
echo "Test 6: GET /api/users?search=test - Search users"
curl -s "$API_URL/users?search=test" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 7: Try to create duplicate user (should fail)
echo "Test 7: POST /api/users - Try duplicate email (should fail)"
curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.sa@example.com",
    "name": "Duplicate User",
    "role": "reader"
  }' | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 8: Try invalid email (should fail)
echo "Test 8: POST /api/users - Try invalid email (should fail)"
curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "Invalid Email User",
    "role": "reader"
  }' | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 9: Try invalid role (should fail)
echo "Test 9: POST /api/users - Try invalid role (should fail)"
curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "role": "superuser"
  }' | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 10: Deactivate user (PATCH /api/users/[id])
echo "Test 10: PATCH /api/users/$USER_ID - Deactivate user"
curl -s -X PATCH "$API_URL/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }' | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 11: Delete user (DELETE /api/users/[id])
echo "Test 11: DELETE /api/users/$USER_ID - Delete user"
curl -s -X DELETE "$API_URL/users/$USER_ID" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

# Test 12: Try to get deleted user (should fail)
echo "Test 12: GET /api/users/$USER_ID - Get deleted user (should fail)"
curl -s "$API_URL/users/$USER_ID" | jq '.'
echo ""
echo "-----------------------------------"
echo ""

echo "==================================="
echo "Tests Complete!"
echo "==================================="
