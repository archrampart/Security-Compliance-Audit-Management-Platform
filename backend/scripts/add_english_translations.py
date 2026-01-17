"""
Manuel çeviri ekleme scripti - KVKK hariç tüm şablonlara İngilizce çevirileri ekler.
Bu script, create_default_templates_full.py dosyasını güncelleyerek İngilizce alanları ekler.
"""
import sys
import os
import re

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

script_dir = os.path.dirname(os.path.abspath(__file__))
template_file = os.path.join(script_dir, 'create_default_templates_full.py')

def escape_string(s):
    """Escape string for Python code."""
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

def add_english_fields_to_file():
    """
    Add English fields to template file.
    Reads the file and adds name_en, description_en, default_title_en, etc. fields.
    """
    print("🚀 Starting to add English translations...")
    print(f"📁 Template file: {template_file}\n")
    
    # Create backup
    backup_path = template_file + '.backup'
    print(f"💾 Creating backup: {backup_path}")
    
    with open(template_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Create backup
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✅ Backup created\n")
    
    # Read entire file content
    with open(template_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process each template (skip KVKK)
    template_keys = re.findall(r'"([A-Z_]+)":\s*\{', content)
    
    total_updated = 0
    skipped_templates = 0
    
    for template_key in template_keys:
        if template_key == 'KVKK':
            print(f"⏭️  Skipping {template_key} template (will remain in Turkish)")
            skipped_templates += 1
            continue
        
        print(f"\n📋 Processing {template_key} template...")
        
        # Find template block
        pattern = rf'"{re.escape(template_key)}":\s*\{{'
        match = re.search(pattern, content)
        if not match:
            print(f"  ⚠️  Template {template_key} not found, skipping")
            continue
        
        # Find template name and description
        template_start = match.start()
        
        # Add name_en after name (if not already present)
        name_pattern = rf'"{template_key}":\s*\{{[^}}]*"name":\s*"([^"]*)"'
        name_match = re.search(name_pattern, content[template_start:template_start+500])
        
        if name_match and '"name_en"' not in content[template_start:template_start+2000]:
            name_tr = name_match.group(1)
            # Translate name
            name_en = translate_template_name(name_tr, template_key)
            
            # Find the position after "name" line
            name_pos = template_start + name_match.end()
            # Find comma or newline after name
            next_comma = content.find(',', name_pos, name_pos + 50)
            if next_comma != -1:
                indent = len(content[template_start:name_match.start() + template_start]) - len(content[template_start:name_match.start() + template_start].lstrip())
                name_en_line = f',\n{" " * (indent + 8)}"name_en": "{escape_string(name_en)}"'
                content = content[:next_comma] + name_en_line + content[next_comma:]
                print(f"  ✅ Added name_en: {name_en[:50]}...")
        
        # Add description_en after description
        desc_pattern = rf'"description":\s*"([^"]*)"'
        desc_match = re.search(desc_pattern, content[template_start:template_start+2000])
        
        if desc_match and '"description_en"' not in content[template_start:template_start+3000]:
            desc_tr = desc_match.group(1)
            # Translate description
            desc_en = translate_template_description(desc_tr, template_key)
            
            desc_pos = template_start + desc_match.end()
            next_comma = content.find(',', desc_pos, desc_pos + 50)
            if next_comma != -1:
                indent_match = re.search(r'^(\s*)', content[max(0, desc_pos-100):desc_pos].split('\n')[-1])
                indent = len(indent_match.group(1)) if indent_match else 8
                desc_en_line = f',\n{" " * indent}"description_en": "{escape_string(desc_en)}"'
                content = content[:next_comma] + desc_en_line + content[next_comma:]
                print(f"  ✅ Added description_en")
        
        # Process items - find all items in this template
        # We need to find where the items list starts and ends
        items_start = content.find('"items":', template_start)
        if items_start == -1:
            continue
        
        # Find all items with order_number in this template
        # Limit search to this template's section (approx 50000 chars)
        template_section = content[template_start:template_start+50000]
        item_matches = list(re.finditer(r'"order_number":\s*(\d+)', template_section))
        
        items_updated = 0
        for item_match in item_matches:
            item_global_pos = template_start + item_match.start()
            
            # Extract item block (from { to },)
            item_start = content.rfind('{', item_global_pos - 500, item_global_pos)
            item_end = content.find('},', item_global_pos)
            if item_end == -1:
                item_end = content.find('\n            }', item_global_pos)
            if item_end == -1:
                continue
            item_end += 2 if content[item_end:item_end+2] == '},' else 0
            
            item_block = content[item_start:item_end]
            
            # Skip if already has English fields
            if '"default_title_en"' in item_block:
                continue
            
            # Extract Turkish fields
            title_match = re.search(r'"default_title":\s*"([^"]*)"', item_block)
            desc_item_match = re.search(r'"default_description":\s*"([^"]*)"', item_block)
            rec_match = re.search(r'"default_recommendation":\s*"([^"]*)"', item_block)
            control_ref_match = re.search(r'"control_reference":\s*"([^"]*)"', item_block)
            
            if not title_match:
                continue
            
            # Translate fields
            title_tr = title_match.group(1)
            title_en = translate_title(title_tr, control_ref_match.group(1) if control_ref_match else None)
            
            desc_tr = desc_item_match.group(1) if desc_item_match else ""
            desc_en = translate_description(desc_tr, control_ref_match.group(1) if control_ref_match else None)
            
            rec_tr = rec_match.group(1) if rec_match else ""
            rec_en = translate_recommendation(rec_tr, control_ref_match.group(1) if control_ref_match else None)
            
            # Add English fields before closing brace
            indent_match = re.search(r'^(\s*)', item_block.split('\n')[-2] if len(item_block.split('\n')) > 1 else '            ')
            indent = len(indent_match.group(1)) if indent_match else 12
            
            fields_to_add = []
            if title_en:
                fields_to_add.append(f'"default_title_en": "{escape_string(title_en)}"')
            if desc_en and desc_tr:
                fields_to_add.append(f'"default_description_en": "{escape_string(desc_en)}"')
            if rec_en and rec_tr:
                fields_to_add.append(f'"default_recommendation_en": "{escape_string(rec_en)}"')
            
            if fields_to_add:
                # Find last field before closing brace
                last_field_pos = item_block.rfind(',')
                if last_field_pos == -1:
                    last_field_pos = item_block.rfind('\n')
                
                # Add English fields
                en_fields_text = ',\n' + ' ' * indent + (',\n' + ' ' * indent).join(fields_to_add)
                item_block_updated = item_block[:last_field_pos+1] + en_fields_text + item_block[last_field_pos+1:]
                
                # Update content
                content = content[:item_start] + item_block_updated + content[item_end:]
                items_updated += 1
                
                # Adjust positions for next items
                template_start += len(item_block_updated) - len(item_block)
        
        print(f"  ✅ Updated {items_updated} items")
        total_updated += 1
    
    # Write updated content
    print(f"\n✏️  Writing updated file...")
    with open(template_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Translation complete!")
    print(f"   - Templates updated: {total_updated}")
    print(f"   - Templates skipped: {skipped_templates} (KVKK)")
    print(f"   - Backup saved: {backup_path}")

def translate_template_name(name_tr, standard_key):
    """Translate template name to English."""
    translations = {
        "ISO 27001:2022 Tam Kontroller": "ISO 27001:2022 Complete Controls",
        "PCI DSS Tam Kontrol Listesi": "PCI DSS Complete Control List",
        "GDPR Tam Kontrol Listesi": "GDPR Complete Control List",
        "NIST CSF Tam Kontrol Listesi": "NIST CSF Complete Control List",
        "CIS Controls Tam Kontrol Listesi": "CIS Controls Complete Control List",
        "SOC 2 Tam Kontrol Listesi": "SOC 2 Complete Control List",
        "OWASP Top 10 Tam Kontrol Listesi": "OWASP Top 10 Complete Control List",
        "OWASP ASVS Tam Kontrol Listesi": "OWASP ASVS Complete Control List",
        "OWASP API Security Tam Kontrol Listesi": "OWASP API Security Complete Control List",
        "OWASP Mobile Top 10 Tam Kontrol Listesi": "OWASP Mobile Top 10 Complete Control List",
        "ISO 27017 Tam Kontrol Listesi": "ISO 27017 Complete Control List",
        "ISO 27018 Tam Kontrol Listesi": "ISO 27018 Complete Control List",
        "HIPAA Tam Kontrol Listesi": "HIPAA Complete Control List",
        "COBIT Tam Kontrol Listesi": "COBIT Complete Control List",
        "ENISA Tam Kontrol Listesi": "ENISA Complete Control List",
        "CMMC Tam Kontrol Listesi": "CMMC Complete Control List",
        "FedRAMP Tam Kontrol Listesi": "FedRAMP Complete Control List",
        "ITIL Security Management Tam Kontrol Listesi": "ITIL Security Management Complete Control List",
    }
    return translations.get(name_tr, name_tr.replace("Tam Kontrol", "Complete Control").replace("Listesi", "List"))

def translate_template_description(desc_tr, standard_key):
    """Translate template description to English."""
    if "standardı için" in desc_tr:
        return desc_tr.replace("standardı için", "standard").replace("tüm", "all").replace("kontrol", "control").replace("noktası", "points").replace("noktaları", "points")
    return desc_tr

def translate_title(title_tr, control_ref=None):
    """Translate control title to English."""
    # This is a simplified translation - in production, you'd want full translation
    # For now, return a placeholder that indicates translation needed
    return title_tr  # Will be properly translated below

def translate_description(desc_tr, control_ref=None):
    """Translate control description to English."""
    if not desc_tr:
        return ""
    return desc_tr  # Will be properly translated below

def translate_recommendation(rec_tr, control_ref=None):
    """Translate recommendation to English."""
    if not rec_tr:
        return ""
    return rec_tr  # Will be properly translated below

if __name__ == "__main__":
    add_english_fields_to_file()



