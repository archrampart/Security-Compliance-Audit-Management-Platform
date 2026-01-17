"""
Template organization_id'yi nullable yapar ve sistem şablonlarının organization_id'sini null yapar.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import SessionLocal, engine

def migrate_template_organization_nullable():
    """Make organization_id nullable and set system templates' organization_id to null."""
    db = SessionLocal()
    try:
        print("🔧 Template organization_id nullable migration başlatılıyor...\n")
        
        # Step 1: Make organization_id nullable
        print("1️⃣  organization_id kolonu nullable yapılıyor...")
        alter_column = text("""
            ALTER TABLE templates 
            ALTER COLUMN organization_id DROP NOT NULL;
        """)
        db.execute(alter_column)
        db.commit()
        print("   ✅ organization_id kolonu nullable yapıldı\n")
        
        # Step 2: Set system templates' organization_id to null
        print("2️⃣  Sistem şablonlarının organization_id'si null yapılıyor...")
        
        # Temporarily disable trigger to allow updating system templates
        disable_trigger = text("""
            ALTER TABLE templates DISABLE TRIGGER prevent_system_template_update;
        """)
        db.execute(disable_trigger)
        db.commit()
        print("   ⚠️  Sistem şablon koruma trigger'ı geçici olarak devre dışı bırakıldı")
        
        try:
            update_system_templates = text("""
                UPDATE templates
                SET organization_id = NULL
                WHERE is_system = TRUE;
            """)
            result = db.execute(update_system_templates)
            db.commit()
            updated_count = result.rowcount
            print(f"   ✅ {updated_count} sistem şablonunun organization_id'si null yapıldı")
        finally:
            # Re-enable trigger
            enable_trigger = text("""
                ALTER TABLE templates ENABLE TRIGGER prevent_system_template_update;
            """)
            db.execute(enable_trigger)
            db.commit()
            print("   ✅ Sistem şablon koruma trigger'ı yeniden etkinleştirildi\n")
        
        print("✅ Migration tamamlandı!\n")
        print("📋 Özet:")
        print(f"   - organization_id kolonu nullable yapıldı")
        print(f"   - {updated_count} sistem şablonunun organization_id'si null yapıldı")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    migrate_template_organization_nullable()

