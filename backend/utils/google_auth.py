import json
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
        # Load OAuth client secrets (different from Gmail API secrets)
        oauth_secrets_path = 'oauth_client_secrets.json'
        if not os.path.exists(oauth_secrets_path):
            print(f"OAuth client secrets file not found at {oauth_secrets_path}")
            return None
            
        with open(oauth_secrets_path, 'r') as f:
            client_secrets = json.load(f)
        
        # For OAuth, the structure is different
        client_id = client_secrets['web']['client_id']
        
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
    """Get Google OAuth client ID from OAuth secrets file"""
    try:
        oauth_secrets_path = 'oauth_client_secrets.json'
        if not os.path.exists(oauth_secrets_path):
            print(f"OAuth client secrets file not found at {oauth_secrets_path}")
            return None
            
        with open(oauth_secrets_path, 'r') as f:
            client_secrets = json.load(f)
        return client_secrets['web']['client_id']
    except Exception as e:
        print(f"Error reading OAuth client secrets: {e}")
        return None
