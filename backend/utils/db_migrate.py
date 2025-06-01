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
        
        # Get all existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        migrations_needed = []
        
        # User table migrations
        if 'user' in existing_tables:
            cursor.execute("PRAGMA table_info(user)")
            user_columns = [column[1] for column in cursor.fetchall()]
            
            if 'google_id' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN google_id VARCHAR(100)")
                
            if 'profile_picture' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)")
            
            if 'full_name' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN full_name VARCHAR(100)")
            
            if 'about' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN about TEXT")
                
            if 'notify_email' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN notify_email BOOLEAN DEFAULT 1")
                
            if 'notify_in_app' not in user_columns:
                migrations_needed.append("ALTER TABLE user ADD COLUMN notify_in_app BOOLEAN DEFAULT 1")
        
        # Project table migrations
        if 'project' in existing_tables:
            cursor.execute("PRAGMA table_info(project)")
            project_columns = [column[1] for column in cursor.fetchall()]
            
            if 'deadline' not in project_columns:
                migrations_needed.append("ALTER TABLE project ADD COLUMN deadline DATETIME")
                
            if 'project_image' not in project_columns:
                migrations_needed.append("ALTER TABLE project ADD COLUMN project_image VARCHAR(255) DEFAULT 'https://cdn-icons-png.flaticon.com/512/1087/1087927.png'")
        
        # Membership table migrations
        if 'membership' in existing_tables:
            cursor.execute("PRAGMA table_info(membership)")
            membership_columns = [column[1] for column in cursor.fetchall()]
            
            if 'is_editor' not in membership_columns:
                migrations_needed.append("ALTER TABLE membership ADD COLUMN is_editor BOOLEAN DEFAULT 0")
                
            if 'created_at' not in membership_columns:
                migrations_needed.append("ALTER TABLE membership ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        
        # Task table migrations
        if 'task' in existing_tables:
            cursor.execute("PRAGMA table_info(task)")
            task_columns = [column[1] for column in cursor.fetchall()]
            
            if 'priority' not in task_columns:
                migrations_needed.append("ALTER TABLE task ADD COLUMN priority VARCHAR(10) DEFAULT 'Medium'")
                
            if 'due_date' not in task_columns:
                migrations_needed.append("ALTER TABLE task ADD COLUMN due_date DATETIME")
                
            if 'estimated_hours' not in task_columns:
                migrations_needed.append("ALTER TABLE task ADD COLUMN estimated_hours INTEGER")
        
        # Message table migrations
        if 'message' in existing_tables:
            cursor.execute("PRAGMA table_info(message)")
            message_columns = [column[1] for column in cursor.fetchall()]
            
            if 'is_edited' not in message_columns:
                migrations_needed.append("ALTER TABLE message ADD COLUMN is_edited BOOLEAN DEFAULT 0")
                
            if 'edited_at' not in message_columns:
                migrations_needed.append("ALTER TABLE message ADD COLUMN edited_at DATETIME")
        
        # Execute migrations
        for migration in migrations_needed:
            print(f"Executing migration: {migration}")
            try:
                cursor.execute(migration)
            except sqlite3.Error as e:
                print(f"Migration failed: {migration} - Error: {e}")
                continue
        
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

def migrate_postgresql():
    """Handle PostgreSQL specific migrations using raw SQL"""
    database_url = os.getenv('DATABASE_URL', '')
    if 'postgresql' not in database_url:
        return
    
    from sqlalchemy import create_engine, text
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if isEditor column exists and rename it to is_editor
            try:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'membership' 
                    AND column_name IN ('isEditor', 'is_editor')
                """))
                existing_columns = [row[0] for row in result.fetchall()]
                
                if 'isEditor' in existing_columns and 'is_editor' not in existing_columns:
                    print("Renaming isEditor column to is_editor")
                    conn.execute(text('ALTER TABLE membership RENAME COLUMN "isEditor" TO is_editor'))
                    conn.commit()
                elif 'isEditor' not in existing_columns and 'is_editor' not in existing_columns:
                    print("Adding is_editor column")
                    conn.execute(text('ALTER TABLE membership ADD COLUMN is_editor BOOLEAN DEFAULT false'))
                    conn.commit()
                    
            except Exception as e:
                print(f"Column check/rename failed: {e}")
        
        postgresql_migrations = [
            # User table migrations
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS google_id VARCHAR(100)",
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255)",
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)",
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS about TEXT",
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true",
            "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS notify_in_app BOOLEAN DEFAULT true",
            
            # Project table migrations  
            "ALTER TABLE project ADD COLUMN IF NOT EXISTS deadline TIMESTAMP",
            "ALTER TABLE project ADD COLUMN IF NOT EXISTS project_image VARCHAR(255) DEFAULT 'https://cdn-icons-png.flaticon.com/512/1087/1087927.png'",
            
            # Membership table migrations (skip is_editor since we handled it above)
            "ALTER TABLE membership ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            
            # Task table migrations
            "ALTER TABLE task ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'Medium'",
            "ALTER TABLE task ADD COLUMN IF NOT EXISTS due_date TIMESTAMP",
            "ALTER TABLE task ADD COLUMN IF NOT EXISTS estimated_hours INTEGER",
            
            # Message table migrations
            "ALTER TABLE message ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false",
            "ALTER TABLE message ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP",
        ]
        
        with engine.connect() as conn:
            for migration in postgresql_migrations:
                try:
                    print(f"Executing PostgreSQL migration: {migration}")
                    conn.execute(text(migration))
                    conn.commit()
                except Exception as e:
                    print(f"PostgreSQL migration failed: {migration} - Error: {e}")
                    continue
                    
        print("PostgreSQL migrations completed")
        
    except Exception as e:
        print(f"PostgreSQL migration error: {e}")

def check_and_migrate():
    """Check if migrations are needed and apply them"""
    try:
        # Try to import User model to trigger any schema issues
        from models import User
        
        # Check if using PostgreSQL
        database_url = os.getenv('DATABASE_URL', '')
        if 'postgresql' in database_url:
            # For PostgreSQL, run specific migrations then ensure tables exist
            migrate_postgresql()
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
