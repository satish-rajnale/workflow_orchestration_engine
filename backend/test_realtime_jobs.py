#!/usr/bin/env python3
"""
Test script to verify real-time job status updates
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.scheduler import job_scheduler
from app.services.ably_service import ably_service

async def test_realtime_jobs():
    """Test real-time job status updates"""
    
    print("🧪 Testing Real-time Job Status Updates")
    print("=" * 50)
    
    # Start the job scheduler
    await job_scheduler.start()
    
    try:
        # Test user ID
        test_user_id = "test-user-123"
        
        print(f"📅 Scheduling test jobs for user {test_user_id}")
        
        # Schedule a simple delay job
        job_id_1 = await job_scheduler.schedule_job(
            job_type='test_delay',
            scheduled_at=datetime.utcnow() + timedelta(seconds=2),
            function=lambda: print("Test delay job completed"),
            user_id=test_user_id
        )
        
        print(f"✅ Scheduled delay job: {job_id_1}")
        
        # Schedule an email job
        job_id_2 = await job_scheduler.schedule_email_send(
            email_data={
                'to': 'test@example.com',
                'subject': 'Test Email',
                'body': 'This is a test email'
            },
            user_id=test_user_id
        )
        
        print(f"✅ Scheduled email job: {job_id_2}")
        
        # Wait for jobs to process
        print("⏳ Waiting for jobs to process...")
        await asyncio.sleep(5)
        
        # Check job statuses
        print("\n📊 Job Statuses:")
        user_jobs = await job_scheduler.get_user_jobs(test_user_id)
        for job in user_jobs:
            print(f"  Job {job['job_id']}: {job['status']}")
        
        # Test publishing a manual update
        print("\n📡 Testing manual job status update...")
        test_job_data = {
            'status': 'completed',
            'job_type': 'test',
            'updated_at': datetime.utcnow().isoformat(),
            'result': 'Manual test completed'
        }
        
        await ably_service.publish_job_status_update(
            job_id='test-manual-job',
            job_data=test_job_data,
            user_id=test_user_id
        )
        
        print("✅ Manual job status update published")
        
        # Test job list update
        print("\n📡 Testing job list update...")
        await ably_service.publish_job_list_update(test_user_id, user_jobs)
        print("✅ Job list update published")
        
        print("\n✅ Real-time job tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during real-time job tests: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Stop the job scheduler
        await job_scheduler.stop()

if __name__ == "__main__":
    asyncio.run(test_realtime_jobs())
