#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script to run all tests for the MesAIc AI integration.
"""

import os
import sys
import subprocess

def run_test(test_file):
    """Run a test file and return the result."""
    print(f"Running {test_file}...")
    result = subprocess.run([sys.executable, test_file], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ {test_file} passed!")
        return True
    else:
        print(f"❌ {test_file} failed!")
        print("Output:")
        print(result.stdout)
        print("Error:")
        print(result.stderr)
        return False

def main():
    """Run all tests."""
    print("=== Running MesAIc AI Integration Tests ===\n")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # List of test files to run
    test_files = [
        os.path.join(script_dir, "test_signal_processing.py"),
    ]
    
    # Run each test
    results = []
    for test_file in test_files:
        results.append(run_test(test_file))
    
    # Print summary
    print("\n=== Test Summary ===")
    print(f"Total tests: {len(results)}")
    print(f"Passed: {results.count(True)}")
    print(f"Failed: {results.count(False)}")
    
    # Return exit code
    return 0 if all(results) else 1

if __name__ == "__main__":
    sys.exit(main()) 