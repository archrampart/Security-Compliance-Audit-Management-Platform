"""
Foreign key constraint'lerini CASCADE DELETE olacak şekilde güncelleme scripti
Bu script mevcut foreign key constraint'lerini CASCADE DELETE yapmak için yeniden oluşturur.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import SessionLocal, engine

def fix_foreign_keys():
    """Mevcut foreign key constraint'lerini CASCADE DELETE olacak şekilde güncelle"""
    db = SessionLocal()
    try:
        print("🔧 Foreign key constraint'leri güncelleniyor...\n")
        
        # List of foreign keys to update
        # Format: (table_name, constraint_name, column, referenced_table, referenced_column)
        foreign_keys = [
            ("audits", "audits_project_id_fkey", "project_id", "projects", "id"),
            ("findings", "findings_audit_id_fkey", "audit_id", "audits", "id"),
            ("evidences", "evidences_finding_id_fkey", "finding_id", "findings", "id"),
            ("project_user_assignments", "project_user_assignments_project_id_fkey", "project_id", "projects", "id"),
            ("project_user_assignments", "project_user_assignments_user_id_fkey", "user_id", "users", "id"),
            ("project_users", "project_users_project_id_fkey", "project_id", "projects", "id"),
            ("project_users", "project_users_user_id_fkey", "user_id", "users", "id"),
        ]
        
        for table, constraint, column, ref_table, ref_column in foreign_keys:
            try:
                # Check if constraint exists
                check_constraint = text(f"""
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE constraint_name = :constraint_name 
                    AND table_name = :table_name
                """)
                result = db.execute(check_constraint, {
                    "constraint_name": constraint,
                    "table_name": table
                }).fetchone()
                
                if result:
                    print(f"📝 {table}.{constraint} güncelleniyor...")
                    
                    # Drop existing constraint
                    drop_constraint = text(f"""
                        ALTER TABLE {table} 
                        DROP CONSTRAINT IF EXISTS {constraint}
                    """)
                    db.execute(drop_constraint)
                    
                    # Add new constraint with CASCADE
                    add_constraint = text(f"""
                        ALTER TABLE {table} 
                        ADD CONSTRAINT {constraint} 
                        FOREIGN KEY ({column}) 
                        REFERENCES {ref_table}({ref_column}) 
                        ON DELETE CASCADE
                    """)
                    db.execute(add_constraint)
                    
                    print(f"   ✅ {constraint} CASCADE DELETE olarak güncellendi")
                else:
                    print(f"   ⚠️  {constraint} bulunamadı (atlandı)")
                    
            except Exception as e:
                print(f"   ❌ {constraint} güncellenirken hata: {e}")
                # Continue with other constraints
        
        db.commit()
        print(f"\n✅ Foreign key constraint'leri güncellendi!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    fix_foreign_keys()





