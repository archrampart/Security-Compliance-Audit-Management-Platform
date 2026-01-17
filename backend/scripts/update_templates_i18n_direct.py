"""
Update existing templates with English translations using direct SQL
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine

# Import the templates data
from scripts.create_default_templates_full import TEMPLATES_DATA
from app.models.audit import AuditStandard

def update_templates_i18n_direct():
    """Update existing templates with English translations using direct SQL."""
    
    with engine.connect() as conn:
        print("🔄 Updating templates with English translations (direct SQL)...\n")
        
        updated_templates = 0
        updated_items = 0
        
        for standard_key, template_data in TEMPLATES_DATA.items():
            standard_enum = AuditStandard[standard_key]
            
            # Update template name_en and description_en using direct SQL
            if template_data.get("name_en") or template_data.get("description_en"):
                update_query = "UPDATE templates SET "
                params = {}
                
                if template_data.get("name_en"):
                    update_query += "name_en = :name_en"
                    params["name_en"] = template_data["name_en"]
                
                if template_data.get("description_en"):
                    if params:
                        update_query += ", "
                    update_query += "description_en = :description_en"
                    params["description_en"] = template_data["description_en"]
                
                update_query += " WHERE standard = :standard"
                params["standard"] = standard_enum.value
                
                # Temporarily disable trigger
                conn.execute(text("ALTER TABLE templates DISABLE TRIGGER prevent_system_template_update"))
                
                try:
                    result = conn.execute(text(update_query), params)
                    conn.commit()
                    
                    if result.rowcount > 0:
                        print(f"✅ {template_data['name']} - Template bilgileri güncellendi")
                        updated_templates += 1
                finally:
                    # Re-enable trigger
                    conn.execute(text("ALTER TABLE templates ENABLE TRIGGER prevent_system_template_update"))
                    conn.commit()
            
            # Update template items
            # Get template id
            template_result = conn.execute(text("""
                SELECT id FROM templates WHERE standard = :standard LIMIT 1
            """), {"standard": standard_enum.value})
            
            template_row = template_result.fetchone()
            if not template_row:
                print(f"⏭️  {template_data['name']} - Şablon bulunamadı, atlandı")
                continue
            
            template_id = template_row[0]
            
            # Update each item
            for item_data in template_data["items"]:
                # Check if item exists
                item_result = conn.execute(text("""
                    SELECT id FROM template_items 
                    WHERE template_id = :template_id AND order_number = :order_number
                """), {
                    "template_id": template_id,
                    "order_number": item_data["order_number"]
                })
                
                item_row = item_result.fetchone()
                
                if item_row:
                    # Update existing item
                    update_item_query = "UPDATE template_items SET "
                    item_params = {}
                    
                    if item_data.get("default_title_en"):
                        update_item_query += "default_title_en = :default_title_en"
                        item_params["default_title_en"] = item_data["default_title_en"]
                    
                    if item_data.get("default_description_en"):
                        if item_params:
                            update_item_query += ", "
                        update_item_query += "default_description_en = :default_description_en"
                        item_params["default_description_en"] = item_data["default_description_en"]
                    
                    if item_data.get("default_recommendation_en"):
                        if item_params:
                            update_item_query += ", "
                        update_item_query += "default_recommendation_en = :default_recommendation_en"
                        item_params["default_recommendation_en"] = item_data["default_recommendation_en"]
                    
                    if item_params:
                        update_item_query += " WHERE template_id = :template_id AND order_number = :order_number"
                        item_params["template_id"] = template_id
                        item_params["order_number"] = item_data["order_number"]
                        
                        conn.execute(text(update_item_query), item_params)
                        conn.commit()
                        updated_items += 1
        
        print(f"\n{'='*60}")
        print(f"✅ Toplam {updated_templates} şablon güncellendi")
        print(f"✅ Toplam {updated_items} item güncellendi")
        print(f"✅ Güncelleme tamamlandı!")

if __name__ == "__main__":
    update_templates_i18n_direct()

