#!/usr/bin/env python3
"""
Test script to verify Ably integration
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.ably_service import AblyService

async def test_ably_integration():
    """Test Ably integration"""
    
    print("🧪 Testing Ably Integration")
    print("=" * 50)
    
    try:
        # Initialize Ably client
        print("🔧 Initializing Ably client...")
        await AblyService.init_ably_client()
        
        if AblyService.__client__:
            print("✅ Ably client initialized successfully!")
            
            # Test publishing a message
            print("📡 Testing message publishing...")
            await AblyService.publish(
                channel_name="test-channel",
                event_name="test-event",
                data={"message": "Hello from Ably!", "timestamp": "2025-08-20"}
            )
            
            print("✅ Message published successfully!")
            
        else:
            print("⚠️ Ably client not initialized - running in simulation mode")
            
            # Test simulated publishing
            await AblyService.publish(
                channel_name="test-channel",
                event_name="test-event",
                data={"message": "Hello from simulated Ably!", "timestamp": "2025-08-20"}
            )
            
            print("✅ Simulated message published successfully!")
        
        # Test job status update
        print("\n📊 Testing job status update...")
        job_data = {
            'status': 'completed',
            'job_type': 'test',
            'updated_at': '2025-08-20T07:00:00Z',
            'result': 'Test completed successfully'
        }
        
        ably_service = AblyService()
        await ably_service.publish_job_status_update(
            job_id='test-job-123',
            job_data=job_data,
            user_id='test-user-456'
        )
        
        # Test job list update
        print("📋 Testing job list update...")
        jobs = [
            {'job_id': 'job-1', 'status': 'completed'},
            {'job_id': 'job-2', 'status': 'running'}
        ]
        
        await ably_service.publish_job_list_update(
            user_id='test-user-456',
            jobs=jobs
        )
        
        print("✅ All Ably integration tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during Ably integration tests: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ably_integration())
