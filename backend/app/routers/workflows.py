from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Workflow, Execution, ExecutionLog, User
from ..schemas import WorkflowCreate, WorkflowUpdate, WorkflowOut, ExecutionOut, ExecutionLogOut
from ..deps import get_current_user
from ..services.cache import cache
from ..services.executor import workflow_executor
from ..services.conditions import evaluate_condition
import asyncio
from .ws import manager

router = APIRouter()


@router.post('', response_model=WorkflowOut)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = Workflow(user_id=current_user.id, name=payload.name, definition=payload.definition)
    db.add(wf)
    db.commit()
    db.refresh(wf)
    cache.set_json(f"workflow:{wf.id}", payload.model_dump())
    return wf

@router.get('/samples')
def get_samples():
    return [
       {
            "name": "Support Ticket Auto-Responder",
            "definition": {
                "triggers": [
                    {
                        "event": "ticket.created",
                        "condition": {"op": "eq", "path": "ticket_assigned", "value": False}
                    }
                ],
                "nodes": [
                    {"id": "start", "type": "start", "action": "start", "params": {}, "position": {"x": 100, "y": 100}},
                    {"id": "ack_email", "type": "action", "action": "email", "params": {"to": "{{user_email}}", "template": "ack_ticket", "subject": "Ticket Received"}, "position": {"x": 350, "y": 100}},
                    {"id": "wait", "type": "action", "action": "delay", "params": {"seconds": 7200}, "position": {"x": 650, "y": 100}},
                    {"id": "check_assigned", "type": "action", "action": "check_ticket_assigned", "params": {}, "position": {"x":650, "y": 300}},
                    {"id": "escalate", "type": "action", "action": "email", "params": {"to": "support@company.com", "template": "escalate_ticket", "subject": "Ticket Escalation"}, "position": {"x": 300, "y": 350}}
                ],
                "edges": [
                    {"source": "start", "target": "ack_email"},
                    {"source": "ack_email", "target": "wait"},
                    {"source": "wait", "target": "check_assigned"},
                    {"source": "check_assigned", "target": "escalate", "condition": {"op": "eq", "path": "check_result", "value": False}}
                ]
            }
        }
    ]

@router.get('', response_model=List[WorkflowOut])
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Workflow).filter(Workflow.user_id == current_user.id).order_by(Workflow.created_at.desc()).all()

@router.get('/{workflow_id}/history')
def get_history(workflow_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    executions = db.query(Execution).filter(Execution.workflow_id == workflow_id).order_by(Execution.started_at.desc()).all()
    data = []
    for ex in executions:
        logs = db.query(ExecutionLog).filter(ExecutionLog.execution_id == ex.id).order_by(ExecutionLog.timestamp.asc()).all()
        data.append({
            "execution": ExecutionOut.model_validate(ex),
            "logs": [ExecutionLogOut.model_validate(l) for l in logs]
        })
    return data

@router.post('/{workflow_id}/run')
async def run_workflow(workflow_id: int, payload: dict = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    
    # Use the new simplified executor
    execution_id = await workflow_executor.execute_workflow(
        workflow_id=workflow_id,
        payload=payload,
        user_id=str(current_user.id)
    )
    
    return {"execution_id": execution_id}

@router.post('/{workflow_id}/trigger')
async def trigger_workflow(workflow_id: int, trigger_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    
    # Check if any trigger conditions match
    triggers = wf.definition.get('triggers', [])
    should_execute = False
    
    for trigger in triggers:
        if evaluate_condition(trigger.get('condition', {}), trigger_data):
            should_execute = True
            break
    
    if not should_execute:
        return {"message": "No trigger conditions matched", "executed": False}
    
    # Create execution with trigger data
    execution = Execution(workflow_id=wf.id, status='pending', trigger_data=trigger_data)
    db.add(execution)
    db.commit()
    db.refresh(execution)

    async def broadcast(workflow_id: int, event):
        await manager.broadcast(workflow_id, event)

    executor = workflow_executor(
        db=db, 
        workflow=wf, 
        execution=execution, 
        ws_broadcast=broadcast,
        initial_context=trigger_data
    )
    asyncio.create_task(executor.run())
    return {"execution_id": execution.id, "executed": True}

@router.post('/{workflow_id}/test')
async def test_workflow(workflow_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Test a workflow with custom payload data without checking trigger conditions
    """
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    
    # Create execution with test payload data
    execution = Execution(workflow_id=wf.id, status='pending', trigger_data=payload.get('payload', {}))
    db.add(execution)
    db.commit()
    db.refresh(execution)

    async def broadcast(workflow_id: int, event):
        await manager.broadcast(workflow_id, event)

    executor = workflow_executor(
        db=db, 
        workflow=wf, 
        execution=execution, 
        ws_broadcast=broadcast,
        initial_context=payload.get('payload', {})
    )
    asyncio.create_task(executor.run())
    return {"execution_id": execution.id, "message": "Test execution started"}

@router.get('/{workflow_id}', response_model=WorkflowOut)
def get_workflow(workflow_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cached = cache.get_json(f"workflow:{workflow_id}")
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    if cached:
        return wf
    cache.set_json(f"workflow:{workflow_id}", {"name": wf.name, "definition": wf.definition})
    return wf

@router.put('/{workflow_id}', response_model=WorkflowOut)
def update_workflow(workflow_id: int, payload: WorkflowUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    wf.name = payload.name
    wf.definition = payload.definition
    wf.updated_at = datetime.utcnow()
    db.add(wf)
    db.commit()
    db.refresh(wf)
    cache.set_json(f"workflow:{workflow_id}", payload.model_dump())
    return wf

@router.delete('/{workflow_id}')
async def delete_workflow(workflow_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a workflow"""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail='Workflow not found')
    
    # Delete related executions and logs
    db.query(ExecutionLog).filter(ExecutionLog.execution_id.in_(
        db.query(Execution.id).filter(Execution.workflow_id == workflow_id)
    )).delete(synchronize_session=False)
    
    db.query(Execution).filter(Execution.workflow_id == workflow_id).delete()
    db.delete(wf)
    db.commit()
    
    return {"message": "Workflow deleted successfully"}

