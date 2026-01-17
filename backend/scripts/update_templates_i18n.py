"""
Update existing templates with English translations
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.template import Template, TemplateItem
from app.models.audit import AuditStandard

# Import the templates data
from scripts.create_default_templates_full import TEMPLATES_DATA

def update_templates_i18n():
    """Update existing templates with English translations."""
    db: Session = SessionLocal()
    
    try:
        print("🔄 Updating templates with English translations...\n")
        
        updated_templates = 0
        updated_items = 0
        
        for standard_key, template_data in TEMPLATES_DATA.items():
            standard_enum = AuditStandard[standard_key]
            
            # Find existing template
            template = db.query(Template).filter(
                Template.standard == standard_enum
            ).first()
            
            if not template:
                print(f"⏭️  {template_data['name']} - Şablon bulunamadı, atlandı")
                continue
            
            # Update template name_en and description_en
            if template_data.get("name_en"):
                template.name_en = template_data["name_en"]
            if template_data.get("description_en"):
                template.description_en = template_data["description_en"]
            
            # Update template items
            for item_data in template_data["items"]:
                item = db.query(TemplateItem).filter(
                    TemplateItem.template_id == template.id,
                    TemplateItem.order_number == item_data["order_number"]
                ).first()
                
                if item:
                    # Update English fields
                    if item_data.get("default_title_en"):
                        item.default_title_en = item_data["default_title_en"]
                    if item_data.get("default_description_en"):
                        item.default_description_en = item_data["default_description_en"]
                    if item_data.get("default_recommendation_en"):
                        item.default_recommendation_en = item_data["default_recommendation_en"]
                    updated_items += 1
                else:
                    # Item doesn't exist, create it
                    item = TemplateItem(
                        template_id=template.id,
                        order_number=item_data["order_number"],
                        control_reference=item_data.get("control_reference"),
                        default_title=item_data["default_title"],
                        default_title_en=item_data.get("default_title_en"),
                        default_description=item_data.get("default_description"),
                        default_description_en=item_data.get("default_description_en"),
                        default_severity=item_data.get("default_severity"),
                        default_status=item_data.get("default_status"),
                        default_recommendation=item_data.get("default_recommendation"),
                        default_recommendation_en=item_data.get("default_recommendation_en")
                    )
                    db.add(item)
                    updated_items += 1
            
            db.commit()
            print(f"✅ {template_data['name']} - {len(template_data['items'])} item güncellendi")
            updated_templates += 1
        
        print(f"\n{'='*60}")
        print(f"✅ Toplam {updated_templates} şablon güncellendi")
        print(f"✅ Toplam {updated_items} item güncellendi")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_templates_i18n()

