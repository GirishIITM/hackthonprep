from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Project, User, Notification
from extensions import db
from utils.email import send_email
from utils.cloudinary_upload import upload_project_image, validate_image_file
from datetime import datetime

project_bp = Blueprint('project', __name__)

@project_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        member_emails = data.get('member_emails', '').split(',') if data.get('member_emails') else []
        member_emails = [email.strip() for email in member_emails if email.strip()]
    else:
        data = request.get_json()
        member_emails = data.get('member_emails', []) if data else []
    
    if not data or 'name' not in data:
        return jsonify({'msg': 'Project name required'}), 400
    
    deadline = None
    if 'deadline' in data and data['deadline']:
        try:
            deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'msg': 'Invalid deadline format. Use ISO format'}), 400
    
    project = Project(
        name=data['name'], 
        description=data.get('description'),
        deadline=deadline,
        owner_id=user_id
    )
    
    owner = User.query.get(user_id)
    project.members.append(owner)
    
    invalid_emails = []
    added_members = []
    
    if member_emails:
        for email in member_emails:
            if email == owner.email: 
                continue
                
            member = User.query.filter_by(email=email).first()
            if member:
                if not any(m.id == member.id for m in project.members):
                    project.members.append(member)
                    added_members.append({
                        'id': member.id,
                        'email': member.email,
                        'username': member.username,
                        'full_name': getattr(member, 'full_name', member.username)
                    })
            else:
                invalid_emails.append(email)
    
    db.session.add(project)
    db.session.flush() 
    
    if 'project_image' in request.files:
        image_file = request.files['project_image']
        if image_file.filename != '':
            is_valid, error_message = validate_image_file(image_file)
            if not is_valid:
                return jsonify({'msg': f'Invalid image: {error_message}'}), 400
            
            upload_result = upload_project_image(image_file, project.id)
            if upload_result:
                project.project_image = upload_result['secure_url']
    
    db.session.commit()
    
    # Send notifications to added members
    for member_info in added_members:
        member = User.query.get(member_info['id'])
        message = f"You have been added to project '{project.name}'"
        notification = Notification(user_id=member.id, message=message)
        db.session.add(notification)
        if getattr(member, 'notify_email', True):
            send_email("Added to Project", [member.email], "", message)
    
    db.session.commit()
    
    response = {
        'msg': 'Project created', 
        'project_id': project.id,
        'project_image': project.project_image,
        'added_members': added_members
    }
    
    if invalid_emails:
        response['invalid_emails'] = invalid_emails
        response['warning'] = f"Some emails were not found: {', '.join(invalid_emails)}"
    
    return jsonify(response), 201

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

@project_bp.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """Get users for member auto-completion with optimized queries"""
    try:
        search_query = request.args.get('q', '').strip().lower()
        limit = min(int(request.args.get('limit', 20)), 50)
        offset = int(request.args.get('offset', 0))
        
        query = db.session.query(
            User.id,
            User.username, 
            User.email,
            User.full_name,
            User.profile_picture
        )
        
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.full_name.ilike(search_pattern)
                )
            )
        
        query = query.order_by(User.username.asc())
        
        total_count = None
        if offset == 0:  # Only calculate on first page
            total_count = query.count()
        
        users = query.offset(offset).limit(limit).all()
        
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name or user.username,
                'profile_picture': user.profile_picture
            })
        
        result = {
            'users': users_data,
            'has_more': len(users_data) == limit,
            'total_count': total_count
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Search users error: {e}")
        return jsonify({'msg': 'An error occurred while searching users'}), 500
