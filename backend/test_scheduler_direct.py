#!/usr/bin/env python3
"""
Direct test of the job scheduler
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.scheduler import job_scheduler
from datetime import datetime, timedelta

async def test_scheduler():
    """Test the job scheduler directly"""
    
    print("🧪 Testing Job Scheduler Directly")
    print("=" * 50)
    
    try:
        # Start the scheduler
        print("1. Starting job scheduler...")
        await job_scheduler.start()
        
        # Schedule a test job
        print("2. Scheduling a test job...")
        test_job_id = await job_scheduler.schedule_job(
            job_type="test_job",
            scheduled_at=datetime.utcnow() + timedelta(seconds=2),
            test_data="Hello from test job"
        )
        print(f"   Scheduled job with ID: {test_job_id}")
        
        # Wait a moment for the job to be processed
        print("3. Waiting for job to be processed...")
        await asyncio.sleep(3)
        
        # Check job status
        print("4. Checking job status...")
        job_status = await job_scheduler.get_job_status(test_job_id)
        if job_status:
            print(f"   Job status: {job_status['status']}")
            print(f"   Job data: {job_status}")
        else:
            print("   Job not found")
        
        # Get all jobs
        print("5. Getting all jobs...")
        all_jobs = list(job_scheduler.jobs.values())
        print(f"   Found {len(all_jobs)} jobs")
        
        # Get active jobs
        print("6. Getting active jobs...")
        active_jobs = await job_scheduler.get_active_jobs()
        print(f"   Found {len(active_jobs)} active jobs")
        
        # Stop the scheduler
        print("7. Stopping job scheduler...")
        await job_scheduler.stop()
        
        print("✅ Scheduler test completed successfully")
        
    except Exception as e:
        print(f"❌ Error during scheduler test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_scheduler())
