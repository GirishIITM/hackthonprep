from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import cloudinary
import os
from config import get_config
from extensions import db, jwt, bcrypt, mail
from models import User, TokenBlocklist
from routes import register_blueprints
from utils.gmail import initialize_gmail_credentials
from utils.db_migrate import check_and_migrate

load_dotenv()

def create_app(config_class=None):
    """Application factory pattern."""
    app = Flask(__name__)
    
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    CORS(app, 
         origins="*", 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],  
         supports_credentials=True)  
    
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
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
        # Check and run migrations before creating tables
        migration_needed = check_and_migrate()
        
        if migration_needed:
            # If migration was needed, recreate all tables
            db.drop_all()
            db.create_all()
            print("Database recreated with new schema")
        else:
            # Normal table creation for new databases
            db.create_all()
        
        initialize_gmail_credentials()
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)

