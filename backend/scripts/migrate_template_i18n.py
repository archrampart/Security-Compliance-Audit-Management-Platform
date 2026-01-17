"""
Add English columns to templates and template_items tables
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine

def migrate_template_i18n():
    """Add English columns to templates and template_items tables."""
    print("🔄 Adding English columns to templates tables...")
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'templates' AND column_name = 'name_en'
        """))
        
        if result.fetchone():
            print("⚠️  English columns already exist. Skipping migration.")
            return
        
        # Add English columns to templates table
        conn.execute(text("""
            ALTER TABLE templates 
            ADD COLUMN name_en VARCHAR,
            ADD COLUMN description_en TEXT
        """))
        
        # Add English columns to template_items table
        conn.execute(text("""
            ALTER TABLE template_items 
            ADD COLUMN default_title_en VARCHAR,
            ADD COLUMN default_description_en TEXT,
            ADD COLUMN default_recommendation_en TEXT
        """))
        
        conn.commit()
        print("✅ English columns added successfully!")

if __name__ == "__main__":
    migrate_template_i18n()



