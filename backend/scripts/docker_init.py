"""
Docker initialization script for backend
Creates database tables, runs migrations, creates default templates and admin user
"""
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.template import Template
from app.core.security import get_password_hash

def init_database():
    """Initialize database - create tables"""
    print("📊 Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created!")
    except Exception as e:
        print(f"⚠️  Error creating tables: {e}")
        raise

def run_migrations():
    """Run database migrations"""
    if os.path.exists("scripts/migrate_new_features.py"):
        print("🔄 Running migrations...")
        try:
            import subprocess
            result = subprocess.run(
                ["python", "scripts/migrate_new_features.py"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("✅ Migrations completed!")
            else:
                print("⚠️  Migration script output:")
                print(result.stdout)
                print(result.stderr)
        except Exception as e:
            print(f"⚠️  Migration error: {e}")

def create_default_templates():
    """Create default templates if they don't exist"""
    if os.path.exists("scripts/create_default_templates_full.py"):
        print("📋 Checking default templates...")
        db: Session = SessionLocal()
        try:
            template_count = db.query(Template).filter(Template.is_system == True).count()
            if template_count == 0:
                print("   Creating default templates...")
                import subprocess
                result = subprocess.run(
                    ["python", "scripts/create_default_templates_full.py"],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print("✅ Default templates created!")
                else:
                    print("⚠️  Template creation output:")
                    print(result.stdout)
                    print(result.stderr)
            else:
                print(f"✅ {template_count} default templates already exist")
        except Exception as e:
            print(f"⚠️  Template creation error: {e}")
        finally:
            db.close()

def create_admin_user():
    """Create admin user from environment variables"""
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    admin_name = os.environ.get("ADMIN_NAME")
    
    if not admin_email or not admin_password or not admin_name:
        print("⚠️  Admin user not created (set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars)")
        return
    
    print("👤 Creating admin user...")
    db: Session = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.role == UserRole.PLATFORM_ADMIN).first()
        if admin:
            print(f"ℹ️  Admin user already exists: {admin.email}")
            return
        
        # Create admin user
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            full_name=admin_name,
            role=UserRole.PLATFORM_ADMIN,
            is_active=True,
            organization_id=None
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✅ Admin user created: {admin.email}")
    except Exception as e:
        db.rollback()
        print(f"⚠️  Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Backend initialization starting...")
    print("")
    
    # Wait for database to be ready
    print("⏳ Waiting for database...")
    import time
    max_retries = 30
    retry_count = 0
    while retry_count < max_retries:
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            print("✅ Database is ready!")
            break
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"❌ Database connection failed after {max_retries} retries!")
                print(f"   Error: {e}")
                sys.exit(1)
            print(f"   Retry {retry_count}/{max_retries}...")
            time.sleep(1)
    
    print("")
    
    try:
        # Initialize database
        init_database()
        print("")
        
        # Run migrations
        run_migrations()
        print("")
        
        # Create default templates
        create_default_templates()
        print("")
        
        # Create admin user
        create_admin_user()
        print("")
        
        print("✅ Backend initialization complete!")
    except Exception as e:
        print(f"")
        print(f"❌ Initialization failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

