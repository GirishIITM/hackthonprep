from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail
import valkey

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
mail = Mail()
redis_client = None

def init_redis(app):
    """Initialize Redis client with app configuration."""
    global redis_client
    try:
        redis_url = app.config.get('REDIS_URL')
        if redis_url:
            redis_client = valkey.from_url(redis_url, decode_responses=True)
            # Test connection
            redis_client.ping()
            app.logger.info("Redis connection established successfully")
        else:
            app.logger.warning("Redis URL not configured")
    except Exception as e:
        app.logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None
