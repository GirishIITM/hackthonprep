import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class."""
    USE_POSTGRESQL = os.getenv('USE_POSTGRESQL', 'false').lower() == 'true'
    SKIP_MIGRATION = os.getenv('SKIP_MIGRATION', 'false').lower() == 'true'
    
    def __init__(self):
        self.SQLALCHEMY_DATABASE_URI = self._get_database_uri()
    
    def _get_database_uri(self):
        """Get the appropriate database URI based on configuration."""
        if self.USE_POSTGRESQL:
            user = os.getenv('POSTGRES_USER', 'avnadmin')
            password = os.getenv('POSTGRES_PASSWORD', '')
            host = os.getenv('POSTGRES_HOST', 'pg-22c8a26c-linuxgaruda52-2ca9.g.aivencloud.com')
            port = os.getenv('POSTGRES_PORT', '14000')
            dbname = os.getenv('POSTGRES_DB', 'defaultdb')
            sslmode = os.getenv('POSTGRES_SSLMODE', 'require')
            return os.getenv(
                'DATABASE_URL',
                f'postgresql://{user}:{password}@{host}:{port}/{dbname}?sslmode={sslmode}'
            )
        else:
            return os.getenv('SQLITE_DATABASE_URL', 'sqlite:///app.db')
    
    # Set SQLALCHEMY_DATABASE_URI as class attribute for immediate access
    SQLALCHEMY_DATABASE_URI = None
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

    # Redis/Valkey configuration
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
    REDIS_HOST = os.getenv('REDIS_HOST', 'valkey-22d89841-linuxgaruda52-2ca9.g.aivencloud.com')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '14001'))
    REDIS_DB = int(os.getenv('REDIS_DB', '0'))
    REDIS_SSL = os.getenv('REDIS_SSL', 'true').lower() == 'true'
    REDIS_URL = os.getenv(
        'REDIS_URL',
        f"valkeys://default:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
    )

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    
    def __init__(self):
        super().__init__()

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # Force PostgreSQL in production
    USE_POSTGRESQL = True
    
    def __init__(self):
        super().__init__()

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    def __init__(self):
        # Don't call super().__init__() to keep the memory database
        pass

# Dictionary with all available configurations
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Get configuration based on environment
def get_config():
    flask_env = os.getenv('FLASK_ENV', 'development')
    config_class = config.get(flask_env, config['default'])
    return config_class()  # Return instance instead of class
