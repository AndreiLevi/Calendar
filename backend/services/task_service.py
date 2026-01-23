"""
Task Service - CRUD operations for user tasks.

Supports:
- RIGID tasks (fixed time, cannot reschedule)
- FLEXIBLE tasks (can be rescheduled)
- RECURRING tasks (repeating)
- INTENTION tasks (goals without deadline)

Uses Supabase for storage.
"""

import os
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from supabase import create_client, Client
from pydantic import BaseModel
from enum import Enum


class TaskType(str, Enum):
    RIGID = "rigid"
    FLEXIBLE = "flexible"
    RECURRING = "recurring"
    INTENTION = "intention"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SNOOZED = "snoozed"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType = TaskType.FLEXIBLE
    scheduled_at: Optional[datetime] = None
    due_date: Optional[date] = None
    estimated_duration: Optional[int] = None  # minutes
    project_id: Optional[str] = None
    life_sphere: Optional[str] = None
    recurrence_rule: Optional[str] = None  # RRULE format


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    scheduled_at: Optional[datetime] = None
    due_date: Optional[date] = None
    estimated_duration: Optional[int] = None
    project_id: Optional[str] = None
    life_sphere: Optional[str] = None


class TaskService:
    """Service for managing user tasks"""
    
    def __init__(self):
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment variables")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    async def create_task(self, user_id: str, task_data: TaskCreate) -> Dict[str, Any]:
        """Create a new task"""
        try:
            data = {
                'user_id': user_id,
                'title': task_data.title,
                'description': task_data.description,
                'task_type': task_data.task_type.value,
                'status': TaskStatus.PENDING.value,
                'scheduled_at': task_data.scheduled_at.isoformat() if task_data.scheduled_at else None,
                'due_date': task_data.due_date.isoformat() if task_data.due_date else None,
                'estimated_duration': task_data.estimated_duration,
                'project_id': task_data.project_id,
                'life_sphere': task_data.life_sphere,
                'recurrence_rule': task_data.recurrence_rule,
            }
            
            result = self.supabase.table('tasks').insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating task: {e}")
            raise
    
    async def get_tasks(
        self, 
        user_id: str,
        status: Optional[TaskStatus] = None,
        task_type: Optional[TaskType] = None,
        life_sphere: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get tasks with optional filters"""
        try:
            query = self.supabase.table('tasks') \
                .select('*') \
                .eq('user_id', user_id)
            
            if status:
                query = query.eq('status', status.value)
            if task_type:
                query = query.eq('task_type', task_type.value)
            if life_sphere:
                query = query.eq('life_sphere', life_sphere)
            if project_id:
                query = query.eq('project_id', project_id)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []
    
    async def get_task(self, user_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a single task by ID"""
        try:
            result = self.supabase.table('tasks') \
                .select('*') \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting task: {e}")
            return None
    
    async def update_task(
        self, 
        user_id: str, 
        task_id: str, 
        updates: TaskUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update a task"""
        try:
            # Convert to dict and remove None values
            update_data = {k: v for k, v in updates.dict().items() if v is not None}
            
            # Convert enums to string values
            if 'task_type' in update_data:
                update_data['task_type'] = update_data['task_type'].value
            if 'status' in update_data:
                update_data['status'] = update_data['status'].value
            
            # Convert dates to ISO format
            if 'scheduled_at' in update_data and update_data['scheduled_at']:
                update_data['scheduled_at'] = update_data['scheduled_at'].isoformat()
            if 'due_date' in update_data and update_data['due_date']:
                update_data['due_date'] = update_data['due_date'].isoformat()
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = self.supabase.table('tasks') \
                .update(update_data) \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error updating task: {e}")
            raise
    
    async def delete_task(self, user_id: str, task_id: str) -> bool:
        """Delete a task"""
        try:
            self.supabase.table('tasks') \
                .delete() \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            return True
        except Exception as e:
            print(f"Error deleting task: {e}")
            raise
    
    async def complete_task(self, user_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """Mark a task as completed"""
        try:
            result = self.supabase.table('tasks') \
                .update({
                    'status': TaskStatus.COMPLETED.value,
                    'completed_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }) \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error completing task: {e}")
            raise
    
    async def start_task(self, user_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """Mark a task as in progress"""
        try:
            result = self.supabase.table('tasks') \
                .update({
                    'status': TaskStatus.IN_PROGRESS.value,
                    'updated_at': datetime.utcnow().isoformat()
                }) \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error starting task: {e}")
            raise
    
    async def snooze_task(
        self, 
        user_id: str, 
        task_id: str, 
        snooze_until: Optional[datetime] = None
    ) -> Optional[Dict[str, Any]]:
        """Snooze a task"""
        try:
            update_data = {
                'status': TaskStatus.SNOOZED.value,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if snooze_until:
                update_data['scheduled_at'] = snooze_until.isoformat()
            
            result = self.supabase.table('tasks') \
                .update(update_data) \
                .eq('id', task_id) \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error snoozing task: {e}")
            raise
    
    async def get_pending_tasks_for_today(self, user_id: str) -> List[Dict[str, Any]]:
        """Get pending and in-progress tasks for today"""
        try:
            today = date.today().isoformat()
            
            result = self.supabase.table('tasks') \
                .select('*') \
                .eq('user_id', user_id) \
                .in_('status', [TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]) \
                .or_(f"due_date.eq.{today},scheduled_at.gte.{today}T00:00:00,due_date.is.null") \
                .order('scheduled_at', desc=False) \
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting today's tasks: {e}")
            return []
