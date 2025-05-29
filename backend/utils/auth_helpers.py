from flask_jwt_extended import create_access_token, create_refresh_token
from models import User
from utils.validation import validate_email, validate_password, sanitize_email

def create_user_tokens(user_id):
    """Create access and refresh tokens for a user"""
    access_token = create_access_token(identity=str(user_id))
    refresh_token = create_refresh_token(identity=str(user_id))
    return access_token, refresh_token

def format_user_response(user):
    """Format user data for API responses"""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "profile_picture": user.profile_picture
    }

def validate_login_data(data):
    """Validate login request data"""
    if not data:
        return False, "No data provided"
    
    required_fields = ["username", "password"]
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"{field.capitalize()} is required"
    
    return True, "Valid login data"

def validate_registration_data(data):
    """Validate registration request data"""
    if not data:
        return False, "No data provided"
    
    required_fields = ["username", "email", "password"]
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return False, f"{field.capitalize()} is required"
    
    email = sanitize_email(data["email"])
    if not validate_email(email):
        return False, "Invalid email format"
    
    is_valid_password, password_msg = validate_password(data["password"])
    if not is_valid_password:
        return False, password_msg
    
    return True, "Valid registration data"
