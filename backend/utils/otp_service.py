from models import User, OTPVerification, PasswordResetToken
from extensions import db
from utils.email import send_email
from utils.email_templates import get_otp_email_template, get_welcome_email_template
from utils.validation import sanitize_email, sanitize_string, validate_full_name

class OTPService:
    @staticmethod
    def send_registration_otp(full_name, email):
        """Send OTP for registration"""
        try:
            # Validate full_name
            is_valid, msg = validate_full_name(full_name)
            if not is_valid:
                return False, msg
            
            otp = OTPVerification.create_otp(email)
            
            subject = "Verify Your Email - OTP"
            html_body = get_otp_email_template(full_name, otp)
            text_body = f"Your OTP for email verification is: {otp}. Valid for 10 minutes."
            
            email_sent = send_email(subject, [email], text_body, html_body)
            if not email_sent:
                return False, "Failed to send verification email. Please try again."
            
            print(f"OTP sent to {email}: {otp}")  # Remove in production
            return True, "OTP sent to your email. Please verify to complete registration."
            
        except Exception as e:
            print(f"Send OTP error: {e}")
            return False, "An error occurred while sending OTP"

    @staticmethod
    def verify_registration_otp(email, otp, full_name, username, password):
        """Verify OTP and complete user registration"""
        try:
            email = sanitize_email(email)
            otp = sanitize_string(otp)
            username = sanitize_string(username)
            
            verification = OTPVerification.query.filter_by(
                email=email, 
                is_used=False
            ).order_by(OTPVerification.created_at.desc()).first()
            
            if not verification:
                return False, "No valid OTP found for this email"
            
            if verification.is_expired():
                return False, "OTP has expired. Please request a new one."
            
            if verification.attempts >= 3:
                verification.is_used = True
                db.session.commit()
                return False, "Too many failed attempts. Please request a new OTP."
            
            if verification.otp != otp:
                verification.attempts += 1
                db.session.commit()
                remaining_attempts = 3 - verification.attempts
                return False, f"Invalid OTP. {remaining_attempts} attempts remaining."
            
            # Double-check that user doesn't exist
            if User.query.filter_by(username=username).first():
                return False, "Username already exists"
            if User.query.filter_by(email=email).first():
                return False, "Email already registered"
            
            # Create user
            user = User(username=username, email=email,full_name=full_name)
            user.set_password(password)
            
            verification.is_used = True
            
            db.session.add(user)
            db.session.commit()
            
            # Send welcome email
            OTPService._send_welcome_email(user)
            
            return True, "Registration completed successfully"
            
        except Exception as e:
            print(f"OTP verification error: {e}")
            db.session.rollback()
            return False, "An error occurred during verification"

    @staticmethod
    def resend_registration_otp(email, username="User"):
        """Resend OTP for registration"""
        try:
            email = sanitize_email(email)
            
            if User.query.filter_by(email=email).first():
                return False, "Email already registered"
            
            return OTPService.send_registration_otp(username, email)
            
        except Exception as e:
            print(f"Resend OTP error: {e}")
            return False, "An error occurred while resending OTP"

    @staticmethod
    def _send_welcome_email(user):
        """Send welcome email to new user"""
        try:
            subject = "Welcome to Our Platform!"
            html_body = get_welcome_email_template(user.username)
            text_body = f"Welcome {user.username}! Your account has been successfully created."
            send_email(subject, [user.email], text_body, html_body)
        except Exception as e:
            print(f"Welcome email error: {e}")
            # Don't fail registration if welcome email fails
