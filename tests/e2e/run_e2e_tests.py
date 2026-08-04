#!/usr/bin/env python3
"""
RoadWatch E2E Testing Suite Runner
Orchestrates and executes all E2E Test Tiers (1–4):
  - Tier 1: Feature Coverage
  - Tier 2: Boundary & Corner Cases
  - Tier 3: Cross-Feature Integration Pairwise Matrix
  - Tier 4: Real-World Institutional Scenarios
"""

import sys
import os
import time
import pytest

def main():
    print("=" * 80)
    print("                 ROADWATCH E2E TEST SUITE RUNNER (TIERS 1-4)")
    print("=" * 80)
    
    test_dir = os.path.dirname(os.path.abspath(__file__))
    results_xml = os.path.join(test_dir, "results.xml")
    
    args = [
        test_dir,
        "-v",
        "--tb=short",
        f"--junitxml={results_xml}"
    ]
    
    start_time = time.time()
    exit_code = pytest.main(args)
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 80)
    print(f"E2E Test Execution Completed in {elapsed:.2f} seconds.")
    print(f"Pytest Exit Code: {exit_code}")
    print(f"JUnit XML Report Saved to: {results_xml}")
    print("=" * 80)
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
