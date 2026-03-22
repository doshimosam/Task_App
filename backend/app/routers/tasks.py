from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskSummary
from app.routers.auth import get_current_user_optional

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """Create a new task."""
    db_task = Task(
        **task.model_dump(),
        owner_id=current_user.id if current_user else None,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/", response_model=List[TaskResponse])
def get_all_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """Get all tasks with optional filters."""
    query = db.query(Task)

    # If authenticated, show only their tasks; else show all unowned tasks
    if current_user:
        query = query.filter(Task.owner_id == current_user.id)
    else:
        query = query.filter(Task.owner_id.is_(None))

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)

    return query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/summary", response_model=TaskSummary)
def get_task_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    """Get task count summary."""
    query = db.query(Task)
    if current_user:
        query = query.filter(Task.owner_id == current_user.id)
    else:
        query = query.filter(Task.owner_id.is_(None))

    tasks = query.all()
    return TaskSummary(
        total=len(tasks),
        pending=sum(1 for t in tasks if t.status == TaskStatus.pending),
        in_progress=sum(1 for t in tasks if t.status == TaskStatus.in_progress),
        completed=sum(1 for t in tasks if t.status == TaskStatus.completed),
        high_priority=sum(1 for t in tasks if t.priority == TaskPriority.high),
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
):
    """Update a task (partial update supported)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")

    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")
    db.delete(task)
    db.commit()
    return None
