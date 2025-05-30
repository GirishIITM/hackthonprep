import sqlite3
import os
from extensions import db

def migrate_database():
    """Handle database migrations for schema changes"""
    db_path = 'instance/app.db'  # Default SQLite path for Flask
    
    # Check if we're using SQLite and if the database file exists
    if not os.path.exists(db_path):
        print("Database file not found. Creating new database...")
        return
    
    try:
        # Check if we're using PostgreSQL
        database_url = os.getenv('DATABASE_URL', '')
        if 'postgresql' in database_url:
            print("PostgreSQL detected - using SQLAlchemy migrations")
            # For PostgreSQL, use SQLAlchemy migrations instead of direct SQL
            try:
                from models import User
                db.create_all()
                print("PostgreSQL schema updated successfully")
                return
            except Exception as e:
                print(f"PostgreSQL migration error: {e}")
                return
        
        # SQLite migration logic
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if google_id column exists
        cursor.execute("PRAGMA table_info(user)")
        columns = [column[1] for column in cursor.fetchall()]
        
        migrations_needed = []
        
        if 'google_id' not in columns:
            migrations_needed.append("ALTER TABLE user ADD COLUMN google_id VARCHAR(100)")
            
        if 'profile_picture' not in columns:
            migrations_needed.append("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)")
        
        if 'full_name' not in columns:
            migrations_needed.append("ALTER TABLE user ADD COLUMN full_name VARCHAR(100)")
        
        if 'about' not in columns:
            migrations_needed.append("ALTER TABLE user ADD COLUMN about TEXT")
        
        # Execute migrations
        for migration in migrations_needed:
            print(f"Executing migration: {migration}")
            cursor.execute(migration)
        
        if migrations_needed:
            conn.commit()
            print(f"Successfully applied {len(migrations_needed)} migrations")
        else:
            print("No migrations needed")
        
        conn.close()
        
    except Exception as e:
        print(f"Migration error: {e}")
        print("Falling back to recreating database...")
        # If migration fails, remove the database file so it gets recreated
        if os.path.exists(db_path):
            os.remove(db_path)
        print("Database file removed. Will be recreated on next startup.")

def check_and_migrate():
    """Check if migrations are needed and apply them"""
    try:
        # Try to import User model to trigger any schema issues
        from models import User
        
        # Check if using PostgreSQL
        database_url = os.getenv('DATABASE_URL', '')
        if 'postgresql' in database_url:
            # For PostgreSQL, just ensure tables exist
            db.create_all()
            return False
        
        # SQLite migration check
        with db.engine.connect() as conn:
            result = conn.execute(db.text("SELECT sql FROM sqlite_master WHERE type='table' AND name='user'"))
            table_schema = result.fetchone()
            
            if table_schema:
                schema_sql = table_schema[0]
                if 'google_id' not in schema_sql or 'profile_picture' not in schema_sql or 'full_name' not in schema_sql:
                    print("Schema mismatch detected. Running migrations...")
                    migrate_database()
                    return True
        
        return False
        
    except Exception as e:
        print(f"Schema check failed: {e}")
        migrate_database()
        return True
