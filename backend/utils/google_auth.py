import json
from google.auth.transport import requests
from google.oauth2 import id_token
import os
from flask import current_app

def verify_google_token(token):
    """
    Verify Google OAuth token and return user info
    Args:
        token (str): Google OAuth ID token
    Returns:
        dict: User information if valid, None if invalid
    """
    try:
        client_id = current_app.config['GOOGLE_CLIENT_ID']
        if not client_id:
            print("Google Client ID not configured in the application.")
            return None
        
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            client_id
        )
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        # Return user info
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'given_name': idinfo.get('given_name', ''),
            'family_name': idinfo.get('family_name', ''),
            'picture': idinfo.get('picture', ''),
            'email_verified': idinfo.get('email_verified', False)
        }
        
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        return None
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None

def get_google_client_id():
    """Get Google OAuth client ID from app config"""
    try:
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        if not client_id:
            print("Google Client ID not found in app configuration.")
            return None
        return client_id
    except Exception as e:
        print(f"Error reading client ID from app config: {e}")
        return None
