import re

def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.strip()) is not None

def validate_password(password):
    """Validate password strength"""
    if not password or not isinstance(password, str):
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present and non-empty"""
    if not data:
        return False, "No data provided"
    
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return False, f"{field.replace('_', ' ').title()} is required"
    
    return True, "All required fields present"

def sanitize_string(value):
    """Sanitize string input by stripping whitespace"""
    if not isinstance(value, str):
        return value
    return value.strip()

def sanitize_email(email):
    """Sanitize email by converting to lowercase and stripping whitespace"""
    if not isinstance(email, str):
        return email
    return email.strip().lower()
