"""
Migration script for new features:
- Finding: assigned_to_user_id, due_date
- Audit: status
- FindingComment table
- ActivityLog table
- Notification table

This script adds the new columns and tables to the database.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine, Base
from app.models import (
    User, Organization, Project, Audit, Template, TemplateItem,
    Finding, Evidence, FindingComment, ActivityLog, Notification
)

def migrate():
    """Run migration to add new features"""
    print("🔄 Veritabanı migration başlatılıyor...\n")
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Add assigned_to_user_id and due_date to findings table
            print("1️⃣  Finding tablosuna assigned_to_user_id ve due_date kolonları ekleniyor...")
            try:
                conn.execute(text("""
                    ALTER TABLE findings 
                    ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_findings_assigned_to_user_id 
                    ON findings(assigned_to_user_id);
                """))
                print("   ✅ assigned_to_user_id kolonu eklendi")
            except Exception as e:
                print(f"   ⚠️  assigned_to_user_id zaten var veya hata: {e}")
            
            try:
                conn.execute(text("""
                    ALTER TABLE findings 
                    ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_findings_due_date 
                    ON findings(due_date);
                """))
                print("   ✅ due_date kolonu eklendi")
            except Exception as e:
                print(f"   ⚠️  due_date zaten var veya hata: {e}")
            
            # 2. Add status to audits table
            print("\n2️⃣  Audit tablosuna status kolonu ekleniyor...")
            try:
                # First check if status column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='audits' AND column_name='status';
                """))
                
                if result.fetchone() is None:
                    # Add status enum type if not exists
                    conn.execute(text("""
                        DO $$ BEGIN
                            CREATE TYPE auditstatus AS ENUM ('planning', 'in_progress', 'completed', 'cancelled');
                        EXCEPTION
                            WHEN duplicate_object THEN null;
                        END $$;
                    """))
                    
                    conn.execute(text("""
                        ALTER TABLE audits 
                        ADD COLUMN status auditstatus NOT NULL DEFAULT 'planning';
                    """))
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_audits_status 
                        ON audits(status);
                    """))
                    print("   ✅ status kolonu eklendi")
                else:
                    print("   ⚠️  status kolonu zaten var")
            except Exception as e:
                print(f"   ⚠️  status eklenirken hata: {e}")
            
            # 3. Create finding_comments table
            print("\n3️⃣  FindingComment tablosu oluşturuluyor...")
            try:
                FindingComment.__table__.create(engine, checkfirst=True)
                print("   ✅ FindingComment tablosu oluşturuldu")
            except Exception as e:
                print(f"   ⚠️  FindingComment tablosu zaten var veya hata: {e}")
            
            # 4. Create activity_logs table
            print("\n4️⃣  ActivityLog tablosu oluşturuluyor...")
            try:
                ActivityLog.__table__.create(engine, checkfirst=True)
                print("   ✅ ActivityLog tablosu oluşturuldu")
            except Exception as e:
                print(f"   ⚠️  ActivityLog tablosu zaten var veya hata: {e}")
            
            # 5. Create notifications table
            print("\n5️⃣  Notification tablosu oluşturuluyor...")
            try:
                # Create notification type enum if not exists
                conn.execute(text("""
                    DO $$ BEGIN
                        CREATE TYPE notificationtype AS ENUM (
                            'finding_assigned', 
                            'finding_due_soon', 
                            'finding_overdue', 
                            'finding_status_changed', 
                            'comment_added', 
                            'audit_status_changed'
                        );
                    EXCEPTION
                        WHEN duplicate_object THEN null;
                    END $$;
                """))
                
                Notification.__table__.create(engine, checkfirst=True)
                print("   ✅ Notification tablosu oluşturuldu")
            except Exception as e:
                print(f"   ⚠️  Notification tablosu zaten var veya hata: {e}")
            
            # 6. Add foreign key relationships if needed
            print("\n6️⃣  İlişkiler kontrol ediliyor...")
            try:
                # Finding.assigned_to relationship is already handled by foreign key
                # FindingComment.user relationship
                conn.execute(text("""
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'finding_comments_user_id_fkey'
                        ) THEN
                            ALTER TABLE finding_comments 
                            ADD CONSTRAINT finding_comments_user_id_fkey 
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                """))
                print("   ✅ FindingComment ilişkileri kontrol edildi")
            except Exception as e:
                print(f"   ⚠️  İlişki hatası: {e}")
            
            try:
                # ActivityLog.user relationship
                conn.execute(text("""
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'activity_logs_user_id_fkey'
                        ) THEN
                            ALTER TABLE activity_logs 
                            ADD CONSTRAINT activity_logs_user_id_fkey 
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                """))
                print("   ✅ ActivityLog ilişkileri kontrol edildi")
            except Exception as e:
                print(f"   ⚠️  İlişki hatası: {e}")
            
            try:
                # Notification.user relationship
                conn.execute(text("""
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'notifications_user_id_fkey'
                        ) THEN
                            ALTER TABLE notifications 
                            ADD CONSTRAINT notifications_user_id_fkey 
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                        END IF;
                    END $$;
                """))
                print("   ✅ Notification ilişkileri kontrol edildi")
            except Exception as e:
                print(f"   ⚠️  İlişki hatası: {e}")
            
            trans.commit()
            print("\n✅ Migration başarıyla tamamlandı!")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration hatası: {e}")
            raise

if __name__ == "__main__":
    migrate()
