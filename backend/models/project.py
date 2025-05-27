from extensions import db

class Membership(db.Model):
    __tablename__ = 'membership'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    owner = db.relationship('User', backref='owned_projects', foreign_keys=[owner_id])
    members = db.relationship('User', secondary='membership', back_populates='projects')
    tasks = db.relationship('Task', back_populates='project')
    messages = db.relationship('Message', back_populates='project')
