from datetime import datetime, timedelta
from utils.redis_utils import RedisCache
from flask_jwt_extended import decode_token

class RedisTokenService:
    """Redis-based token blacklisting service"""
    
    BLACKLIST_PREFIX = "blacklisted_token:"
    DEFAULT_EXPIRATION = 86400  # 24 hours
    
    @staticmethod
    def _get_blacklist_key(jti):
        """Generate Redis key for blacklisted token"""
        return f"{RedisTokenService.BLACKLIST_PREFIX}{jti}"
    
    @staticmethod
    def blacklist_token(jti, token_type="access", expiration=None):
        """Add a token to the blacklist"""
        try:
            if expiration is None:
                expiration = RedisTokenService.DEFAULT_EXPIRATION
            
            blacklist_key = RedisTokenService._get_blacklist_key(jti)
            token_data = {
                "jti": jti,
                "type": token_type,
                "blacklisted_at": datetime.utcnow().isoformat()
            }
            
            success = RedisCache.set(blacklist_key, token_data, expiration)
            return success
            
        except Exception as e:
            print(f"Error blacklisting token: {e}")
            return False
    
    @staticmethod
    def is_token_blacklisted(jti):
        """Check if a token is blacklisted"""
        try:
            blacklist_key = RedisTokenService._get_blacklist_key(jti)
            token_data = RedisCache.get(blacklist_key)
            return token_data is not None
            
        except Exception as e:
            print(f"Error checking token blacklist: {e}")
            return False
    
    @staticmethod
    def get_blacklisted_token_info(jti):
        """Get information about a blacklisted token"""
        try:
            blacklist_key = RedisTokenService._get_blacklist_key(jti)
            return RedisCache.get(blacklist_key)
            
        except Exception as e:
            print(f"Error getting blacklisted token info: {e}")
            return None
    
    @staticmethod
    def remove_from_blacklist(jti):
        """Remove a token from the blacklist"""
        try:
            blacklist_key = RedisTokenService._get_blacklist_key(jti)
            return RedisCache.delete(blacklist_key)
            
        except Exception as e:
            print(f"Error removing token from blacklist: {e}")
            return False
    
    @staticmethod
    def blacklist_user_tokens(user_id, token_type=None):
        """Blacklist all tokens for a specific user (for logout all devices)"""
        try:
            # This would require storing active tokens per user
            # For now, we'll implement a user-specific blacklist
            user_blacklist_key = f"user_blacklist:{user_id}"
            blacklist_data = {
                "user_id": user_id,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "type": token_type or "all"
            }
            
            # Set with a longer expiration for user blacklists
            success = RedisCache.set(user_blacklist_key, blacklist_data, 604800)  # 7 days
            return success
            
        except Exception as e:
            print(f"Error blacklisting user tokens: {e}")
            return False
    
    @staticmethod
    def is_user_blacklisted(user_id):
        """Check if all tokens for a user are blacklisted"""
        try:
            user_blacklist_key = f"user_blacklist:{user_id}"
            blacklist_data = RedisCache.get(user_blacklist_key)
            return blacklist_data is not None
            
        except Exception as e:
            print(f"Error checking user blacklist: {e}")
            return False
