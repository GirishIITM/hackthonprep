from flask import Blueprint, jsonify, request, render_template_string
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token
from datetime import datetime, timezone

from models import User, TokenBlocklist
from extensions import db
from utils.validation import validate_required_fields, sanitize_email, sanitize_string
from utils.auth_utils import (
    validate_login_data, authenticate_user, create_auth_response
)
from utils.otp_service import OTPService
from utils.google_oauth_service import GoogleOAuthService
from utils.password_service import PasswordService
from utils.cloudinary_upload import upload_profile_image, delete_cloudinary_image

auth_bp = Blueprint("auth", __name__)

# Registration endpoints
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        is_valid, msg = validate_required_fields(data, ["full_name", "username", "email", "password"])
        if not is_valid:
            return jsonify({"msg": msg}), 400
        
        # Basic password length check only
        if len(data["password"]) < 6:
            return jsonify({"msg": "Password must be at least 6 characters long"}), 400
        
        full_name = sanitize_string(data["full_name"])
        username = sanitize_string(data["username"])
        email = sanitize_email(data["email"])
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if existing_user:
            if existing_user.email == email:
                return jsonify({"msg": "Email already exists"}), 400
            else:
                return jsonify({"msg": "Username already exists"}), 400
        
        success, message = OTPService.send_registration_otp(full_name, email)
        status_code = 200 if success else 500
        
        return jsonify({"msg": message, "email": email}), status_code
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"msg": "An error occurred during registration"}), 500

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()
        is_valid, msg = validate_required_fields(data, ["email", "otp", "full_name", "username", "password"])
        if not is_valid:
            return jsonify({"msg": msg}), 400
        
        success, message = OTPService.verify_registration_otp(
            data["email"], data["otp"], data["full_name"], data["username"], data["password"]
        )
        status_code = 201 if success else 400
        
        return jsonify({"msg": message}), status_code
        
    except Exception as e:
        print(f"OTP verification error: {e}")
        return jsonify({"msg": "An error occurred during verification"}), 500

@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"msg": "Email is required"}), 400
        
        username = data.get("username", "User")
        success, message = OTPService.resend_registration_otp(data["email"], username)
        status_code = 200 if success else 400
        
        return jsonify({"msg": message}), status_code
        
    except Exception as e:
        print(f"Resend OTP error: {e}")
        return jsonify({"msg": "An error occurred while resending OTP"}), 500

# Authentication endpoints
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        is_valid, msg = validate_login_data(data)
        if not is_valid:
            return jsonify({"msg": msg}), 400
        
        username = sanitize_string(data["username"])
        email = data.get("email", username)
        password = data["password"]
        
        user, error_msg = authenticate_user(username, password)
        if not user:
            return jsonify({"msg": error_msg}), 401
        
        return jsonify(create_auth_response(user)), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"msg": "An error occurred during login"}), 500

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    try:
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        return jsonify({"access_token": access_token}), 200
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
        db.session.rollback()
        return jsonify({"msg": "An error occurred during logout"}), 500

# Password reset endpoints
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"msg": "Email is required"}), 400
        
        success, message = PasswordService.send_reset_email(data["email"])
        return jsonify({"msg": message}), 200
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({"msg": "An error occurred while processing your request"}), 500

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        is_valid, msg = validate_required_fields(data, ["token", "new_password"])
        if not is_valid:
            return jsonify({"msg": msg}), 400
        
        success, message = PasswordService.reset_password_with_token(
            data["token"], data["new_password"]
        )
        status_code = 200 if success else 400
        
        return jsonify({"msg": message}), status_code
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({"msg": "An error occurred while resetting password"}), 500

# Google OAuth endpoints
@auth_bp.route("/google-register", methods=["POST"])
def google_register():
    try:
        data = request.get_json()
        if not data or "token" not in data:
            return jsonify({"msg": "Google token is required"}), 400
        
        result, error_msg = GoogleOAuthService.authenticate_with_google(
            data["token"], is_registration=True
        )
        
        if not result:
            status_code = 409 if "already exists" in error_msg else 401
            return jsonify({"msg": error_msg}), status_code
        
        return jsonify(result), 201
        
    except Exception as e:
        print(f"Google register error: {e}")
        return jsonify({"msg": "An error occurred during Google registration"}), 500

@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    try:
        data = request.get_json()
        if not data or "token" not in data:
            return jsonify({"msg": "Google token is required"}), 400
        
        result, error_msg = GoogleOAuthService.authenticate_with_google(
            data["token"], is_registration=False
        )
        
        if not result:
            status_code = 404 if "not found" in error_msg else 401
            return jsonify({"msg": error_msg}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({"msg": "An error occurred during Google login"}), 500

@auth_bp.route("/google/client-id", methods=["GET"])
def get_google_client_id():
    try:
        result, error_msg = GoogleOAuthService.get_client_id()
        
        if not result:
            return jsonify({"error": error_msg}), 500
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Get Google client ID error: {e}")
        return jsonify({"error": "An error occurred while fetching Google client ID"}), 500

@auth_bp.route("/google/exchange-code", methods=["POST"])
def google_exchange_code():
    try:
        data = request.get_json()
        if not data or "code" not in data:
            return jsonify({"error": "Authorization code is required"}), 400
        
        result, error_msg = GoogleOAuthService.exchange_authorization_code(
            data["code"], data.get("state")
        )
        
        if not result:
            return jsonify({"error": error_msg}), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Google code exchange error: {e}")
        return jsonify({"error": "An error occurred during code exchange"}), 500

@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback with HTML response"""
    try:
        callback_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; 
                       align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
                .container { text-align: center; padding: 20px; background: white; 
                           border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                         border-top: 4px solid #4285F4; border-radius: 50%; 
                         animation: spin 1s linear infinite; margin: 0 auto 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="spinner"></div>
                <p>Processing authentication...</p>
            </div>
            <script>
                (function() {
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('code');
                    const error = urlParams.get('error');
                    const state = urlParams.get('state');
                    
                    if (error) {
                        window.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            error: error === 'access_denied' ? 'Authentication cancelled' : 'Authentication failed'
                        }, window.location.origin);
                        window.close();
                        return;
                    }
                    
                    if (!code) {
                        window.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            error: 'No authorization code received'
                        }, window.location.origin);
                        window.close();
                        return;
                    }
                    
                    fetch('/auth/google/exchange-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, state }),
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.credential) {
                            window.postMessage({
                                type: 'GOOGLE_AUTH_SUCCESS',
                                credential: result.credential
                            }, window.location.origin);
                        } else {
                            window.postMessage({
                                type: 'GOOGLE_AUTH_ERROR',
                                error: result.error || 'Failed to authenticate with Google'
                            }, window.location.origin);
                        }
                        window.close();
                    })
                    .catch(error => {
                        window.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            error: 'Failed to process authentication'
                        }, window.location.origin);
                        window.close();
                    });
                })();
            </script>
        </body>
        </html>
        """
        return render_template_string(callback_html)
        
    except Exception as e:
        print(f"Google callback error: {e}")
        return jsonify({"msg": "OAuth callback error"}), 500

# User profile endpoints
@auth_bp.route("/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        # Update full name if provided
        if "full_name" in data:
            full_name = sanitize_string(data["full_name"])
            if len(full_name.strip()) >= 1:
                user.full_name = full_name
        
        # Update username if provided
        if "username" in data:
            username = sanitize_string(data["username"])
            if len(username.strip()) >= 1:
                # Check if username is already taken
                existing_user = User.query.filter(User.username == username, User.id != user_id).first()
                if not existing_user:
                    user.username = username
        
        # Update about if provided
        if "about" in data:
            about = sanitize_string(data["about"]) if data["about"] else ""
            user.about = about
        
        if "notify_email" in data:
            user.notify_email = bool(data["notify_email"])
        if "notify_in_app" in data:
            user.notify_in_app = bool(data["notify_in_app"])
        
        if "profile_picture" in data:
            if user.profile_picture and 'cloudinary.com' in user.profile_picture:
                delete_cloudinary_image(user.profile_picture)
            user.profile_picture = data["profile_picture"]
        
        db.session.commit()
        return jsonify({
            "msg": "Settings updated successfully",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "name": user.full_name,
                "username": user.username,
                "about": user.about,
                "notify_email": user.notify_email,
                "notify_in_app": user.notify_in_app,
                "profile_picture": user.profile_picture
            }
        }), 200
        
    except Exception as e:
        print(f"Update settings error: {e}")
        db.session.rollback()
        return jsonify({"msg": "An error occurred while updating settings"}), 500
