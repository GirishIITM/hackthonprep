from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Project, User, Notification, Task
from extensions import db
from utils.email import send_email
from utils.cloudinary_upload import upload_project_image, validate_image_file
from datetime import datetime, timezone
from sqlalchemy import case

project_bp = Blueprint('project', __name__)

@project_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        member_emails = data.get('member_emails', '').split(',') if data.get('member_emails') else []
        member_emails = [email.strip() for email in member_emails if email.strip()]
        member_permissions = {}
        for key, value in data.items():
            if key.startswith('member_permission_'):
                email = key.replace('member_permission_', '')
                member_permissions[email] = value.lower() == 'true'
    else:
        data = request.get_json()
        member_emails = data.get('member_emails', []) if data else []
        member_permissions = data.get('member_permissions', {}) if data else {}
    
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
    
    db.session.add(project)
    db.session.flush()  # Get project ID
    
    from models.project import Membership
    owner_membership = Membership(
        user_id=user_id,
        project_id=project.id,
        is_editor=True  # Owner always has edit access
    )
    db.session.add(owner_membership)
    
    invalid_emails = []
    added_members = []
    
    if member_emails:
        for email in member_emails:
            owner = User.query.get(user_id)
            if email == owner.email: 
                continue
                
            member = User.query.filter_by(email=email).first()
            if member:
                existing_membership = Membership.query.filter_by(
                    user_id=member.id, 
                    project_id=project.id
                ).first()
                
                if not existing_membership:
                    has_edit_access = member_permissions.get(email, False)
                    
                    membership = Membership(
                        user_id=member.id,
                        project_id=project.id,
                        is_editor=has_edit_access
                    )
                    db.session.add(membership)
                    
                    added_members.append({
                        'id': member.id,
                        'email': member.email,
                        'username': member.username,
                        'full_name': getattr(member, 'full_name', member.username),
                        'isEditor': has_edit_access
                    })
            else:
                invalid_emails.append(email)
    
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
    
    for member_info in added_members:
        member = User.query.get(member_info['id'])
        edit_status = "with edit access" if member_info['isEditor'] else "with view access"
        message = f"You have been added to project '{project.name}' {edit_status}"
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
    """Get detailed projects list with filtering options"""
    user_id = int(get_jwt_identity())
    
    search = request.args.get('search', '').strip()
    owner_filter = request.args.get('owner')  # 'me' to filter only owned projects
    member_filter = request.args.get('member')  # 'me' to filter only projects where user is member
    status = request.args.get('status')  # 'active', 'completed', 'overdue'
    limit = min(int(request.args.get('limit', 50)), 100)
    offset = int(request.args.get('offset', 0))
    
    try:
        from models.project import Membership
        
        query = db.session.query(Project).join(Membership).filter(
            Membership.user_id == user_id
        )
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    Project.name.ilike(search_pattern),
                    Project.description.ilike(search_pattern)
                )
            )
        
        if owner_filter == 'me':
            query = query.filter(Project.owner_id == user_id)
        elif member_filter == 'me':
            pass
        
        if status:
            current_time = datetime.now(timezone.utc)
            if status == 'overdue':
                query = query.filter(
                    Project.deadline.isnot(None),
                    db.func.coalesce(
                        db.func.timezone('UTC', Project.deadline),
                        Project.deadline
                    ) < current_time
                )
            elif status == 'active':
                query = query.filter(
                    db.or_(
                        Project.deadline.is_(None),
                        db.func.coalesce(
                            db.func.timezone('UTC', Project.deadline),
                            Project.deadline
                        ) >= current_time
                    )
                )
        
        total_count = query.count()
        
        projects = query.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
        
        projects_data = []
        for project in projects:
            user_membership = Membership.query.filter_by(
                user_id=user_id, 
                project_id=project.id
            ).first()
            
            members = []
            for membership in Membership.query.filter_by(project_id=project.id).all():
                member = User.query.get(membership.user_id)
                if member:
                    members.append({
                        'id': member.id,
                        'username': member.username,
                        'email': member.email,
                        'full_name': getattr(member, 'full_name', member.username),
                        'profile_picture': member.profile_picture,
                        'isEditor': membership.is_editor,
                        'is_owner': member.id == project.owner_id
                    })
            
            task_stats = db.session.query(
                db.func.count().label('total'),
                db.func.sum(case((Task.status == 'completed', 1), else_=0)).label('completed')
            ).filter(Task.project_id == project.id).first()
            
            total_tasks = task_stats.total or 0
            completed_tasks = task_stats.completed or 0
            
            project_status = 'active'
            if project.deadline:
                # Ensure deadline is timezone-aware for comparison
                deadline_aware = project.deadline
                if deadline_aware.tzinfo is None:
                    deadline_aware = deadline_aware.replace(tzinfo=timezone.utc)
                
                if deadline_aware < datetime.now(timezone.utc):
                    project_status = 'overdue'
                elif total_tasks > 0 and completed_tasks == total_tasks:
                    project_status = 'completed'
            
            projects_data.append({
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'project_image': project.project_image,
                'deadline': project.deadline.isoformat() if project.deadline else None,
                'created_at': project.created_at.isoformat(),
                'is_owner': project.owner_id == user_id,
                'user_can_edit': user_membership.is_editor if user_membership else False,
                'status': project_status,
                'members': members,
                'member_count': len(members),
                'task_stats': {
                    'total': total_tasks,
                    'completed': completed_tasks,
                    'pending': total_tasks - completed_tasks
                },
                'owner': {
                    'id': project.owner.id,
                    'username': project.owner.username,
                    'full_name': getattr(project.owner, 'full_name', project.owner.username),
                    'profile_picture': project.owner.profile_picture
                }
            })
        
        return jsonify({
            'projects': projects_data,
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            }
        }), 200
        
    except Exception as e:
        print(f"List projects error: {e}")
        return jsonify({'msg': 'An error occurred while fetching projects'}), 500

@project_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get detailed project information"""
    user_id = int(get_jwt_identity())
    
    try:
        from models.project import Membership
        
        project = Project.query.get_or_404(project_id)
        
        user_membership = Membership.query.filter_by(
            user_id=user_id, 
            project_id=project_id
        ).first()
        
        if not user_membership:
            return jsonify({'msg': 'Not a member of this project'}), 403
        
        members = []
        for membership in Membership.query.filter_by(project_id=project_id).all():
            member = User.query.get(membership.user_id)
            if member:
                members.append({
                    'id': member.id,
                    'username': member.username,
                    'email': member.email,
                    'full_name': getattr(member, 'full_name', member.username),
                    'profile_picture': member.profile_picture,
                    'isEditor': membership.is_editor,
                    'is_owner': member.id == project.owner_id,
                    'joined_at': membership.id  # You might want to add a joined_at timestamp to Membership
                })
        
        recent_tasks = db.session.query(
            'Task'  # Assuming Task model exists
        ).filter_by(project_id=project_id).order_by('created_at desc').limit(5).all() if 'Task' in globals() else []
        
        project_data = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'project_image': project.project_image,
            'deadline': project.deadline.isoformat() if project.deadline else None,
            'created_at': project.created_at.isoformat(),
            'is_owner': project.owner_id == user_id,
            'user_can_edit': user_membership.is_editor,
            'members': members,
            'member_count': len(members),
            'owner': {
                'id': project.owner.id,
                'username': project.owner.username,
                'full_name': getattr(project.owner, 'full_name', project.owner.username),
                'profile_picture': project.owner.profile_picture
            }
        }
        
        return jsonify(project_data), 200
        
    except Exception as e:
        print(f"Get project error: {e}")
        return jsonify({'msg': 'An error occurred while fetching project details'}), 500

@project_bp.route('/projects/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_member(project_id):
    """Add member with edit permissions"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    try:
        from models.project import Membership
        
        project = Project.query.get_or_404(project_id)
        
        user_membership = Membership.query.filter_by(
            user_id=user_id, 
            project_id=project_id
        ).first()
        
        if not user_membership or (project.owner_id != user_id and not user_membership.is_editor):
            return jsonify({'msg': 'Only project owner or editors can add members'}), 403
        
        if not data or 'email' not in data:
            return jsonify({'msg': 'Email required'}), 400
        
        new_member = User.query.filter_by(email=data['email']).first()
        if not new_member:
            return jsonify({'msg': 'User not found'}), 404
        
        existing_membership = Membership.query.filter_by(
            user_id=new_member.id, 
            project_id=project_id
        ).first()
        
        if existing_membership:
            return jsonify({'msg': 'User already a member'}), 400
        
        is_editor = data.get('isEditor', False)
        membership = Membership(
            user_id=new_member.id,
            project_id=project_id,
            is_editor=is_editor
        )
        db.session.add(membership)
        db.session.commit()
        
        edit_status = "with edit access" if is_editor else "with view access"
        message = f"You have been added to project '{project.name}' {edit_status}"
        notification = Notification(user_id=new_member.id, message=message)
        db.session.add(notification)
        
        if getattr(new_member, 'notify_email', True):
            send_email("Added to Project", [new_member.email], "", message)
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Member added successfully',
            'member': {
                'id': new_member.id,
                'username': new_member.username,
                'email': new_member.email,
                'full_name': getattr(new_member, 'full_name', new_member.username),
                'isEditor': is_editor
            }
        }), 200
        
    except Exception as e:
        print(f"Add member error: {e}")
        return jsonify({'msg': 'An error occurred while adding member'}), 500
