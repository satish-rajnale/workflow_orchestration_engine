#!/usr/bin/env python3
"""
Test script to verify the new separated API routes
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.main import app
from fastapi.testclient import TestClient

def test_api_routes():
    """Test that all API routes are properly registered"""
    
    print("🧪 Testing API Routes")
    print("=" * 50)
    
    client = TestClient(app)
    
    # Test that the app has the expected routes
    routes = [route.path for route in app.routes]
    
    print("Registered routes:")
    for route in sorted(routes):
        print(f"  {route}")
    
    # Check for specific route patterns
    expected_patterns = [
        "/auth/",
        "/workflows/",
        "/jobs/",
        "/tickets/",
        "/users",
        "/emails/",
        "/ws"
    ]
    
    print("\nChecking for expected route patterns:")
    for pattern in expected_patterns:
        matching_routes = [r for r in routes if pattern in r]
        if matching_routes:
            print(f"✅ {pattern} - Found {len(matching_routes)} routes")
        else:
            print(f"❌ {pattern} - Not found")
    
    # Test health endpoint
    print("\nTesting health endpoint:")
    try:
        response = client.get("/health")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint failed")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    print("\n✅ API routes test completed")

if __name__ == "__main__":
    test_api_routes()
