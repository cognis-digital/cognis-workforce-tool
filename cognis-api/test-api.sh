#!/bin/bash

# Cognis API Test Script
# Tests the Cognis API endpoints using cURL

# Set colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default API URL
API_URL="http://localhost:3000/api/v1"
API_KEY="sk-cognis-workforce-tool-dev-key-12345"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      API_URL="$2"
      shift 2
      ;;
    --key)
      API_KEY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}===== Cognis API Test Script =====${NC}"
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo -e "${BLUE}Using API Key: ${API_KEY:0:7}...${API_KEY:(-4)}${NC}\n"

# Function to run a test
run_test() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  
  echo -e "${YELLOW}Running test: ${name}${NC}"
  
  # Execute the request
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" \
      -X GET \
      -H "Authorization: Bearer $API_KEY" \
      "${API_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" \
      -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "${data}" \
      "${API_URL}${endpoint}")
  fi
  
  # Extract status code and response body
  status_code=$(echo "$response" | tail -n1)
  response_body=$(echo "$response" | sed '$d')
  
  # Check if status code matches expected
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ Status code matches expected: ${status_code}${NC}"
  else
    echo -e "${RED}✗ Status code ${status_code} does not match expected: ${expected_status}${NC}"
  fi
  
  # Print response body (truncated if too long)
  max_length=500
  if [ ${#response_body} -gt $max_length ]; then
    echo -e "${GRAY}Response body (truncated): ${response_body:0:$max_length}...${NC}"
  else
    echo -e "${GRAY}Response body: ${response_body}${NC}"
  fi
  
  echo ""
}

# Test 1: Health check
run_test "Health Check" "GET" "/health" "" "200"

# Test 2: Chat Completions with GET (should fail with 405)
run_test "Chat Completions GET (Should Fail)" "GET" "/chat/completions" "" "405"

# Test 3: Chat Completions with POST
run_test "Chat Completions POST" "POST" "/chat/completions" '{
  "model": "Cognis-Zenith-4.0",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello world"}
  ]
}' "200"

# Test 4: Embeddings with GET (should fail with 405)
run_test "Embeddings GET (Should Fail)" "GET" "/embeddings" "" "405"

# Test 5: Embeddings with POST
run_test "Embeddings POST" "POST" "/embeddings" '{
  "model": "Cognis-Nova-3.0",
  "input": "The quick brown fox jumps over the lazy dog"
}' "200"

# Test 6: Image Generation
run_test "Image Generation" "POST" "/images/generations" '{
  "prompt": "A cute baby sea otter",
  "n": 1,
  "size": "512x512"
}' "200"

# Test 7: Invalid endpoint
run_test "Invalid Endpoint" "GET" "/invalid-endpoint" "" "404"

# Test 8: Missing Required Field
run_test "Missing Required Field" "POST" "/chat/completions" '{
  "model": "Cognis-Zenith-4.0"
}' "400"

# Test 9: Chat Completions without Authorization
echo -e "${YELLOW}Running test: Chat without Authorization${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"Cognis-Zenith-4.0","messages":[{"role":"user","content":"Hello"}]}' \
  "${API_URL}/chat/completions")

status_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

if [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✓ Status code matches expected: ${status_code}${NC}"
else
  echo -e "${RED}✗ Status code ${status_code} does not match expected: 401${NC}"
fi

echo -e "${GRAY}Response body: ${response_body}${NC}\n"

echo -e "${GREEN}All tests completed!${NC}"
