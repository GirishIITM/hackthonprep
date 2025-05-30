def register_blueprints(app):
    from .auth import auth_bp
    from .profile import profile_bp
    from .project import project_bp
    from .task import task_bp
    from .message import message_bp
    from .notification import notification_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(profile_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(notification_bp)
