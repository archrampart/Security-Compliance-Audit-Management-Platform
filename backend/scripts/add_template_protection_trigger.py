"""
Veritabanı seviyesinde sistem şablonlarının silinmesini ve düzenlenmesini engelleyen trigger'lar oluşturur.
Bu, hem API hem de doğrudan SQL sorgularından silme ve düzenlemeyi engeller.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import SessionLocal, engine

def create_protection_trigger():
    """Sistem şablonlarının silinmesini ve düzenlenmesini engelleyen trigger'lar oluştur"""
    db = SessionLocal()
    try:
        print("🔒 Sistem şablon koruma trigger'ları oluşturuluyor...\n")
        
        # Drop existing triggers if exists
        drop_delete_trigger = text("""
            DROP TRIGGER IF EXISTS prevent_system_template_deletion ON templates;
        """)
        db.execute(drop_delete_trigger)
        
        drop_update_trigger = text("""
            DROP TRIGGER IF EXISTS prevent_system_template_update ON templates;
        """)
        db.execute(drop_update_trigger)
        
        # Create function to prevent deletion
        create_delete_function = text("""
            CREATE OR REPLACE FUNCTION prevent_system_template_deletion()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.is_system = TRUE THEN
                    RAISE EXCEPTION 'Sistem şablonu silinemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır. (ID: %)', OLD.id;
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        """)
        db.execute(create_delete_function)
        
        # Create function to prevent update
        create_update_function = text("""
            CREATE OR REPLACE FUNCTION prevent_system_template_update()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.is_system = TRUE THEN
                    RAISE EXCEPTION 'Sistem şablonu düzenlenemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır. (ID: %)', OLD.id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        db.execute(create_update_function)
        
        # Create DELETE trigger
        create_delete_trigger = text("""
            CREATE TRIGGER prevent_system_template_deletion
            BEFORE DELETE ON templates
            FOR EACH ROW
            EXECUTE FUNCTION prevent_system_template_deletion();
        """)
        db.execute(create_delete_trigger)
        
        # Create UPDATE trigger
        create_update_trigger = text("""
            CREATE TRIGGER prevent_system_template_update
            BEFORE UPDATE ON templates
            FOR EACH ROW
            EXECUTE FUNCTION prevent_system_template_update();
        """)
        db.execute(create_update_trigger)
        
        db.commit()
        print("✅ Sistem şablon koruma trigger'ları oluşturuldu!")
        print("   - API üzerinden silme engellenecek")
        print("   - API üzerinden düzenleme engellenecek")
        print("   - Doğrudan SQL sorgularından silme engellenecek")
        print("   - Doğrudan SQL sorgularından düzenleme engellenecek\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    create_protection_trigger()

