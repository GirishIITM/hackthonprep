from datetime import datetime, timezone
from extensions import db

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='To Do')
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    project = db.relationship('Project', back_populates='tasks')
    assignee = db.relationship('User', back_populates='tasks')
    attachments = db.relationship('TaskAttachment', back_populates='task')

class TaskAttachment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    file_url = db.Column(db.String(200), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    task = db.relationship('Task', back_populates='attachments')
