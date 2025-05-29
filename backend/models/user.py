from extensions import db, bcrypt
from datetime import datetime, timezone

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)  # Make nullable for Google OAuth users
    google_id = db.Column(db.String(100), unique=True, nullable=True)  # Add = Google ID
    profile_picture = db.Column(db.String(255), nullable=True)  # Add profile picture URL
    notify_email = db.Column(db.Boolean, default=True)
    notify_in_app = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    
    # Add the projects relationship that corresponds to the 'members' relationship in Project
    projects = db.relationship('Project', secondary='membership', back_populates='members')
    
    # Add the tasks relationship to match the 'assignee' back_populates in the Task model
    tasks = db.relationship('Task', back_populates='assignee')
    
    # Add the messages relationship to match the 'user' back_populates in the Message model
    messages = db.relationship('Message', back_populates='user')
    
    # Add notifications relationship for Notification back_populates
    notifications = db.relationship('Notification', back_populates='user')
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)
