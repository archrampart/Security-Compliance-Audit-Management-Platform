"""
İlk platform admin kullanıcısı oluşturma scripti
Kullanım: python scripts/create_admin.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.core.security import get_password_hash

def create_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.role == UserRole.PLATFORM_ADMIN).first()
        if admin:
            print(f"Platform admin zaten mevcut: {admin.email}")
            return
        
        # Create admin user
        email = input("Admin e-posta adresi: ")
        password = input("Admin şifresi: ")
        full_name = input("Admin tam adı: ")
        
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=UserRole.PLATFORM_ADMIN,
            is_active=True,
            organization_id=None
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✅ Platform admin kullanıcısı oluşturuldu!")
        print(f"E-posta: {admin.email}")
        print(f"Ad: {admin.full_name}")
        print(f"Rol: {admin.role.value}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

