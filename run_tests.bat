@echo off
REM Test runner script for Windows
REM Digital Forensic Evidence Preservation System - Tests

cls
echo.
echo =====================================================
echo Digital Forensic Evidence Preservation System - Tests
echo =====================================================
echo.

REM Create test environment with uv
echo Creating/activating test environment with uv...
if not exist "test_env" (
    echo Initializing test_env...
    uv venv test_env
)

call test_env\Scripts\activate.bat

echo Installing test dependencies...
uv pip install -r test-requirements.txt

echo.
echo Running Hugging Face Model Tests...
pytest tests\test_huggingface_model.py -v

echo.
echo Running AI Service Tests...
pytest tests\test_ai_service.py -v

echo.
echo Running API Endpoint Tests...
pytest tests\test_api_endpoints.py -v

echo.
echo =====================================================
echo Test suite completed!
echo =====================================================
echo.

call test_env\Scripts\deactivate.bat
pause
