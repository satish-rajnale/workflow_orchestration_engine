from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User, Workflow, Execution
from ..deps import get_current_user

router = APIRouter()


@router.get('/{email_id}/status')
async def get_email_status(email_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get email status by email ID"""
    try:
        from ..services.email import email_service
        status = email_service.get_email_status(email_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get email status: {str(e)}")


@router.get('/workflow/{workflow_id}')
async def get_workflow_emails(workflow_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all emails for a specific workflow execution"""
    try:
        wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
        if not wf:
            raise HTTPException(status_code=404, detail='Workflow not found')
        
        # Get recent executions for this workflow
        executions = db.query(Execution).filter(Execution.workflow_id == workflow_id).order_by(Execution.started_at.desc()).limit(5).all()
        
        emails = []
        for execution in executions:
            # In a real implementation, you would query emails by execution_id
            # For now, we'll return execution info
            emails.append({
                'execution_id': execution.id,
                'started_at': execution.started_at,
                'status': execution.status,
                'emails': []  # This would be populated with actual email data
            })
        
        return emails
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow emails: {str(e)}")
