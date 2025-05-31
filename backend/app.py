from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import cloudinary
import os

from sqlalchemy import false
from config import get_config
from extensions import db, jwt, bcrypt, mail, init_redis
from models import User, TokenBlocklist
from routes import register_blueprints
from utils.gmail import initialize_gmail_credentials
from utils.postgresql_migrator import migrate_sqlite_to_postgresql, check_postgresql_connection

load_dotenv()

def create_app(config_class=None):
    """Application factory pattern."""
    app = Flask(__name__)
    
    if config_class is None:
        config_instance = get_config()
    else:
        config_instance = config_class() if isinstance(config_class, type) else config_class
    
    app.config.from_object(config_instance)
    
    CORS(app, 
         origins="*", 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials", "X-Requested-With"],  
         supports_credentials=False)  
    
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    init_redis(app)  # Initialize Redis
    
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )
    
    register_blueprints(app)
    
    # Register JWT token blocklist callback
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        token = TokenBlocklist.query.filter_by(jti=jti).first()
        return token is not None
    
    with app.app_context():
        # Handle database setup based on flags
        use_postgresql = getattr(config_instance, 'USE_POSTGRESQL', False)
        skip_migration = getattr(config_instance, 'SKIP_MIGRATION', False)
        
        try:
            if skip_migration:
                # Direct database usage without migration checks
                if use_postgresql:
                    print("Using PostgreSQL database (direct mode)")
                else:
                    print("Using SQLite database (direct mode)")
                db.create_all()
                print("Database tables created/verified")
            else:
                # Legacy migration-aware mode
                database_url = app.config.get('SQLALCHEMY_DATABASE_URI')
                
                if use_postgresql and 'postgresql' in database_url:
                    print("Using PostgreSQL database...")
                    
                    # Always create tables first
                    db.create_all()
                    print("PostgreSQL tables created/verified")
                    
                    # Check connection and migrate if possible
                    if check_postgresql_connection():
                        print("PostgreSQL connection verified")
                        # Try to migrate data from SQLite if it exists (non-blocking)
                        migrate_sqlite_to_postgresql()
                    else:
                        print("PostgreSQL connection issues - falling back to SQLite")
                        # Fallback to SQLite if PostgreSQL fails
                        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
                        db.create_all()
                
                else:
                    print("Using SQLite database...")
                    db.create_all()
            
            # Initialize Gmail credentials (non-blocking)
            try:
                initialize_gmail_credentials()
            except Exception as e:
                print(f"Gmail initialization warning: {e}")
                
        except Exception as e:
            print(f"Database setup warning: {e}")
            print("App will continue with limited functionality")
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)

