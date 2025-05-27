from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import cloudinary.uploader
from models import Task, User, Project, TaskAttachment, Notification
from extensions import db
from utils.email import send_email

task_bp = Blueprint('task', __name__)

@task_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if not any(member.id == user_id for member in project.members):
        return jsonify({'msg': 'Not a member of this project'}), 403
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'msg': 'Title required'}), 400
    title = data.get('title')
    description = data.get('description')
    due_date = None
    if 'due_date' in data:
        try:
            due_date = datetime.fromisoformat(data['due_date'])
        except ValueError:
            return jsonify({'msg': 'Invalid date format'}), 400
    status = data.get('status', 'To Do')
    assignee = None
    if 'assignee_id' in data:
        assignee = User.query.get(data['assignee_id'])
        if not assignee:
            return jsonify({'msg': 'Assignee not found'}), 404
        if not any(member.id == assignee.id for member in project.members):
            return jsonify({'msg': 'Assignee must be project member'}), 400
    task = Task(title=title, description=description, due_date=due_date,
                status=status, project_id=project_id,
                assignee_id=assignee.id if assignee else None)
    db.session.add(task)
    db.session.commit()
    if assignee:
        message = f"You have been assigned task '{task.title}' in project '{project.name}'"
        notification = Notification(user_id=assignee.id, message=message)
        db.session.add(notification)
        if assignee.notify_email:
            send_email("Task Assigned", [assignee.email], "", message)
        db.session.commit()
    return jsonify({'msg': 'Task created', 'task_id': task.id}), 201

@task_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project = task.project
    if not any(member.id == user_id for member in project.members):
        return jsonify({'msg': 'Not authorized'}), 403
    data = request.get_json()
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    if 'due_date' in data:
        try:
            task.due_date = datetime.fromisoformat(data['due_date'])
        except ValueError:
            return jsonify({'msg': 'Invalid date format'}), 400
    if 'status' in data:
        task.status = data['status']
    if 'assignee_id' in data:
        assignee = User.query.get(data['assignee_id'])
        if not assignee or not any(member.id == assignee.id for member in project.members):
            return jsonify({'msg': 'Invalid assignee'}), 400
        task.assignee_id = assignee.id
    db.session.commit()
    return jsonify({'msg': 'Task updated'})

@task_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project = task.project
    if project.owner_id != user_id:
        return jsonify({'msg': 'Only project owner can delete tasks'}), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({'msg': 'Task deleted'})

@task_bp.route('/tasks/<int:task_id>/attachment', methods=['POST'])
@jwt_required()
def add_attachment(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project = task.project
    if not any(member.id == user_id for member in project.members):
        return jsonify({'msg': 'Not authorized'}), 403
    if 'file' not in request.files:
        return jsonify({'msg': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'No selected file'}), 400
    upload_result = cloudinary.uploader.upload(file)
    attachment = TaskAttachment(task_id=task_id, file_url=upload_result.get('secure_url'))
    db.session.add(attachment)
    db.session.commit()
    return jsonify({'msg': 'File uploaded', 'url': attachment.file_url})
