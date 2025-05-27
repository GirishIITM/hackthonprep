from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Project, User, Notification
from extensions import db
from utils.email import send_email

project_bp = Blueprint('project', __name__)

@project_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'msg': 'Project name required'}), 400
    project = Project(name=data['name'], description=data.get('description'), owner_id=user_id)
    project.members.append(User.query.get(user_id))
    db.session.add(project)
    db.session.commit()
    return jsonify({'msg': 'Project created', 'project_id': project.id}), 201

@project_bp.route('/projects', methods=['GET'])
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    projects = [{'id': p.id, 'name': p.name, 'description': p.description} for p in user.projects]
    return jsonify(projects)

@project_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if not any(member.id == user_id for member in project.members):
        return jsonify({'msg': 'Not a member of this project'}), 403
    return jsonify({'id': project.id, 'name': project.name, 'description': project.description})

@project_bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if project.owner_id != user_id:
        return jsonify({'msg': 'Only owner can update project'}), 403
    data = request.get_json()
    project.name = data.get('name', project.name)
    project.description = data.get('description', project.description)
    db.session.commit()
    return jsonify({'msg': 'Project updated'})

@project_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if project.owner_id != user_id:
        return jsonify({'msg': 'Only owner can delete project'}), 403
    db.session.delete(project)
    db.session.commit()
    return jsonify({'msg': 'Project deleted'})

@project_bp.route('/projects/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_member(project_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    project = Project.query.get_or_404(project_id)
    if project.owner_id != user_id:
        return jsonify({'msg': 'Only owner can add members'}), 403
    if not data or 'email' not in data:
        return jsonify({'msg': 'Email required'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    if any(member.id == user.id for member in project.members):
        return jsonify({'msg': 'User already a member'}), 400
    project.members.append(user)
    db.session.commit()
    message = f"You have been added to project '{project.name}'"
    notification = Notification(user_id=user.id, message=message)
    db.session.add(notification)
    if user.notify_email:
        send_email("Added to Project", [user.email], "", message)
    db.session.commit()
    return jsonify({'msg': 'Member added'}), 200
