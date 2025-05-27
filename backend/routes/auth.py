from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from datetime import datetime, timezone
from models import User, TokenBlocklist, OTPVerification, PasswordResetToken
from extensions import db
from utils.email import send_email
from utils.email_templates import (
    get_otp_email_template, 
    get_password_reset_email_template,
    get_welcome_email_template
)
from utils.google_auth import verify_google_token, get_google_client_id
from utils.cloudinary_upload import upload_profile_image, delete_cloudinary_image
import re

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
            
        required_fields = ["username", "email", "password"]
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({"msg": f"{field.capitalize()} is required"}), 400
        
        username = data["username"].strip()
        email = data["email"].strip().lower()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"msg": "Invalid email format"}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 400
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"msg": "Email already registered"}), 400
        
        otp = OTPVerification.create_otp(email)
        
        subject = "Verify Your Email - OTP"
        html_body = get_otp_email_template(username, otp)
        text_body = f"Your OTP for email verification is: {otp}. Valid for 10 minutes."
        
        email_sent = send_email(subject, [email], text_body, html_body)
        if not email_sent:
            return jsonify({"msg": "Failed to send verification email. Please try again."}), 500
        
        return jsonify({
            "msg": "OTP sent to your email. Please verify to complete registration.",
            "email": email
        }), 200
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"msg": "An error occurred during registration"}), 500

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        required_fields = ["email", "otp", "username", "password"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"msg": f"{field.capitalize()} is required"}), 400
        
        email = data["email"].strip().lower()
        otp = data["otp"].strip()
        username = data["username"].strip()
        password = data["password"]
        
        verification = OTPVerification.query.filter_by(
            email=email, 
            is_used=False
        ).order_by(OTPVerification.created_at.desc()).first()
        
        if not verification:
            return jsonify({"msg": "No valid OTP found for this email"}), 400
        
        # Use the new is_expired method
        if verification.is_expired():
            return jsonify({"msg": "OTP has expired. Please request a new one."}), 400
        
        if verification.attempts >= 3:
            verification.is_used = True
            db.session.commit()
            return jsonify({"msg": "Too many failed attempts. Please request a new OTP."}), 400
        
        # Verify OTP
        if verification.otp != otp:
            verification.attempts += 1
            db.session.commit()
            remaining_attempts = 3 - verification.attempts
            return jsonify({
                "msg": f"Invalid OTP. {remaining_attempts} attempts remaining."
            }), 400
        
        # Double-check that user doesn't exist
        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"msg": "Email already registered"}), 400
        
        # Create user
        user = User(username=username, email=email)
        user.set_password(password)
        
        verification.is_used = True
        
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email
        subject = "Welcome to Our Platform!"
        html_body = get_welcome_email_template(username)
        text_body = f"Welcome {username}! Your account has been successfully created."
        send_email(subject, [email], text_body, html_body)
        
        return jsonify({"msg": "Registration completed successfully"}), 201
        
    except Exception as e:
        print(f"OTP verification error: {e}")
        db.session.rollback()
        return jsonify({"msg": "An error occurred during verification"}), 500

@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"msg": "Email is required"}), 400
        
        email = data["email"].strip().lower()
        username = data.get("username", "User")
        
        if not validate_email(email):
            return jsonify({"msg": "Invalid email format"}), 400
        
        # Check if email is already registered
        if User.query.filter_by(email=email).first():
            return jsonify({"msg": "Email already registered"}), 400
        
        # Generate new OTP
        otp = OTPVerification.create_otp(email)
        
        # Send OTP email
        subject = "Verify Your Email - New OTP"
        html_body = get_otp_email_template(username, otp)
        text_body = f"Your new OTP for email verification is: {otp}. Valid for 10 minutes."
        
        email_sent = send_email(subject, [email], text_body, html_body)
        if not email_sent:
            return jsonify({"msg": "Failed to send verification email. Please try again."}), 500
        
        return jsonify({"msg": "New OTP sent to your email"}), 200
        
    except Exception as e:
        print(f"Resend OTP error: {e}")
        return jsonify({"msg": "An error occurred while resending OTP"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ("username", "password")):
            return jsonify({"msg": "Username and password are required"}), 400
        
        username = data["username"].strip()
        email = data["email"].strip()
        password = data["password"]
        
        user = User.query.filter_by(username=username).first()
        if not user:
            user = User.query.filter_by(email=email).first()
        print(user)
        if not user or not user.check_password(password):
            return jsonify({"msg": "Invalid credentials"}), 401
        
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"msg": "An error occurred during login"}), 500

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"msg": "Email is required"}), 400
        
        email = data["email"].strip().lower()
        
        if not validate_email(email):
            return jsonify({"msg": "Invalid email format"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if email exists or not for security
            return jsonify({"msg": "If the email exists, a password reset link has been sent"}), 200
        
        reset_token = PasswordResetToken.create_token(user.id)
        
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
        subject = "Password Reset Request"
        html_body = get_password_reset_email_template(user.username, reset_link)
        text_body = f"Click this link to reset your password: {reset_link}"
        
        email_sent = send_email(subject, [email], text_body, html_body)
        if not email_sent:
            return jsonify({"msg": "Failed to send reset email. Please try again."}), 500
        
        return jsonify({"msg": "If the email exists, a password reset link has been sent"}), 200
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({"msg": "An error occurred while processing your request"}), 500

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        required_fields = ["token", "new_password"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"msg": f"{field.replace('_', ' ').title()} is required"}), 400
        
        token = data["token"].strip()
        new_password = data["new_password"]
        
        # Validate password strength
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({"msg": msg}), 400
        
        # Find the reset token
        reset_token = PasswordResetToken.query.filter_by(
            token=token,
            is_used=False
        ).first()
        
        if not reset_token:
            return jsonify({"msg": "Invalid or expired reset token"}), 400
        
        # Use the new is_expired method
        if reset_token.is_expired():
            return jsonify({"msg": "Reset token has expired. Please request a new one."}), 400
        
        # Get the user
        user = User.query.get(reset_token.user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404
        
        # Update password
        user.set_password(new_password)
        reset_token.is_used = True
        
        db.session.commit()
        
        return jsonify({"msg": "Password reset successfully"}), 200
        
    except Exception as e:
        print(f"Reset password error: {e}")
        db.session.rollback()
        return jsonify({"msg": "An error occurred while resetting password"}), 500

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    try:
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        return jsonify(access_token=access_token)
    except Exception as e:
        print(f"Token refresh error: {e}")
        return jsonify({"msg": "An error occurred while refreshing token"}), 500

@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required(verify_type=False)
def logout():
    try:
        jwt_data = get_jwt()
        jti = jwt_data["jti"]
        ttype = jwt_data["type"]
        now = datetime.now(timezone.utc)
        db.session.add(TokenBlocklist(jti=jti, type=ttype, created_at=now))
        db.session.commit()
        return jsonify({"msg": f"{ttype.capitalize()} token revoked"}), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({"msg": "An error occurred during logout"}), 500

@auth_bp.route("/upload-profile-image", methods=["POST"])
@jwt_required()
def upload_profile_image_endpoint():
    """Upload profile image to Cloudinary"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        
        if 'image' not in request.files:
            return jsonify({"msg": "No image file provided"}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"msg": "No image file selected"}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        file_extension = image_file.filename.rsplit('.', 1)[1].lower() if '.' in image_file.filename else ''
        
        if file_extension not in allowed_extensions:
            return jsonify({"msg": "Invalid file type. Allowed types: PNG, JPG, JPEG, GIF, WEBP"}), 400
        
        # Delete old profile image if exists
        if user.profile_picture and 'cloudinary.com' in user.profile_picture:
            delete_cloudinary_image(user.profile_picture)
        
        # Upload new image
        upload_result = upload_profile_image(image_file, user_id)
        if not upload_result:
            return jsonify({"msg": "Failed to upload image"}), 500
        
        # Update user profile
        user.profile_picture = upload_result['secure_url']
        db.session.commit()
        
        return jsonify({
            "msg": "Profile image uploaded successfully",
            "profile_picture": user.profile_picture
        }), 200
        
    except Exception as e:
        print(f"Profile image upload error: {e}")
        return jsonify({"msg": "An error occurred while uploading image"}), 500

@auth_bp.route("/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        if "notify_email" in data:
            user.notify_email = bool(data["notify_email"])
        if "notify_in_app" in data:
            user.notify_in_app = bool(data["notify_in_app"])
        
        # Handle profile image URL update (if provided directly)
        if "profile_picture" in data:
            # Delete old profile image if exists and is from Cloudinary
            if user.profile_picture and 'cloudinary.com' in user.profile_picture:
                delete_cloudinary_image(user.profile_picture)
            
            user.profile_picture = data["profile_picture"]
        
        db.session.commit()
        return jsonify({
            "msg": "Settings updated successfully",
            "user": {
                "notify_email": user.notify_email,
                "notify_in_app": user.notify_in_app,
                "profile_picture": user.profile_picture
            }
        })
        
    except Exception as e:
        print(f"Update settings error: {e}")
        return jsonify({"msg": "An error occurred while updating settings"}), 500

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get user profile information"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "profile_picture": user.profile_picture,
                "notify_email": user.notify_email,
                "notify_in_app": user.notify_in_app
            }
        }), 200
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({"msg": "An error occurred while fetching profile"}), 500

@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    """Handle Google OAuth login"""
    try:
        data = request.get_json()
        if not data or "token" not in data:
            return jsonify({"msg": "Google token is required"}), 400
        
        google_token = data["token"]
        
        # Verify Google token
        google_info = verify_google_token(google_token)
        if not google_info:
            return jsonify({"msg": "Invalid Google token"}), 401
        
        # Check if email is verified
        if not google_info.get('email_verified', False):
            return jsonify({"msg": "Google email not verified"}), 401
        
        # Find or create user
        user = User.find_or_create_google_user(google_info)
        
        # Create JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "profile_picture": user.profile_picture
            }
        }), 200
        
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({"msg": "An error occurred during Google login"}), 500

@auth_bp.route("/google-client-id", methods=["GET"])
def get_client_id():
    """Get Google OAuth client ID for frontend"""
    try:
        client_id = get_google_client_id()
        if not client_id:
            return jsonify({"msg": "Google client ID not configured"}), 500
        
        return jsonify({"client_id": client_id}), 200
        
    except Exception as e:
        print(f"Error getting client ID: {e}")
        return jsonify({"msg": "An error occurred"}), 500

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"
