"""
Şablonları Türkçe'den İngilizce'ye çevirme scripti
KVKK şablonu hariç tüm şablonları çevirir.

Kullanım:
    export OPENAI_API_KEY="your-api-key"
    python backend/scripts/translate_templates.py

Veya .env dosyasına ekleyin:
    OPENAI_API_KEY=your-api-key
"""
import sys
import os
import re
import json
import time
from typing import Dict, List, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import openai
    from openai import OpenAI
except ImportError:
    print("❌ OpenAI kütüphanesi bulunamadı. Yüklemek için:")
    print("   pip install openai")
    sys.exit(1)

# Load OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("❌ OPENAI_API_KEY environment variable bulunamadı.")
    print("   export OPENAI_API_KEY='your-api-key'")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Model to use (GPT-3.5 Turbo - economical option)
MODEL = "gpt-3.5-turbo"

def translate_text(text: str, context: str = "") -> str:
    """
    Translate Turkish text to English using OpenAI API.
    """
    if not text or not text.strip():
        return text
    
    # Check if text contains Turkish characters
    turkish_chars = set('çğıöşüÇĞIİÖŞÜ')
    if not any(char in text for char in turkish_chars):
        # Already in English or no Turkish content
        return text
    
    prompt = f"""Translate the following Turkish text to professional English. 
Maintain the same tone and technical terminology appropriate for security audit documentation.

Context: {context}

Turkish text:
{text}

English translation:"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a professional translator specializing in security audit and compliance documentation."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        translated = response.choices[0].message.content.strip()
        return translated
    except Exception as e:
        print(f"⚠️  Translation error for text '{text[:50]}...': {e}")
        return text  # Return original on error

def parse_template_file(file_path: str) -> Dict[str, Any]:
    """
    Parse the template file and extract TEMPLATES_DATA dictionary by reading directly.
    """
    # Import template file as module (simpler approach)
    import importlib.util
    
    spec = importlib.util.spec_from_file_location("template_module", file_path)
    if spec is None or spec.loader is None:
        raise ValueError(f"Cannot load template file: {file_path}")
    
    # Need to handle the imports in the template file
    # Let's manually parse it instead for safety
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple extraction: find templates by key pattern
    templates_data = {}
    
    # Find all template keys
    template_keys = re.findall(r'"([A-Z_]+)":\s*\{', content)
    
    for key in template_keys:
        if key == 'KVKK':
            continue  # Skip KVKK
        
        # Find template block
        pattern = rf'"{re.escape(key)}":\s*\{{'
        match = re.search(pattern, content)
        if not match:
            continue
        
        # Extract template name and description
        name_match = re.search(r'"name":\s*"([^"]*)"', content[match.start():match.start()+2000])
        desc_match = re.search(r'"description":\s*"([^"]*)"', content[match.start():match.start()+2000])
        
        if name_match and desc_match:
            template_data = {
                "name": name_match.group(1),
                "description": desc_match.group(1),
                "items": []
            }
            
            # Extract items (find all order_number patterns)
            item_pattern = r'"order_number":\s*(\d+)'
            item_matches = list(re.finditer(item_pattern, content[match.start():match.start()+50000]))
            
            for item_match in item_matches:
                item_start = match.start() + item_match.start()
                
                # Extract item fields
                item_text = content[item_start:item_start+2000]
                
                order_num = int(item_match.group(1))
                control_ref_match = re.search(r'"control_reference":\s*"([^"]*)"', item_text)
                title_match = re.search(r'"default_title":\s*"([^"]*)"', item_text)
                desc_item_match = re.search(r'"default_description":\s*"([^"]*)"', item_text)
                rec_match = re.search(r'"default_recommendation":\s*"([^"]*)"', item_text)
                
                if title_match:
                    item_data = {
                        "order_number": order_num,
                        "control_reference": control_ref_match.group(1) if control_ref_match else None,
                        "default_title": title_match.group(1),
                        "default_description": desc_item_match.group(1) if desc_item_match else "",
                        "default_recommendation": rec_match.group(1) if rec_match else "",
                        "default_severity": "HIGH",  # Default, will be read from file if needed
                        "default_status": "OPEN"
                    }
                    template_data["items"].append(item_data)
            
            templates_data[key] = template_data
    
    return templates_data

def translate_template(template_data: Dict[str, Any], standard_key: str) -> Dict[str, Any]:
    """
    Translate a single template from Turkish to English.
    """
    print(f"\n📋 Translating {standard_key} template...")
    
    # Translate template name and description
    translated = {
        "name": template_data.get("name", ""),
        "name_en": translate_text(template_data.get("name", ""), f"Template name for {standard_key}"),
        "description": template_data.get("description", ""),
        "description_en": translate_text(template_data.get("description", ""), f"Template description for {standard_key}"),
        "items": []
    }
    
    # Translate items
    items = template_data.get("items", [])
    total_items = len(items)
    
    for idx, item in enumerate(items, 1):
        print(f"  [{idx}/{total_items}] Translating item {item.get('order_number', idx)}...")
        
        translated_item = {
            "order_number": item.get("order_number"),
            "control_reference": item.get("control_reference"),
            "default_title": item.get("default_title", ""),
            "default_title_en": translate_text(
                item.get("default_title", ""),
                f"Control title for {item.get('control_reference', 'control')}"
            ) if item.get("default_title") else "",
            "default_description": item.get("default_description", ""),
            "default_description_en": translate_text(
                item.get("default_description", ""),
                f"Control description for {item.get('control_reference', 'control')}"
            ) if item.get("default_description") else "",
            "default_severity": item.get("default_severity"),
            "default_status": item.get("default_status"),
            "default_recommendation": item.get("default_recommendation", ""),
            "default_recommendation_en": translate_text(
                item.get("default_recommendation", ""),
                f"Recommendation for {item.get('control_reference', 'control')}"
            ) if item.get("default_recommendation") else "",
        }
        
        translated["items"].append(translated_item)
        
        # Rate limiting - small delay between requests
        time.sleep(0.1)
    
    print(f"✅ {standard_key} template translated ({total_items} items)")
    return translated

def escape_string(s: str) -> str:
    """Escape string for Python code."""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

def update_template_file(file_path: str, translated_templates: Dict[str, Dict[str, Any]]):
    """
    Update the template file with English translations.
    Uses line-by-line approach for safer updates.
    """
    print(f"\n📝 Updating template file: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Create backup
    backup_path = file_path + '.backup'
    print(f"💾 Creating backup: {backup_path}")
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    new_lines = []
    i = 0
    in_template = None
    in_item = False
    current_item_order = None
    item_start_line = None
    template_name_line = None
    template_desc_line = None
    
    while i < len(lines):
        line = lines[i]
        
        # Check if we're entering a template (skip KVKK)
        template_match = re.search(r'"([A-Z_]+)":\s*\{', line)
        if template_match:
            template_key = template_match.group(1)
            if template_key == 'KVKK':
                in_template = None
                print(f"  ⏭️  Skipping KVKK template updates")
            elif template_key in translated_templates:
                in_template = template_key
                print(f"  📋 Processing {template_key} template...")
                translated = translated_templates[template_key]
                # Will add name_en and description_en after we find them
                template_name_line = None
                template_desc_line = None
            else:
                in_template = None
        
        # Track template name and description lines
        if in_template and in_template in translated_templates:
            translated = translated_templates[in_template]
            
            # Find name line
            name_match = re.search(r'"name":\s*"([^"]*)"', line)
            if name_match and '"name_en"' not in line:
                template_name_line = i
                new_lines.append(line)
                # Add name_en on next line
                indent = len(line) - len(line.lstrip())
                name_en = escape_string(translated["name_en"])
                new_lines.append(' ' * indent + f'"name_en": "{name_en}",\n')
                i += 1
                continue
            
            # Find description line
            desc_match = re.search(r'"description":\s*"([^"]*)"', line)
            if desc_match and '"description_en"' not in line:
                template_desc_line = i
                new_lines.append(line)
                # Add description_en on next line
                indent = len(line) - len(line.lstrip())
                desc_en = escape_string(translated["description_en"])
                new_lines.append(' ' * indent + f'"description_en": "{desc_en}",\n')
                i += 1
                continue
            
            # Find item start
            item_match = re.search(r'"order_number":\s*(\d+)', line)
            if item_match:
                current_item_order = int(item_match.group(1))
                in_item = True
                item_start_line = i
                # Find corresponding translated item
                translated_item = None
                for item in translated["items"]:
                    if item["order_number"] == current_item_order:
                        translated_item = item
                        break
            
            # Add English fields to items
            if in_item and translated_item:
                # Check if this is the last field before closing brace
                if '},' in line or (i + 1 < len(lines) and '},' in lines[i + 1]) or (i + 1 < len(lines) and ']' in lines[i + 1]):
                    # Add English fields before closing
                    indent = len(line) - len(line.lstrip())
                    
                    # Check which fields need to be added
                    fields_to_add = []
                    
                    if '"default_title_en"' not in ''.join(lines[item_start_line:i+1]):
                        title_en = escape_string(translated_item["default_title_en"])
                        fields_to_add.append(f'"default_title_en": "{title_en}"')
                    
                    if '"default_description_en"' not in ''.join(lines[item_start_line:i+1]) and translated_item.get("default_description"):
                        desc_en = escape_string(translated_item["default_description_en"])
                        fields_to_add.append(f'"default_description_en": "{desc_en}"')
                    
                    if '"default_recommendation_en"' not in ''.join(lines[item_start_line:i+1]) and translated_item.get("default_recommendation"):
                        rec_en = escape_string(translated_item["default_recommendation_en"])
                        fields_to_add.append(f'"default_recommendation_en": "{rec_en}"')
                    
                    if fields_to_add:
                        # Add comma to current line if not present
                        if line.rstrip().endswith(','):
                            new_lines.append(line)
                        else:
                            new_lines.append(line.rstrip() + ',\n')
                        
                        # Add English fields
                        for field in fields_to_add:
                            new_lines.append(' ' * indent + field + ',\n')
                        
                        i += 1
                        in_item = False
                        continue
        
        new_lines.append(line)
        i += 1
    
    # Write updated content
    print(f"✏️  Writing updated file...")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("✅ File updated successfully!")

def main():
    """
    Main function to translate all templates.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_file = os.path.join(script_dir, 'create_default_templates_full.py')
    
    if not os.path.exists(template_file):
        print(f"❌ Template file not found: {template_file}")
        sys.exit(1)
    
    print("🚀 Starting template translation...")
    print(f"📁 Template file: {template_file}")
    print(f"🤖 Model: {MODEL}")
    print(f"⚠️  KVKK template will be skipped\n")
    
    # Parse template file
    try:
        templates_data = parse_template_file(template_file)
        print(f"✅ Found {len(templates_data)} templates to translate (KVKK excluded)")
    except Exception as e:
        print(f"❌ Error parsing template file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Translate templates (skip KVKK)
    translated_templates = {}
    total_templates = len([k for k in templates_data.keys() if k != 'KVKK'])
    current = 0
    
    for standard_key, template_data in templates_data.items():
        # Skip KVKK
        if standard_key == 'KVKK':
            print(f"\n⏭️  Skipping KVKK template (will remain in Turkish)")
            continue
        
        current += 1
        print(f"\n{'='*60}")
        print(f"Template {current}/{total_templates}: {standard_key}")
        print(f"{'='*60}")
        
        try:
            translated = translate_template(template_data, standard_key)
            translated_templates[standard_key] = translated
            
            # Progress update
            print(f"\n✅ Progress: {current}/{total_templates} templates translated")
        except Exception as e:
            print(f"❌ Error translating {standard_key}: {e}")
            continue
    
    # Ask for confirmation before updating file
    print(f"\n{'='*60}")
    print(f"📊 Translation Summary:")
    print(f"   - Translated: {len(translated_templates)} templates")
    print(f"   - Skipped: KVKK (1 template)")
    print(f"{'='*60}")
    
    response = input("\n❓ Update template file with translations? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        try:
            update_template_file(template_file, translated_templates)
            print("\n✅ Translation complete!")
            print("📝 Next steps:")
            print("   1. Review the updated template file")
            print("   2. Run migration: python backend/scripts/migrate_template_i18n.py")
            print("   3. Recreate templates: python backend/scripts/create_default_templates_full.py")
        except Exception as e:
            print(f"❌ Error updating file: {e}")
    else:
        print("⚠️  File update cancelled. Translations are available but not saved.")

if __name__ == "__main__":
    main()

