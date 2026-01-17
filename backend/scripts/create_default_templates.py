"""
Hazır denetim kontrol şablonlarını oluşturma scripti
Kullanım: python scripts/create_default_templates.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.template import Template, TemplateItem, Severity, Status
from app.models.organization import Organization
from app.models.audit import AuditStandard

# Hazır kontrol listeleri
TEMPLATES_DATA = {
    "ISO27001": {
        "name": "ISO 27001 Temel Kontroller",
        "description": "ISO 27001:2022 standardı için hazır denetim kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "A.5.1",
                "default_title": "Güvenlik Politikaları",
                "default_description": "Kuruluşun bilgi güvenliği politikalarının tanımlanması, yayınlanması ve gözden geçirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Üst yönetim tarafından onaylanmış yazılı güvenlik politikaları oluşturulmalı ve tüm personel bilgilendirilmelidir. Politikalar periyodik olarak gözden geçirilmelidir."
            },
            {
                "order_number": 2,
                "control_reference": "A.5.2",
                "default_title": "Güvenlik Politikalarının Organizasyonu",
                "default_description": "Bilgi güvenliği için roller ve sorumlulukların tanımlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenlik roller ve sorumluluklar net bir şekilde tanımlanmalı ve belgelenmelidir. RACI matrisi oluşturulmalıdır."
            },
            {
                "order_number": 3,
                "control_reference": "A.6.1",
                "default_title": "Bilgi Güvenliği için Organizasyonel Roller",
                "default_description": "Bilgi güvenliği yönetimi için sorumlulukların atanması ve koordinasyonu",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Bilgi güvenliği yöneticisi (CISO) veya sorumlu birim atanmalı ve yetkileri tanımlanmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "A.6.2",
                "default_title": "Uzaktan Çalışma",
                "default_description": "Uzaktan çalışma için güvenlik önlemlerinin alınması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Uzaktan çalışma politikası oluşturulmalı, VPN kullanımı zorunlu hale getirilmelidir. Mobil cihaz yönetimi (MDM) uygulanmalıdır."
            },
            {
                "order_number": 5,
                "control_reference": "A.7.1",
                "default_title": "Personel Seçimi",
                "default_description": "İşe alım sürecinde güvenlik kontrollerinin uygulanması",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "İşe alım sürecinde referans kontrolü, arka plan araştırması ve sözleşmelerde güvenlik maddeleri yer almalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "A.7.2",
                "default_title": "İş Koşulları",
                "default_description": "Personelin bilgi güvenliği sorumluluklarının sözleşmelerde belirtilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "İş sözleşmelerinde gizlilik maddesi, güvenlik sorumlulukları ve ayrılma sürecindeki yükümlülükler belirtilmelidir."
            },
            {
                "order_number": 7,
                "control_reference": "A.7.3",
                "default_title": "Bilgi Güvenliği Farkındalığı, Eğitim ve Öğretim",
                "default_description": "Personelin güvenlik farkındalığının artırılması için eğitim programlarının uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yıllık güvenlik farkındalık eğitimleri düzenlenmeli, phishing simülasyonları yapılmalı ve eğitim kayıtları tutulmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "A.7.4",
                "default_title": "Disiplin Süreci",
                "default_description": "Güvenlik ihlalleri için disiplin prosedürlerinin oluşturulması",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenlik ihlalleri için net disiplin prosedürleri oluşturulmalı ve tüm personel bilgilendirilmelidir."
            },
            {
                "order_number": 9,
                "control_reference": "A.8.1",
                "default_title": "Varlık Envanteri",
                "default_description": "Bilgi varlıklarının belirlenmesi ve envanterinin çıkarılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm bilgi varlıkları kategorize edilmeli, envanter tutulmalı ve sahipleri atanmalıdır. Envanter düzenli olarak güncellenmelidir."
            },
            {
                "order_number": 10,
                "control_reference": "A.8.2",
                "default_title": "Varlık Sahipliği",
                "default_description": "Her bilgi varlığı için sahip atanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Her bilgi varlığı için bir sahip atanmalı ve sorumlulukları belirlenmelidir."
            },
            {
                "order_number": 11,
                "control_reference": "A.8.3",
                "default_title": "Varlık Kullanımı için Kabul Edilebilir Politikaları",
                "default_description": "Bilgi varlıklarının kullanımı için kuralların belirlenmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Bilgi varlıklarının kabul edilebilir kullanım politikaları oluşturulmalı ve personel bilgilendirilmelidir."
            },
            {
                "order_number": 12,
                "control_reference": "A.9.1",
                "default_title": "Kullanıcı Erişim Yönetimi Politikası",
                "default_description": "Kullanıcı erişim yönetimi için politikaların oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kullanıcı erişim yönetimi politikası oluşturulmalı, erişim istekleri onay sürecinden geçmelidir."
            },
            {
                "order_number": 13,
                "control_reference": "A.9.2",
                "default_title": "Kullanıcı Erişim Sağlama",
                "default_description": "Yeni kullanıcılara erişim sağlama sürecinin tanımlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yeni kullanıcı erişimleri için onay süreci oluşturulmalı, minimum ayrıcalık prensibi uygulanmalıdır."
            },
            {
                "order_number": 14,
                "control_reference": "A.9.3",
                "default_title": "Kullanıcı Kimlik Doğrulama ve Yetkilendirme",
                "default_description": "Güçlü kimlik doğrulama mekanizmalarının kullanılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güçlü şifre politikaları uygulanmalı, mümkünse çok faktörlü kimlik doğrulama (MFA) aktif edilmelidir."
            },
            {
                "order_number": 15,
                "control_reference": "A.9.4",
                "default_title": "Erişim Kontrol Yönetimi",
                "default_description": "Sistem erişim kontrol listelerinin yönetimi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Erişim kontrol listeleri düzenli olarak gözden geçirilmeli, gereksiz erişimler kaldırılmalıdır."
            },
            {
                "order_number": 16,
                "control_reference": "A.11.1",
                "default_title": "Fiziksel ve Mantıksal Erişim Kontrolü",
                "default_description": "Fiziksel alanlara erişim kontrollerinin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Sunucu odaları ve veri merkezleri için fiziksel erişim kontrolleri (badge, biyometrik) uygulanmalıdır."
            },
            {
                "order_number": 17,
                "control_reference": "A.12.1",
                "default_title": "Operasyonel Prosedürler ve Sorumluluklar",
                "default_description": "Operasyonel güvenlik prosedürlerinin belgelenmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Operasyonel güvenlik prosedürleri yazılı olarak belgelenmeli ve personel eğitilmelidir."
            },
            {
                "order_number": 18,
                "control_reference": "A.12.2",
                "default_title": "Değişiklik Yönetimi",
                "default_description": "Sistem değişikliklerinin kontrollü bir şekilde yönetilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Değişiklik yönetim süreci oluşturulmalı, tüm değişiklikler onay sürecinden geçmelidir."
            },
            {
                "order_number": 19,
                "control_reference": "A.12.3",
                "default_title": "Kapasite Yönetimi",
                "default_description": "Sistem kapasitesinin izlenmesi ve yönetilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Sistem kapasitesi düzenli olarak izlenmeli, kapasite planlaması yapılmalıdır."
            },
            {
                "order_number": 20,
                "control_reference": "A.12.4",
                "default_title": "Log Kayıtları",
                "default_description": "Sistem olaylarının loglanması ve izlenmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm kritik sistem olayları loglanmalı, log kayıtları merkezi bir sistemde toplanmalı ve düzenli olarak gözden geçirilmelidir."
            }
        ]
    },
    "KVKK": {
        "name": "KVKK (GDPR) Kişisel Veri Koruma Denetimi",
        "description": "6698 sayılı Kişisel Verilerin Korunması Kanunu uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "KVKK-1",
                "default_title": "Veri Sorumlusu ve İşleyen Belirleme",
                "default_description": "Kuruluşun veri sorumlusu ve veri işleyen konumunun belirlenmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kuruluşun veri sorumlusu ve veri işleyen durumu net bir şekilde belirlenmeli ve dokümante edilmelidir."
            },
            {
                "order_number": 2,
                "control_reference": "KVKK-2",
                "default_title": "Kişisel Veri Envanteri",
                "default_description": "İşlenen tüm kişisel verilerin envanterinin çıkarılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "İşlenen tüm kişisel verilerin kategorileri, amaçları, saklama süreleri ve paylaşım durumları belirlenmeli ve kayıt altına alınmalıdır."
            },
            {
                "order_number": 3,
                "control_reference": "KVKK-3",
                "default_title": "Aydınlatma Yükümlülüğü",
                "default_description": "Kişisel veri sahiplerinin aydınlatılması ve bilgilendirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri sahipleri, verilerinin işlenme amacı, yasal dayanak, saklama süresi ve hakları konusunda aydınlatılmalıdır. Aydınlatma metinleri hazırlanmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "KVKK-4",
                "default_title": "Açık Rıza Yönetimi",
                "default_description": "Açık rıza alınması gereken durumlarda rıza yönetim sürecinin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Açık rıza gereken durumlarda, rıza metinleri hazırlanmalı, rızalar kayıt altına alınmalı ve geri çekilme mekanizması oluşturulmalıdır."
            },
            {
                "order_number": 5,
                "control_reference": "KVKK-5",
                "default_title": "Teknik ve İdari Tedbirler",
                "default_description": "Kişisel verilerin güvenliğinin sağlanması için teknik ve idari tedbirlerin alınması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Erişim kontrolleri, şifreleme, yedekleme, güvenlik duvarları, antivirüs, loglama gibi teknik tedbirler alınmalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "KVKK-6",
                "default_title": "Veri Güvenliği Politikaları",
                "default_description": "Kişisel veri güvenliği için politikaların oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kişisel veri güvenliği politikası hazırlanmalı, personel eğitilmelidir."
            },
            {
                "order_number": 7,
                "control_reference": "KVKK-7",
                "default_title": "Veri İhlali Bildirimi",
                "default_description": "Veri ihlali durumunda bildirim sürecinin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri ihlali tespit edildiğinde 72 saat içinde KVK Kurumuna, veri sahiplerine ise gecikmeksizin bildirim yapılmalıdır. İhlal yanıt prosedürü oluşturulmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "KVKK-8",
                "default_title": "Veri Sahibi Hakları",
                "default_description": "Veri sahiplerinin haklarının yerine getirilmesi için süreçlerin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Başvuru kanalları oluşturulmalı, 30 gün içinde yanıt verme mekanizması kurulmalıdır. Veri sahibi hakları başvuru formu hazırlanmalıdır."
            },
            {
                "order_number": 9,
                "control_reference": "KVKK-9",
                "default_title": "Veri Saklama ve İmha",
                "default_description": "Kişisel verilerin saklama sürelerinin belirlenmesi ve imha sürecinin oluşturulması",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Her veri kategorisi için saklama süreleri belirlenmeli, süre sonunda güvenli imha prosedürü uygulanmalıdır."
            },
            {
                "order_number": 10,
                "control_reference": "KVKK-10",
                "default_title": "Üçüncü Taraf Paylaşımı",
                "default_description": "Kişisel verilerin üçüncü taraflarla paylaşılması durumunda kontrollerin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Üçüncü taraflarla veri paylaşım sözleşmeleri yapılmalı, yurt dışına aktarımda yeterli koruma önlemleri alınmalıdır."
            },
            {
                "order_number": 11,
                "control_reference": "KVKK-11",
                "default_title": "VERBİS Kaydı",
                "default_description": "Veri Sorumluları Sicili'ne kayıt yükümlülüğünün yerine getirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kayıt yükümlülüğü bulunan kuruluşlar VERBİS'e kayıt yapmalı ve kayıt bilgilerini güncel tutmalıdır."
            },
            {
                "order_number": 12,
                "control_reference": "KVKK-12",
                "default_title": "Personel Eğitimi",
                "default_description": "Personelin KVKK konusunda eğitilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm personel KVKK konusunda periyodik olarak eğitilmelidir. Eğitim kayıtları tutulmalıdır."
            }
        ]
    },
    "GDPR": {
        "name": "GDPR (AVG) Kişisel Veri Koruma Denetimi",
        "description": "General Data Protection Regulation uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "GDPR-1",
                "default_title": "Data Controller ve Processor Belirleme",
                "default_description": "Kuruluşun data controller ve data processor konumunun belirlenmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kuruluşun data controller veya data processor konumu belirlenmeli ve dokümante edilmelidir."
            },
            {
                "order_number": 2,
                "control_reference": "GDPR-2",
                "default_title": "Data Processing Register",
                "default_description": "Veri işleme faaliyetlerinin kayıt altına alınması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm veri işleme faaliyetleri için detaylı kayıt tutulmalı, işleme amaçları, yasal dayanaklar ve saklama süreleri belgelenmelidir."
            },
            {
                "order_number": 3,
                "control_reference": "GDPR-3",
                "default_title": "Privacy Notice",
                "default_description": "Veri sahiplerine gizlilik bildirimi yapılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Açık, anlaşılır ve erişilebilir privacy notice hazırlanmalı ve veri sahiplerine sunulmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "GDPR-4",
                "default_title": "Consent Management",
                "default_description": "Açık rıza yönetimi sürecinin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Rıza yönetim sistemi oluşturulmalı, rızalar kayıt altına alınmalı ve kolayca geri çekilebilir olmalıdır."
            },
            {
                "order_number": 5,
                "control_reference": "GDPR-5",
                "default_title": "Data Protection by Design and by Default",
                "default_description": "Tasarım ve varsayılan ayarlarda veri koruması prensiplerinin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yeni sistemler ve süreçler tasarlanırken gizlilik koruması dikkate alınmalı, varsayılan ayarlar gizlilik dostu olmalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "GDPR-6",
                "default_title": "Data Security Measures",
                "default_description": "Veri güvenliği için teknik ve organizasyonel önlemlerin alınması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Encryption, access controls, pseudonymization, backup, logging gibi teknik önlemler uygulanmalıdır."
            },
            {
                "order_number": 7,
                "control_reference": "GDPR-7",
                "default_title": "Data Breach Notification",
                "default_description": "Veri ihlali bildirim sürecinin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri ihlali tespit edildiğinde 72 saat içinde supervisory authority'ye bildirim yapılmalıdır. Data breach response plan oluşturulmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "GDPR-8",
                "default_title": "Data Subject Rights",
                "default_description": "Veri sahiplerinin haklarının yerine getirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Access, rectification, erasure, portability, objection gibi haklar için süreçler oluşturulmalı ve 30 gün içinde yanıt verilmelidir."
            },
            {
                "order_number": 9,
                "control_reference": "GDPR-9",
                "default_title": "Data Retention and Deletion",
                "default_description": "Veri saklama ve silme süreçlerinin oluşturulması",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri saklama süreleri belirlenmeli, süre sonunda güvenli silme prosedürü uygulanmalıdır."
            },
            {
                "order_number": 10,
                "control_reference": "GDPR-10",
                "default_title": "International Data Transfers",
                "default_description": "Uluslararası veri transferlerinde yeterli koruma önlemlerinin alınması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "AB dışına veri transferi için Standard Contractual Clauses veya diğer yasal mekanizmalar kullanılmalıdır."
            },
            {
                "order_number": 11,
                "control_reference": "GDPR-11",
                "default_title": "Data Protection Impact Assessment (DPIA)",
                "default_description": "Yüksek riskli veri işleme faaliyetleri için DPIA yapılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yüksek riskli veri işleme faaliyetleri için DPIA yapılmalı ve dokümante edilmelidir."
            },
            {
                "order_number": 12,
                "control_reference": "GDPR-12",
                "default_title": "Data Protection Officer (DPO)",
                "default_description": "DPO atama yükümlülüğünün değerlendirilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "DPO atama yükümlülüğü bulunan kuruluşlar DPO atamalıdır. DPO'nun bağımsızlığı sağlanmalıdır."
            }
        ]
    },
    "PCI_DSS": {
        "name": "PCI DSS Kart Verisi Güvenliği Denetimi",
        "description": "Payment Card Industry Data Security Standard uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "PCI-1",
                "default_title": "Güvenlik Duvarı Yapılandırması",
                "default_description": "Kart verilerini korumak için güvenlik duvarlarının kurulması ve yapılandırılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenlik duvarı kuralları oluşturulmalı, varsayılan-dan-kaçın (deny-all) prensibi uygulanmalıdır."
            },
            {
                "order_number": 2,
                "control_reference": "PCI-2",
                "default_title": "Varsayılan Şifreler ve Güvenlik Parametreleri",
                "default_description": "Varsayılan şifrelerin ve güvenlik parametrelerinin değiştirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm varsayılan şifreler değiştirilmeli, varsayılan güvenlik parametreleri güvenli ayarlarla değiştirilmelidir."
            },
            {
                "order_number": 3,
                "control_reference": "PCI-3",
                "default_title": "Kart Sahibi Verilerinin Korunması",
                "default_description": "Kayıtlı kart sahibi verilerinin korunması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kart sahibi verileri şifrelenmeli, PAN (Primary Account Number) asla açık metin olarak saklanmamalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "PCI-4",
                "default_title": "Kart Verilerinin Açık Metin Olarak İletilmesi",
                "default_description": "Kart verilerinin açık metin olarak genel ağlarda iletilmesinin önlenmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kart verileri genel ağlarda şifreli (TLS/SSL) olarak iletilmelidir."
            },
            {
                "order_number": 5,
                "control_reference": "PCI-5",
                "default_title": "Antivirüs Yazılımları",
                "default_description": "Kötü amaçlı yazılımlara karşı koruma sağlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm sistemlerde güncel antivirüs yazılımı kurulu olmalı ve otomatik güncellemeler aktif olmalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "PCI-6",
                "default_title": "Güvenli Sistem ve Uygulama Geliştirme",
                "default_description": "Güvenli sistem ve uygulamaların geliştirilmesi ve sürdürülmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenli kodlama standartları uygulanmalı, güvenlik açıkları için düzenli testler yapılmalıdır."
            },
            {
                "order_number": 7,
                "control_reference": "PCI-7",
                "default_title": "Erişim Kısıtlaması",
                "default_description": "Kart verilerine erişimin iş ihtiyacına göre kısıtlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Minimum ayrıcalık prensibi uygulanmalı, kart verilerine sadece iş gereksinimi olan kişiler erişebilmelidir."
            },
            {
                "order_number": 8,
                "control_reference": "PCI-8",
                "default_title": "Benzersiz Kimlik Tanımlayıcıları",
                "default_description": "Her kişiye benzersiz bir kimlik tanımlayıcısı atanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Her kullanıcıya benzersiz ID atanmalı, paylaşılan hesaplar kullanılmamalıdır."
            },
            {
                "order_number": 9,
                "control_reference": "PCI-9",
                "default_title": "Fiziksel Erişim Kısıtlaması",
                "default_description": "Kart verilerine fiziksel erişimin kısıtlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kart verilerini içeren sistemlere fiziksel erişim kontrollü olmalı, ziyaretçi yönetimi uygulanmalıdır."
            },
            {
                "order_number": 10,
                "control_reference": "PCI-10",
                "default_title": "Ağ Trafiği ve Erişim İzleme",
                "default_description": "Ağ kaynaklarına erişimin izlenmesi ve test edilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm ağ erişimleri loglanmalı, log kayıtları merkezi bir sistemde toplanmalı ve düzenli olarak gözden geçirilmelidir."
            },
            {
                "order_number": 11,
                "control_reference": "PCI-11",
                "default_title": "Güvenlik Testleri",
                "default_description": "Sistemlerin düzenli olarak test edilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yılda en az bir kez penetration test yapılmalı, güvenlik açığı taraması düzenli olarak gerçekleştirilmelidir."
            },
            {
                "order_number": 12,
                "control_reference": "PCI-12",
                "default_title": "Güvenlik Politikası",
                "default_description": "Bilgi güvenliği politikasının oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "PCI DSS uyumluluğu için güvenlik politikası hazırlanmalı ve tüm personel eğitilmelidir."
            }
        ]
    },
    "NIST": {
        "name": "NIST Cybersecurity Framework Denetimi",
        "description": "NIST Cybersecurity Framework uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "NIST-ID.AM-1",
                "default_title": "Varlık Envanteri",
                "default_description": "Fiziksel ve yazılımsal varlıkların envanterinin çıkarılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm kritik varlıklar kategorize edilmeli ve envanter tutulmalıdır."
            },
            {
                "order_number": 2,
                "control_reference": "NIST-PR.AC-1",
                "default_title": "Kimlik ve Erişim Yönetimi",
                "default_description": "Kullanıcı kimlik doğrulama ve erişim kontrollerinin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güçlü kimlik doğrulama mekanizmaları (MFA) uygulanmalı, erişim kontrol listeleri yönetilmelidir."
            },
            {
                "order_number": 3,
                "control_reference": "NIST-PR.DS-1",
                "default_title": "Veri Koruma",
                "default_description": "Verilerin rest ve transit durumlarında korunması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kritik veriler şifrelenmeli, veri sınıflandırması yapılmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "NIST-PR.IP-1",
                "default_title": "Yapılandırma Yönetimi",
                "default_description": "Sistem yapılandırmalarının yönetilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Yapılandırma yönetim süreci oluşturulmalı, baseline yapılandırmalar belirlenmelidir."
            },
            {
                "order_number": 5,
                "control_reference": "NIST-DE.AE-1",
                "default_title": "Olay Algılama",
                "default_description": "Güvenlik olaylarının algılanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "SIEM sistemi kurulmalı, log kayıtları merkezi olarak toplanmalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "NIST-RS.AN-1",
                "default_title": "Olay Analizi",
                "default_description": "Güvenlik olaylarının analiz edilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenlik analiz ekibi oluşturulmalı, olay yanıt prosedürleri hazırlanmalıdır."
            },
            {
                "order_number": 7,
                "control_reference": "NIST-RC.RP-1",
                "default_title": "Olay Yanıt Planı",
                "default_description": "Güvenlik olaylarına yanıt planının oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Incident response plan hazırlanmalı, düzenli tatbikatlar yapılmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "NIST-RC.IM-1",
                "default_title": "Olay Yanıt İletişimi",
                "default_description": "Olay yanıt sırasında iletişim sürecinin yönetilmesi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Olay yanıt ekibi iletişim matrisi oluşturulmalı, iletişim kanalları belirlenmelidir."
            },
            {
                "order_number": 9,
                "control_reference": "NIST-RP.RP-1",
                "default_title": "İyileştirme Planı",
                "default_description": "Güvenlik iyileştirmeleri için planlama",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Güvenlik iyileştirme planı oluşturulmalı, öncelikler belirlenmelidir."
            }
        ]
    },
    "CIS": {
        "name": "CIS Controls Denetimi",
        "description": "Center for Internet Security Critical Security Controls uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "CIS-1",
                "default_title": "Güvenli Konfigürasyon",
                "default_description": "Cihazların ve yazılımların güvenli konfigürasyonu",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "CIS Benchmark'lara göre güvenli yapılandırma yapılmalıdır."
            },
            {
                "order_number": 2,
                "control_reference": "CIS-2",
                "default_title": "Envanter ve Kontrol Yazılım Varlıkları",
                "default_description": "Yazılım varlıklarının envanterinin çıkarılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm yazılımların envanteri tutulmalı, lisans yönetimi yapılmalıdır."
            },
            {
                "order_number": 3,
                "control_reference": "CIS-3",
                "default_title": "Envanter ve Kontrol Donanım Varlıkları",
                "default_description": "Donanım varlıklarının envanterinin çıkarılması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Tüm donanım varlıklarının envanteri tutulmalı, varlık yönetimi sistemi kullanılmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "CIS-4",
                "default_title": "Sürekli Güvenlik Açığı Yönetimi",
                "default_description": "Güvenlik açıklarının sürekli olarak tespit edilmesi ve yönetilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Otomatik güvenlik açığı tarama araçları kullanılmalı, düzenli taramalar yapılmalıdır."
            },
            {
                "order_number": 5,
                "control_reference": "CIS-5",
                "default_title": "Kontrollü Kullanım Yönetimi",
                "default_description": "Ayrıcalıklı erişim hesaplarının yönetilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Ayrıcalıklı erişim yönetimi (PAM) sistemi kullanılmalı, just-in-time erişim uygulanmalıdır."
            },
            {
                "order_number": 6,
                "control_reference": "CIS-6",
                "default_title": "Erişim Kontrol Listeleri",
                "default_description": "Ağ erişim kontrol listelerinin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Firewall kuralları minimum ayrıcalık prensibine göre yapılandırılmalıdır."
            },
            {
                "order_number": 7,
                "control_reference": "CIS-7",
                "default_title": "E-posta ve Web Tarayıcı Koruması",
                "default_description": "E-posta ve web tarayıcı güvenliğinin sağlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "E-posta güvenlik ağ geçidi (ESG), web proxy ve URL filtreleme çözümleri kullanılmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "CIS-8",
                "default_title": "Kötü Amaçlı Yazılım Koruması",
                "default_description": "Kötü amaçlı yazılımlara karşı koruma sağlanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Endpoint protection platform (EPP) kullanılmalı, güncel antivirüs yazılımları kurulu olmalıdır."
            },
            {
                "order_number": 9,
                "control_reference": "CIS-9",
                "default_title": "Ağ Güvenliği",
                "default_description": "Ağ güvenliği kontrollerinin uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Ağ segmentasyonu yapılmalı, IDS/IPS sistemleri kurulmalıdır."
            },
            {
                "order_number": 10,
                "control_reference": "CIS-10",
                "default_title": "Veri Kurtarma",
                "default_description": "Veri yedekleme ve kurtarma süreçlerinin oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Düzenli yedekleme yapılmalı, yedeklerin test edilmesi ve güvenli saklanması sağlanmalıdır."
            }
        ]
    },
    "SOC2": {
        "name": "SOC 2 Güvenlik Denetimi",
        "description": "Service Organization Control 2 (Trust Services Criteria) uyumluluk denetimi kontrol listesi",
        "items": [
            {
                "order_number": 1,
                "control_reference": "SOC2-CC1.1",
                "default_title": "Kontrol Ortamı",
                "default_description": "Etkili kontrol ortamının oluşturulması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Yönetim tarafından kontrol ortamı oluşturulmalı, etik kod ve politikalar belirlenmelidir."
            },
            {
                "order_number": 2,
                "control_reference": "SOC2-CC2.1",
                "default_title": "İletişim ve Bilgilendirme",
                "default_description": "Kontrol amaçları ve sorumlulukların iletişimi",
                "default_severity": Severity.MEDIUM,
                "default_status": Status.OPEN,
                "default_recommendation": "Kontrol amaçları ve sorumluluklar personel ve paydaşlara iletilmelidir."
            },
            {
                "order_number": 3,
                "control_reference": "SOC2-CC3.1",
                "default_title": "Risk Değerlendirmesi",
                "default_description": "Risklerin belirlenmesi ve değerlendirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Düzenli risk değerlendirmesi yapılmalı, risk matrisi oluşturulmalıdır."
            },
            {
                "order_number": 4,
                "control_reference": "SOC2-CC4.1",
                "default_title": "İzleme Aktivitesi",
                "default_description": "Kontrollerin izlenmesi ve değerlendirilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Kontrollerin etkinliği düzenli olarak izlenmeli ve değerlendirilmelidir."
            },
            {
                "order_number": 5,
                "control_reference": "SOC2-CC6.1",
                "default_title": "İşletim ve Değişiklik Yönetimi",
                "default_description": "Sistemlerin işletilmesi ve değişiklik yönetimi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Değişiklik yönetim süreci oluşturulmalı, tüm değişiklikler onay sürecinden geçmelidir."
            },
            {
                "order_number": 6,
                "control_reference": "SOC2-CC6.2",
                "default_title": "Güvenlik Olayı Yönetimi",
                "default_description": "Güvenlik olaylarının yönetilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Incident response plan hazırlanmalı, olay yanıt ekibi oluşturulmalıdır."
            },
            {
                "order_number": 7,
                "control_reference": "SOC2-CC7.1",
                "default_title": "Erişim Yönetimi",
                "default_description": "Sistem erişimlerinin yönetilmesi",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Erişim yönetim süreci oluşturulmalı, düzenli erişim gözden geçirmeleri yapılmalıdır."
            },
            {
                "order_number": 8,
                "control_reference": "SOC2-CC7.2",
                "default_title": "Kimlik Doğrulama",
                "default_description": "Kullanıcı kimlik doğrulama mekanizmalarının uygulanması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Güçlü şifre politikaları uygulanmalı, mümkünse çok faktörlü kimlik doğrulama kullanılmalıdır."
            },
            {
                "order_number": 9,
                "control_reference": "SOC2-CC8.1",
                "default_title": "Veri Gizliliği",
                "default_description": "Verilerin gizliliğinin korunması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri sınıflandırması yapılmalı, gizlilik politikaları oluşturulmalıdır."
            },
            {
                "order_number": 10,
                "control_reference": "SOC2-CC8.2",
                "default_title": "Veri Bütünlüğü",
                "default_description": "Verilerin bütünlüğünün korunması",
                "default_severity": Severity.HIGH,
                "default_status": Status.OPEN,
                "default_recommendation": "Veri bütünlüğü kontrolleri uygulanmalı, hash ve imza doğrulamaları yapılmalıdır."
            }
        ]
    }
}


def create_default_templates():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # List organizations
        organizations = db.query(Organization).all()
        
        if not organizations:
            print("⚠️  Henüz hiç organizasyon bulunmuyor.")
            print("📦 Otomatik olarak 'Genel' adında bir organizasyon oluşturuluyor...\n")
            
            # Create default organization
            default_org = Organization(
                name="Genel",
                description="Varsayılan organizasyon"
            )
            db.add(default_org)
            db.commit()
            db.refresh(default_org)
            
            selected_org = default_org
            print(f"✅ '{default_org.name}' organizasyonu oluşturuldu (ID: {default_org.id})\n")
        else:
            print("\n📋 Mevcut Organizasyonlar:")
            for i, org in enumerate(organizations, 1):
                print(f"  {i}. {org.name} (ID: {org.id})")
            
            org_choice = input("\nŞablonları hangi organizasyona eklemek istersiniz? (Numara girin, Enter=İlk organizasyon): ").strip()
            
            if not org_choice:
                # Default to first organization
                selected_org = organizations[0]
                print(f"✅ İlk organizasyon seçildi: {selected_org.name}\n")
            else:
                try:
                    org_index = int(org_choice) - 1
                    if org_index < 0 or org_index >= len(organizations):
                        print("❌ Geçersiz seçim!")
                        return
                    selected_org = organizations[org_index]
                except ValueError:
                    print("❌ Geçersiz seçim!")
                    return
        
        print(f"\n✅ Seçilen organizasyon: {selected_org.name}")
        print(f"\n📦 Şablonlar oluşturuluyor...\n")
        
        created_count = 0
        skipped_count = 0
        
        for standard_key, template_data in TEMPLATES_DATA.items():
            standard_enum = AuditStandard[standard_key]
            
            # Check if template already exists for this organization and standard
            existing = db.query(Template).filter(
                Template.organization_id == selected_org.id,
                Template.standard == standard_enum
            ).first()
            
            if existing:
                print(f"⏭️  {template_data['name']} - Zaten mevcut (atlandı)")
                skipped_count += 1
                continue
            
            # Create template
            template = Template(
                name=template_data["name"],
                description=template_data["description"],
                standard=standard_enum,
                organization_id=selected_org.id
            )
            db.add(template)
            db.flush()
            
            # Create template items
            for item_data in template_data["items"]:
                item = TemplateItem(
                    template_id=template.id,
                    order_number=item_data["order_number"],
                    control_reference=item_data.get("control_reference"),
                    default_title=item_data["default_title"],
                    default_description=item_data.get("default_description"),
                    default_severity=item_data.get("default_severity", Severity.MEDIUM),
                    default_status=item_data.get("default_status", Status.OPEN),
                    default_recommendation=item_data.get("default_recommendation")
                )
                db.add(item)
            
            db.commit()
            db.refresh(template)
            
            print(f"✅ {template_data['name']} - {len(template_data['items'])} kontrol oluşturuldu")
            created_count += 1
        
        print(f"\n{'='*60}")
        print(f"✅ Toplam {created_count} şablon oluşturuldu")
        if skipped_count > 0:
            print(f"⏭️  {skipped_count} şablon zaten mevcut olduğu için atlandı")
        print(f"{'='*60}\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    create_default_templates()

