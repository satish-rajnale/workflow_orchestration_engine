from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class WorkflowBase(BaseModel):
    name: str
    definition: Dict[str, Any]


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(WorkflowBase):
    pass


class WorkflowOut(WorkflowBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExecutionOut(BaseModel):
    id: int
    workflow_id: int
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExecutionLogOut(BaseModel):
    id: int
    execution_id: int
    node_id: str
    status: str
    message: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ExecutionHistoryOut(BaseModel):
    execution: ExecutionOut
    logs: List[ExecutionLogOut]
