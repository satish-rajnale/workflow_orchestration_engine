#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def test_ably_realtime():
    """Test Ably real-time integration"""
    print("🧪 Testing Ably real-time integration...")
    
    try:
        from app.services.ably_service import AblyService, ably_service
        
        # Initialize Ably client
        await AblyService.init_ably_client()
        print("✅ Ably client initialized")
        
        # Test basic publishing
        success = await AblyService.test_publish()
        if not success:
            print("❌ Basic publishing test failed")
            return False
        
        # Test job status update publishing
        test_job_data = {
            'job_id': 'test-job-123',
            'status': 'running',
            'job_type': 'workflow_execution',
            'created_at': '2025-01-20T12:00:00Z',
            'updated_at': '2025-01-20T12:00:00Z',
            'user_id': '1'
        }
        
        await ably_service.publish_job_status_update(
            job_id='test-job-123',
            job_data=test_job_data,
            user_id='1'
        )
        print("✅ Job status update published")
        
        # Test job list update publishing
        test_jobs = [
            {
                'job_id': 'test-job-123',
                'status': 'completed',
                'job_type': 'workflow_execution',
                'created_at': '2025-01-20T12:00:00Z'
            },
            {
                'job_id': 'test-job-456',
                'status': 'pending',
                'job_type': 'email_send',
                'created_at': '2025-01-20T12:01:00Z'
            }
        ]
        
        await ably_service.publish_job_list_update('1', test_jobs)
        print("✅ Job list update published")
        
        print("🎉 All Ably real-time tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during Ably test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_ably_realtime())
