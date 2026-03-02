#!/usr/bin/env bash
# Test runner script for the Digital Forensic Evidence System

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}Digital Forensic Evidence Preservation System - Tests${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

# Create test environment with uv
echo -e "${YELLOW}Step 1: Setting up virtual environment with uv...${NC}"
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}uv not found. Installing...${NC}"
    pip install uv
fi

# Create separate test environment
if [ ! -d "test_env" ]; then
    echo -e "${YELLOW}Creating test environment...${NC}"
    uv venv test_env
fi

# Activate venv
source test_env/bin/activate 2>/dev/null || . test_env/Scripts/activate 2>/dev/null

echo -e "${YELLOW}Step 2: Installing test dependencies...${NC}"
uv pip install -r test-requirements.txt

echo -e "${YELLOW}Step 3: Running tests...${NC}"
echo -e "${GREEN}Running Hugging Face Model Tests...${NC}"
pytest tests/test_huggingface_model.py -v

echo -e "\n${GREEN}Running AI Service Tests...${NC}"
pytest tests/test_ai_service.py -v

echo -e "\n${GREEN}Running API Endpoint Tests...${NC}"
pytest tests/test_api_endpoints.py -v

echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${GREEN}Test suite completed!${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

# Deactivate venv
deactivate
