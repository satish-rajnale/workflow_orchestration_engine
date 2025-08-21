from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User, Ticket
from ..deps import get_current_user

router = APIRouter()


@router.post('')
async def create_ticket(ticket_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new ticket"""
    try:
        ticket = Ticket(
            title=ticket_data.get('title'),
            description=ticket_data.get('description'),
            status=ticket_data.get('status', 'open'),
            priority=ticket_data.get('priority', 'medium'),
            assigned_to=ticket_data.get('assigned_to'),
            created_by=current_user.id
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")


@router.get('')
async def list_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all tickets"""
    try:
        tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tickets: {str(e)}")


@router.get('/{ticket_id}')
async def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific ticket"""
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail='Ticket not found')
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ticket: {str(e)}")


@router.put('/{ticket_id}')
async def update_ticket(ticket_id: int, ticket_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a ticket"""
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail='Ticket not found')
        
        # Update fields
        if 'title' in ticket_data:
            ticket.title = ticket_data['title']
        if 'description' in ticket_data:
            ticket.description = ticket_data['description']
        if 'status' in ticket_data:
            ticket.status = ticket_data['status']
        if 'priority' in ticket_data:
            ticket.priority = ticket_data['priority']
        if 'assigned_to' in ticket_data:
            ticket.assigned_to = ticket_data['assigned_to']
        
        db.commit()
        db.refresh(ticket)
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update ticket: {str(e)}")


@router.delete('/{ticket_id}')
async def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a ticket"""
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail='Ticket not found')
        
        db.delete(ticket)
        db.commit()
        return {"message": "Ticket deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete ticket: {str(e)}")


@router.put('/{ticket_id}/status')
async def update_ticket_status(ticket_id: int, status_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update ticket status"""
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail='Ticket not found')
        
        ticket.status = status_data.get('status')
        db.commit()
        db.refresh(ticket)
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update ticket status: {str(e)}")


@router.get('/filter/{status}')
async def filter_tickets_by_status(status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Filter tickets by status"""
    try:
        if status == 'all':
            tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
        else:
            tickets = db.query(Ticket).filter(Ticket.status == status).order_by(Ticket.created_at.desc()).all()
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to filter tickets: {str(e)}")
