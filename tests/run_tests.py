"""
Quick Test Runner
Fastest way to test the system - runs the integration test immediately
"""

import subprocess
import sys
from pathlib import Path

def main():
    tests_dir = Path(__file__).parent
    integration_test = tests_dir / "integration_test.py"
    
    print("\n🚀 Starting integration tests...\n")
    
    result = subprocess.run(
        [sys.executable, str(integration_test)],
        cwd=str(tests_dir.parent)
    )
    
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
