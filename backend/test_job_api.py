#!/usr/bin/env python3
"""
Test script for job API endpoints
"""
import asyncio
import requests
import json
from datetime import datetime, timedelta

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/workflows"

def test_job_endpoints():
    """Test the job-related API endpoints"""
    
    print("🧪 Testing Job API Endpoints")
    print("=" * 50)
    
    # Test 1: List all jobs
    print("\n1. Testing GET /workflows/jobs")
    try:
        response = requests.get(f"{API_BASE}/jobs")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            jobs = response.json()
            print(f"Found {len(jobs)} jobs")
            if jobs:
                print("Sample job structure:")
                print(json.dumps(jobs[0], indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 2: Get active jobs
    print("\n2. Testing GET /workflows/jobs/active")
    try:
        response = requests.get(f"{API_BASE}/jobs/active")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            active_jobs = response.json()
            print(f"Found {len(active_jobs)} active jobs")
            if active_jobs:
                print("Sample active job structure:")
                print(json.dumps(active_jobs[0], indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 3: Get specific job (if any exist)
    print("\n3. Testing GET /workflows/jobs/{job_id}")
    try:
        # First get all jobs to find a job_id
        response = requests.get(f"{API_BASE}/jobs")
        if response.status_code == 200:
            jobs = response.json()
            if jobs:
                job_id = jobs[0].get('job_id')
                if job_id:
                    response = requests.get(f"{API_BASE}/jobs/{job_id}")
                    print(f"Status for job {job_id}: {response.status_code}")
                    if response.status_code == 200:
                        job = response.json()
                        print("Job details:")
                        print(json.dumps(job, indent=2))
                    else:
                        print(f"Error: {response.text}")
                else:
                    print("No job_id found in job data")
            else:
                print("No jobs available to test with")
        else:
            print(f"Error getting jobs: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 4: Test with non-existent job
    print("\n4. Testing GET /workflows/jobs/non-existent-id")
    try:
        response = requests.get(f"{API_BASE}/jobs/non-existent-id")
        print(f"Status: {response.status_code}")
        if response.status_code == 404:
            print("✅ Correctly returned 404 for non-existent job")
        else:
            print(f"Unexpected response: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_job_endpoints()
