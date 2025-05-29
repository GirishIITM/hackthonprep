from google.auth.transport import requests
from google.oauth2 import id_token
import os

def verify_google_token(token):
    """
    Verify Google OAuth token and return user info
    Args:
        token (str): Google OAuth ID token
    Returns:
        dict: User information if valid, None if invalid
    """
    try:
        # Get client ID from environment variable
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        # Optionally get client secret if needed for other flows
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        if not client_id:
            print("GOOGLE_CLIENT_ID not found in environment variables")
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
            'email_verified': idinfo.get('email_verified', False),
            # Optionally include client_secret if needed elsewhere
            # 'client_secret': client_secret
        }
        
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        return None
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None

def get_google_client_id():
    """Get Google OAuth client ID from environment variable"""
    try:
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        if not client_id:
            print("GOOGLE_CLIENT_ID not found in environment variables")
            return None
        return client_id
    except Exception as e:
        print(f"Error reading Google client ID: {e}")
        return None

def get_google_client_secret():
    """Get Google OAuth client secret from environment variable"""
    try:
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        if not client_secret:
            print("GOOGLE_CLIENT_SECRET not found in environment variables")
            return None
        return client_secret
    except Exception as e:
        print(f"Error reading Google client secret: {e}")
        return None
