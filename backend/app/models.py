from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from .db import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workflows = relationship('Workflow', back_populates='user', cascade='all,delete')


class Workflow(Base):
    __tablename__ = 'workflows'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    definition = Column(JSON, nullable=False)  # includes triggers, nodes, edges
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='workflows')
    executions = relationship('Execution', back_populates='workflow', cascade='all,delete')


class Execution(Base):
    __tablename__ = 'executions'

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='pending', index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    trigger_data = Column(JSON, nullable=True)  # store the data that triggered this execution

    workflow = relationship('Workflow', back_populates='executions')
    logs = relationship('ExecutionLog', back_populates='execution', cascade='all,delete')


class ExecutionLog(Base):
    __tablename__ = 'execution_logs'

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey('executions.id', ondelete='CASCADE'), nullable=False)
    node_id = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    execution = relationship('Execution', back_populates='logs')


# Support ticket system models
class Ticket(Base):
    __tablename__ = 'tickets'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default='open', index=True)
    assigned_to = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship('User', foreign_keys=[user_id])
    assignee = relationship('User', foreign_keys=[assigned_to])
