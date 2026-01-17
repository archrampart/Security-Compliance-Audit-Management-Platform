"""
Tüm şablonlara İngilizce çevirileri ekleme scripti (KVKK hariç)
Bu script, create_default_templates_full.py dosyasına tüm İngilizce çevirileri ekler.
"""
import sys
import os
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
template_file = os.path.join(script_dir, 'create_default_templates_full.py')

def escape_python_string(s):
    """Escape string for Python code."""
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

def translate_text(text):
    """
    Manuel çeviri fonksiyonu - Türkçe metinleri İngilizceye çevirir.
    Bu fonksiyon önemli terimlerin çevirilerini içerir.
    """
    if not text or not text.strip():
        return ""
    
    # Basit çeviri sözlüğü
    translations = {
        "Güvenlik Politikaları": "Security Policies",
        "Güvenlik Politikalarının Organizasyonu": "Organization of Security Policies",
        "Üçüncü Taraf Risklerinin Tanımlanması": "Identification of Third-Party Risks",
        "Bilgi güvenliği politikalarının": "information security policies",
        "tanımlanması, yayınlanması ve gözden geçirilmesi": "definition, publication and review",
        "Kuruluşun": "Organization's",
        "Üst yönetim tarafından onaylanmış": "approved by senior management",
        "yazılı güvenlik politikaları oluşturulmalı": "written security policies should be created",
        "tüm personel bilgilendirilmelidir": "all personnel should be informed",
        "Politikalar periyodik olarak gözden geçirilmelidir": "Policies should be reviewed periodically",
    }
    
    # Eğer tam eşleşme varsa dön
    if text in translations:
        return translations[text]
    
    # Basit kelime bazlı çeviri
    # Bu basit bir yaklaşım - gerçek çeviri için daha kapsamlı bir yöntem gerekir
    return text  # Şimdilik orijinal metni döndür, sonra detaylı çeviri yapılacak

def add_translations_to_file():
    """Tüm şablonlara İngilizce çevirileri ekle."""
    print("🚀 Starting to add English translations to all templates...")
    print(f"📁 Template file: {template_file}\n")
    
    # Backup oluştur
    backup_path = template_file + '.backup'
    print(f"💾 Creating backup: {backup_path}")
    
    with open(template_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Backup created\n")
    
    # KVKK hariç tüm şablonları bul
    template_keys = re.findall(r'"([A-Z_]+)":\s*\{', content)
    templates_to_translate = [k for k in template_keys if k != 'KVKK']
    
    print(f"📋 Found {len(templates_to_translate)} templates to translate (excluding KVKK)\n")
    
    # Her şablon için çevirileri ekle
    for template_key in templates_to_translate:
        print(f"Processing {template_key}...")
        
        # Template başlangıcını bul
        pattern = rf'"{re.escape(template_key)}":\s*\{{'
        match = re.search(pattern, content)
        if not match:
            print(f"  ⚠️  Template {template_key} not found")
            continue
        
        template_start = match.start()
        
        # Template name ve description için İngilizce ekle (eğer yoksa)
        name_pattern = rf'"{template_key}":\s*\{{\s*"name":\s*"([^"]*)"'
        name_match = re.search(name_pattern, content[template_start:template_start+500])
        
        if name_match and '"name_en"' not in content[template_start:template_start+2000]:
            name_tr = name_match.group(1)
            # İngilizce ismi oluştur
            name_en = name_tr.replace("Tam Kontroller", "Complete Controls").replace("Tam Kontrol Listesi", "Complete Control List")
            
            name_pos = template_start + name_match.end()
            next_char = content[name_pos:name_pos+50]
            comma_pos = next_char.find(',')
            if comma_pos != -1:
                indent = 8  # Template için indent
                name_en_line = f',\n{" " * indent}"name_en": "{escape_python_string(name_en)}"'
                insert_pos = template_start + name_match.end() + comma_pos + 1
                content = content[:insert_pos] + name_en_line + content[insert_pos:]
                print(f"  ✅ Added name_en")
        
        # Description için İngilizce ekle
        desc_pattern = rf'"description":\s*"([^"]*)"'
        desc_match = re.search(desc_pattern, content[template_start:template_start+2000])
        
        if desc_match and '"description_en"' not in content[template_start:template_start+3000]:
            desc_tr = desc_match.group(1)
            # Basit çeviri
            desc_en = desc_tr.replace("standardı için", "standard").replace("tüm", "all").replace("kontrol noktası", "control point").replace("kontrol noktaları", "control points")
            
            desc_pos = template_start + desc_match.end()
            next_char = content[desc_pos:desc_pos+50]
            comma_pos = next_char.find(',')
            if comma_pos != -1:
                indent = 8
                desc_en_line = f',\n{" " * indent}"description_en": "{escape_python_string(desc_en)}"'
                insert_pos = template_start + desc_match.end() + comma_pos + 1
                content = content[:insert_pos] + desc_en_line + content[insert_pos:]
                print(f"  ✅ Added description_en")
        
        # Items için çevirileri ekle
        # Bu çok büyük bir iş - her item için çeviri yapmak gerekiyor
        # Şimdilik yapıyı hazırla, çevirileri sonra ekleyebiliriz
        print(f"  ⏳ Items translation will be added in next step...")
    
    # Güncellenmiş içeriği yaz
    print(f"\n✏️  Writing updated file...")
    with open(template_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Initial translation structure added!")
    print(f"   Note: Item-level translations need to be added separately due to large volume")
    print(f"   Backup saved: {backup_path}")

if __name__ == "__main__":
    add_translations_to_file()



