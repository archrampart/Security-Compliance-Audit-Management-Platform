# ArchRampart Audit Tool

**Enterprise-Grade On-Premise Security and Compliance Audit Management Platform**

🌐 **Website**: [archrampart.com](https://archrampart.com)

ArchRampart Audit Tool is a comprehensive audit management system designed to professionally plan, execute, monitor, and report enterprise security and compliance audits. It enables organizations to efficiently manage information security, cybersecurity, and compliance audits through a centralized platform.

---

## 🇹🇷 Turkish / 🇬🇧 English

This document is available in both Turkish and English. Scroll down for the English version.

---

## 🇹🇷 Türkçe

### 🎯 Hedef Kitle

- **Bilgi Güvenliği Denetçileri**: ISO 27001 ve diğer bilgi güvenliği standartlarına uygun denetimler gerçekleştiren profesyoneller
- **Siber Güvenlik Uzmanları**: Ağ ve sistem güvenliği değerlendirmeleri yapan uzmanlar
- **Uyumluluk Yöneticileri**: GDPR, KVKK, PCI DSS gibi yasal ve düzenleyici gereksinimlere uyum sağlamakla sorumlu ekipler
- **IT Denetçileri**: BT altyapısı ve uygulamalarının güvenlik kontrollerini gerçekleştiren denetçiler
- **Kurumsal Güvenlik Ekipleri**: Organizasyon genelinde güvenlik durumunu izleyen ve raporlayan ekipler
- **Danışmanlık Firmaları**: Müşterilerine güvenlik denetimi hizmeti sunan firmalar

### 💼 Kullanım Senaryoları

- **İç Denetim Faaliyetleri**: Organizasyon içi bilgi güvenliği ve siber güvenlik değerlendirmeleri
- **Sertifikasyon Hazırlıkları**: ISO 27001, SOC 2 gibi sertifikasyonlar için hazırlık denetimleri
- **Uyumluluk Kontrolleri**: GDPR, KVKK, HIPAA gibi yasal gereksinimlere uyum değerlendirmeleri
- **Proje Güvenlik Değerlendirmeleri**: Yeni sistem ve uygulamaların güvenlik kontrolleri
- **Periyodik Güvenlik Taramaları**: Düzenli aralıklarla gerçekleştirilen güvenlik değerlendirmeleri
- **Dış Denetim Koordinasyonu**: Harici denetçilerle yapılan ortak çalışmaların yönetimi

### 🎯 Amaç ve Kapsam

ArchRampart Audit Tool, bilgi güvenliği denetimi, siber güvenlik değerlendirmeleri ve uyumluluk kontrolleri gerçekleştiren organizasyonlar için tasarlanmıştır. Sistem, denetim süreçlerinin tüm aşamalarını dijitalleştirerek:

- **Denetim planlaması ve yürütülmesini** standartlaştırır
- **Bulgu yönetimi ve takibini** otomatikleştirir
- **Raporlama ve dokümantasyonu** kolaylaştırır
- **İş süreçlerini** optimize eder
- **Uyumluluk durumunu** görselleştirir

Platform, ISO/IEC 27001, PCI DSS, GDPR, KVKK, NIST Cybersecurity Framework, CIS Controls, SOC 2, OWASP standartları, HIPAA, COBIT, ISO 22301, ENISA, CMMC, FedRAMP, ITIL gibi uluslararası ve ulusal güvenlik standartlarına uygun denetimler gerçekleştirmeyi destekler.

### ✨ Özellikler

#### 🏢 Organizasyon ve Proje Yönetimi
- **Çoklu organizasyon desteği**: Farklı organizasyonların bağımsız denetim ortamlarında yönetilmesi
- **Hiyerarşik yapı**: Organizasyon → Proje → Denetim → Bulgu mantıksal hiyerarşisi
- **Esnek proje yapılandırması**: İş birimi, departman veya sistem bazlı proje organizasyonu
- **Proje kopyalama**: Mevcut projeleri referans alarak yeni projeler oluşturma

#### 🔐 Güvenlik ve Yetkilendirme
- **Rol tabanlı erişim kontrolü (RBAC)**: Platform yöneticisi, organizasyon yöneticisi ve denetçi rolleri
- **JWT tabanlı kimlik doğrulama**: Güvenli token tabanlı oturum yönetimi
- **Organizasyon bazlı veri izolasyonu**: Her organizasyon kendi verilerine erişir
- **Proje seviyesinde yetkilendirme**: Proje bazlı kullanıcı atama ve erişim kontrolü

##### 👥 Kullanıcı Rolleri

| Rol | Kod | Açıklama |
|-----|-----|----------|
| **Platform Yöneticisi** | `platform_admin` | Tüm sisteme tam erişim, tüm organizasyonları yönetir |
| **Organizasyon Yöneticisi** | `org_admin` | Kendi organizasyonuna tam erişim |
| **Denetçi** | `auditor` | Atandığı projelere erişim |

##### 🔑 Yetki Matrisi

| İşlem | Platform Admin | Org Admin | Auditor |
|-------|:-------------:|:---------:|:-------:|
| Tüm organizasyonları yönetme | ✅ | ❌ | ❌ |
| Kendi organizasyonunu düzenleme | ✅ | ✅ | ❌ |
| Tüm projeleri görme | ✅ | ❌ | ❌ |
| Org. projelerini yönetme | ✅ | ✅ | ❌ |
| Atandığı projelerde çalışma | ✅ | ✅ | ✅ |
| Kullanıcı oluşturma/silme | ✅ | ✅* | ❌ |
| Denetim oluşturma | ✅ | ✅ | ✅ |
| Bulgu oluşturma/düzenleme | ✅ | ✅ | ✅ |
| Şablon oluşturma | ✅ | ✅ | ❌ |
| Rapor indirme | ✅ | ✅ | ✅ |

*Org Admin sadece kendi organizasyonunda ve platform_admin hariç kullanıcı oluşturabilir

#### 📋 Denetim Yönetimi
- **Standart tabanlı denetimler**: 20+ uluslararası ve ulusal güvenlik standardı desteği
- **Şablon tabanlı denetim oluşturma**: Önceden tanımlanmış kontrol listeleri ile hızlı denetim başlatma
- **Otomatik bulgu oluşturma**: Şablon kontrollerinden otomatik bulgu oluşturma
- **Dil seçimi**: Denetim oluştururken şablon dilini seçme (Türkçe/İngilizce)
- **Denetim durumu takibi**: Planlama, devam ediyor, tamamlandı, iptal edildi durumları
- **Denetim kopyalama**: Mevcut denetimleri referans alarak yeni denetimler oluşturma

#### 🔍 Bulgu Yönetimi
- **Kapsamlı bulgu kaydı**: Başlık, açıklama, kontrol referansı, önem seviyesi, durum, öneriler
- **Bulgu atama sistemi**: Bulguları belirli denetçilere atama ve sorumluluk takibi
- **Son tarih yönetimi**: Bulgular için son tarih belirleme ve otomatik bildirimler
- **Yorum ve tartışma sistemi**: Bulgular hakkında ekip içi iletişim ve işbirliği (yorum ekleme, görüntüleme, silme)
- **Durum yönetimi**: Açık, devam ediyor, çözüldü, kapatıldı durum takibi
- **Önem seviyesi kategorilendirme**: Kritik, yüksek, orta, düşük, bilgi seviyeleri
- **Kişisel bulgu görünümü**: Kullanıcıya atanmış bulguları filtreleme ve görüntüleme
- **Gelişmiş status filtresi**: Tüm durumlar, aktif bulgular, açık, devam ediyor, çözüldü, kapatıldı seçenekleri ile detaylı filtreleme
- **Görsel durum farklılaştırma**: Çözülmüş bulgular için otomatik görsel ayırt etme (soluk renkler, üstü çizili başlık, onay işareti)
- **Renkli durum badge'leri**: Her durum için farklı renk kodlu görsel göstergeler (mavi: açık, sarı: devam ediyor, yeşil: çözüldü, gri: kapatıldı)
- **Akıllı sıralama**: Aktif bulgular üstte, çözülmüş bulgular altta otomatik sıralama

#### 📎 Kanıt Yönetimi
- **Çoklu dosya yükleme**: Her bulgu için görsel ve döküman kanıt ekleme
- **Görüntü ve dosya desteği**: PNG, JPG, PDF ve diğer formatlar
- **Dosya önizleme ve indirme**: Yüklenen kanıtların görüntülenmesi ve indirilmesi
- **Kanıt açıklamaları**: Her kanıt dosyası için açıklama ekleme
- **Kanıt silme**: Yüklenen kanıtları silme özelliği

#### 📊 Raporlama ve Analitik
- **Word rapor üretimi**: Düzenlenebilir .docx formatında profesyonel denetim raporları (kapak sayfası, içindekiler, özet, metodoloji, detaylı bulgular)
- **Dashboard analitikleri**: Genel bakış, istatistikler ve trend analizleri
- **Severity dağılımı**: Bulguların önem seviyesine göre dağılım analizi
- **Durum dağılımı**: Denetim ve bulgu durumlarının görselleştirilmesi
- **Acil bulgu takibi**: Kritik ve yüksek öncelikli açık bulguların izlenmesi
- **Özelleştirilebilir dashboard**: Görünürlük ve sıralama kontrolü ile kişiselleştirilebilir paneller
- **Trend grafikleri**: Son 14 günlük bulgu trendini gösteren interaktif çizgi grafikler

#### 🔔 Bildirim ve İzleme
- **Dedike bildirimler sayfası**: Sol menüden erişilebilen tüm bildirimleri görüntüleme ve yönetme sayfası
- **Çok dilli bildirim desteği**: Bildirim başlık ve mesajlarının kullanıcı dil tercihine göre otomatik çevirisi
- **Bildirim türleri**: Bulgu atama, bulgu son tarih uyarısı, bulgu gecikme, bulgu durum değişikliği, yorum ekleme, denetim durum değişikliği
- **Bildirim filtreleme**: Tümü, okunmamış, okunmuş bildirimleri filtreleme
- **Bildirim yönetimi**: Okunmamış bildirim sayısı, bildirimleri okuma, toplu okuma, bildirim silme
- **Bildirim navigasyonu**: Bulgu veya denetim bildirimlerine tıklandığında ilgili bulgu/denetim detay sayfasına yönlendirme
- **Aktivite logu (Audit Trail)**: Tüm sistem aktivitelerinin kaydı (oluşturma, güncelleme, silme işlemleri)
- **Aktivite görüntüleme**: Varlık bazlı (organizasyon, proje, denetim, bulgu) aktivite geçmişi
- **Kullanıcı bazlı bildirimler**: Kişiselleştirilmiş bildirim akışı

#### 📚 Şablon Yönetimi
- **Hazır denetim şablonları**: ISO 27001, PCI DSS, GDPR, KVKK, NIST, CIS, SOC 2, OWASP Top 10, OWASP ASVS, OWASP API Security, OWASP Mobile, ISO 27017, ISO 27018, ISO 22301, HIPAA, COBIT, ENISA, CMMC, FedRAMP, ITIL standartları için tam kontrol listeleri
- **Çok dilli şablon desteği**: Şablonlar ve şablon öğeleri için Türkçe ve İngilizce içerik desteği
- **Özel şablon oluşturma**: Organizasyon özelinde özelleştirilmiş şablonlar
- **Şablon düzenleme**: Mevcut şablonların özelleştirilmesi ve güncellenmesi
- **Şablon öğe yönetimi**: Şablonlara öğe ekleme, düzenleme ve silme
- **Sistem şablonu koruması**: Varsayılan şablonların silinmesini ve değiştirilmesini engelleme (veritabanı seviyesinde)
- **Şablon kopyalama**: Sistem şablonlarından düzenlenebilir kopyalar oluşturma

#### 🌐 Çoklu Dil Desteği
- **Türkçe ve İngilizce**: Tam çeviri desteği
- **Kullanıcı arayüzü çevirisi**: Tüm menü, buton, form ve mesajlar için çeviri desteği
- **Şablon çok dilli içerik**: Şablon başlık, açıklama ve öneriler için Türkçe/İngilizce alanlar
- **Denetim dil seçimi**: Denetim oluştururken şablon içeriğinin dilini seçme
- **Dinamik dil değişimi**: Sayfa yenilemeden dil değiştirme
- **Genişletilebilir dil yapısı**: Kolay dil ekleme imkanı
- **Kullanıcı tercihi**: Bireysel dil seçimi (ayarlarda saklanır)

#### 🎨 Modern Kullanıcı Arayüzü
- **Responsive tasarım**: Masaüstü, tablet ve mobil cihaz desteği
- **Sezgisel navigasyon**: Kolay kullanılabilir menü yapısı
- **Modern UI/UX**: Tailwind CSS tabanlı profesyonel tasarım
- **Hızlı arama ve filtreleme**: Gelişmiş arama ve filtreleme özellikleri
- **Gerçek zamanlı güncellemeler**: Anlık veri senkronizasyonu
- **Profesyonel footer**: Her sayfanın altında copyright bilgisi ve website linki (archrampart.com)
- **SEO optimize**: HTML meta tags, Open Graph ve Twitter Card desteği

#### 🌙 Karanlık Mod (Dark Mode)
- **Tam karanlık tema desteği**: Tüm sayfalarda göz yormayan koyu tema
- **Otomatik tema hatırlama**: Kullanıcı tercihi localStorage'da saklanır
- **Tek tıkla geçiş**: Sidebar'dan kolay tema değiştirme

#### 🔍 Global Arama
- **Header'da arama**: Tüm uygulama genelinde hızlı arama
- **Çoklu kaynak arama**: Denetimler, bulgular, projeler ve organizasyonlarda arama
- **Anlık sonuçlar**: Debounced arama ile hızlı sonuçlar
- **Klavye kısayolu**: Cmd/Ctrl + K ile hızlı erişim

#### 🔒 Veri Güvenliği
- **On-premise deployment**: Verilerinizin tam kontrolü
- **Güvenli dosya yükleme**: Dosya boyutu ve tip kontrolü
- **Yedekleme ve geri yükleme**: Otomatik yedekleme araçları
- **Kullanıcı güvenliği**: Kullanıcıların kendi hesaplarını silmelerini engelleme
- **Rol tabanlı erişim**: Her işlem için rol bazlı yetkilendirme kontrolü

---

## 🇬🇧 English

### 🎯 Target Audience

- **Information Security Auditors**: Professionals conducting audits according to ISO 27001 and other information security standards
- **Cybersecurity Specialists**: Experts performing network and system security assessments
- **Compliance Managers**: Teams responsible for ensuring compliance with legal and regulatory requirements such as GDPR, KVKK, PCI DSS
- **IT Auditors**: Auditors performing security controls on IT infrastructure and applications
- **Enterprise Security Teams**: Teams monitoring and reporting security status across the organization
- **Consulting Firms**: Companies providing security audit services to clients

### 💼 Use Cases

- **Internal Audit Activities**: In-house information security and cybersecurity assessments
- **Certification Preparation**: Preparation audits for certifications like ISO 27001, SOC 2
- **Compliance Checks**: Compliance assessments for legal requirements such as GDPR, KVKK, HIPAA
- **Project Security Assessments**: Security controls for new systems and applications
- **Periodic Security Scans**: Regular security assessments conducted at intervals
- **External Audit Coordination**: Management of collaborative work with external auditors

### 🎯 Purpose and Scope

ArchRampart Audit Tool is designed for organizations conducting information security audits, cybersecurity assessments, and compliance controls. The system digitizes all stages of audit processes to:

- **Standardize** audit planning and execution
- **Automate** finding management and tracking
- **Facilitate** reporting and documentation
- **Optimize** business processes
- **Visualize** compliance status

The platform supports audits according to international and national security standards such as ISO/IEC 27001, PCI DSS, GDPR, KVKK, NIST Cybersecurity Framework, CIS Controls, SOC 2, OWASP standards, HIPAA, COBIT, ISO 22301, ENISA, CMMC, FedRAMP, ITIL.

### ✨ Features

#### 🏢 Organization and Project Management
- **Multi-organization support**: Management of different organizations in independent audit environments
- **Hierarchical structure**: Organization → Project → Audit → Finding logical hierarchy
- **Flexible project configuration**: Project organization based on business unit, department, or system
- **Project copying**: Create new projects by referencing existing ones

#### 🔐 Security and Authorization
- **Role-based access control (RBAC)**: Platform administrator, organization administrator, and auditor roles
- **JWT-based authentication**: Secure token-based session management
- **Organization-based data isolation**: Each organization accesses only its own data
- **Project-level authorization**: Project-based user assignment and access control

##### 👥 User Roles

| Role | Code | Description |
|------|------|-------------|
| **Platform Administrator** | `platform_admin` | Full access to entire system, manages all organizations |
| **Organization Administrator** | `org_admin` | Full access to their own organization |
| **Auditor** | `auditor` | Access to assigned projects only |

##### 🔑 Permission Matrix

| Action | Platform Admin | Org Admin | Auditor |
|--------|:-------------:|:---------:|:-------:|
| Manage all organizations | ✅ | ❌ | ❌ |
| Edit own organization | ✅ | ✅ | ❌ |
| View all projects | ✅ | ❌ | ❌ |
| Manage org projects | ✅ | ✅ | ❌ |
| Work on assigned projects | ✅ | ✅ | ✅ |
| Create/delete users | ✅ | ✅* | ❌ |
| Create audits | ✅ | ✅ | ✅ |
| Create/edit findings | ✅ | ✅ | ✅ |
| Create templates | ✅ | ✅ | ❌ |
| Download reports | ✅ | ✅ | ✅ |

*Org Admin can only create users within their organization and cannot create platform_admin users

#### 📋 Audit Management
- **Standard-based audits**: Support for 20+ international and national security standards
- **Template-based audit creation**: Quick audit initiation with pre-defined control lists
- **Automatic finding creation**: Automatic finding creation from template controls
- **Language selection**: Choose template language (Turkish/English) when creating audits
- **Audit status tracking**: Planning, in progress, completed, cancelled states
- **Audit copying**: Create new audits by referencing existing ones

#### 🔍 Finding Management
- **Comprehensive finding records**: Title, description, control reference, severity level, status, recommendations
- **Finding assignment system**: Assign findings to specific auditors and track responsibilities
- **Due date management**: Set due dates for findings and automatic notifications
- **Comment and discussion system**: Team communication and collaboration on findings (add, view, delete comments)
- **Status management**: Open, in progress, resolved, closed status tracking
- **Severity level categorization**: Critical, high, medium, low, info levels
- **Personal finding view**: Filter and view findings assigned to the current user
- **Advanced status filtering**: Detailed filtering with options for all statuses, active findings, open, in progress, resolved, closed
- **Visual status differentiation**: Automatic visual distinction for resolved findings (muted colors, strikethrough title, checkmark icon)
- **Color-coded status badges**: Different color-coded visual indicators for each status (blue: open, yellow: in progress, green: resolved, gray: closed)
- **Smart sorting**: Automatic sorting with active findings at top, resolved findings at bottom

#### 📎 Evidence Management
- **Multiple file upload**: Add visual and document evidence for each finding
- **Image and file support**: PNG, JPG, PDF and other formats
- **File preview and download**: View and download uploaded evidence
- **Evidence descriptions**: Add descriptions to each evidence file
- **Evidence deletion**: Delete uploaded evidence files

#### 📊 Reporting and Analytics
- **Word report generation**: Professional audit reports in editable .docx format (cover page, table of contents, summary, methodology, detailed findings)
- **Dashboard analytics**: Overview, statistics, and trend analysis
- **Severity distribution**: Analysis of finding distribution by severity level
- **Status distribution**: Visualization of audit and finding statuses
- **Critical finding tracking**: Monitoring of critical and high-priority open findings
- **Customizable dashboard**: Personalized panels with visibility and sorting control
- **Trend charts**: Interactive line charts showing finding trends over the last 14 days

#### 🔔 Notifications and Monitoring
- **Dedicated notifications page**: Accessible from left menu, view and manage all notifications in one place
- **Multi-language notification support**: Automatic translation of notification titles and messages based on user language preference
- **Notification types**: Finding assignment, finding due date warning, finding overdue, finding status change, comment added, audit status change
- **Notification filtering**: Filter notifications by all, unread, or read status
- **Notification management**: Unread notification count, mark as read, mark all as read, delete notifications
- **Notification navigation**: Click on finding or audit notifications to navigate to the related finding/audit detail page
- **Activity log (Audit Trail)**: Recording of all system activities (create, update, delete operations)
- **Activity viewing**: Entity-based (organization, project, audit, finding) activity history
- **User-based notifications**: Personalized notification flow

#### 📚 Template Management
- **Pre-built audit templates**: Complete control lists for ISO 27001, PCI DSS, GDPR, KVKK, NIST, CIS, SOC 2, OWASP Top 10, OWASP ASVS, OWASP API Security, OWASP Mobile, ISO 27017, ISO 27018, ISO 22301, HIPAA, COBIT, ENISA, CMMC, FedRAMP, ITIL standards
- **Multi-language template support**: Turkish and English content support for templates and template items
- **Custom template creation**: Organization-specific customized templates
- **Template editing**: Customization and updating of existing templates
- **Template item management**: Add, edit, and delete items from templates
- **System template protection**: Prevention of deletion and modification of default templates (database-level)
- **Template copying**: Create editable copies from system templates

#### 🌐 Multi-Language Support
- **Turkish and English**: Full translation support
- **User interface translation**: Translation support for all menus, buttons, forms, and messages
- **Multi-language template content**: Turkish/English fields for template titles, descriptions, and recommendations
- **Audit language selection**: Choose template content language when creating audits
- **Dynamic language switching**: Change language without page refresh
- **Extensible language structure**: Easy language addition capability
- **User preference**: Individual language selection (saved in settings)

#### 🎨 Modern User Interface
- **Responsive design**: Desktop, tablet, and mobile device support
- **Intuitive navigation**: Easy-to-use menu structure
- **Modern UI/UX**: Professional Tailwind CSS-based design
- **Fast search and filtering**: Advanced search and filtering features
- **Real-time updates**: Instant data synchronization
- **Professional footer**: Copyright information and website link (archrampart.com) at the bottom of every page
- **SEO optimized**: HTML meta tags, Open Graph and Twitter Card support

#### 🌙 Dark Mode
- **Full dark theme support**: Eye-friendly dark theme on all pages
- **Automatic theme memory**: User preference saved in localStorage
- **One-click toggle**: Easy theme switching from sidebar

#### 🔍 Global Search
- **Header search**: Quick search across the entire application
- **Multi-source search**: Search across audits, findings, projects, and organizations
- **Instant results**: Fast results with debounced search
- **Keyboard shortcut**: Quick access with Cmd/Ctrl + K

#### 🔒 Data Security
- **On-premise deployment**: Full control of your data
- **Secure file upload**: File size and type control
- **Backup and restore**: Automated backup tools
- **User security**: Prevention of users deleting their own accounts
- **Role-based access**: Role-based authorization control for all operations

---

## Technology Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Word Generation**: python-docx
- **i18n**: react-i18next (frontend)
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand

## 🌍 Supported Security Standards

- **ISO/IEC 27001**: Information Security Management System
- **PCI DSS**: Payment Card Industry Data Security Standard
- **GDPR**: General Data Protection Regulation
- **KVKK**: Personal Data Protection Law
- **NIST Cybersecurity Framework**: National Institute of Standards and Technology Cybersecurity Framework
- **CIS Controls**: Center for Internet Security Controls
- **SOC 2**: Service Organization Control 2
- **OWASP Top 10**: Open Web Application Security Project - Top 10 Critical Risks
- **OWASP ASVS**: Application Security Verification Standard
- **OWASP API Security Top 10**: API Security Top 10 Critical Risks
- **OWASP Mobile Top 10**: Mobile Application Security Top 10 Critical Risks
- **ISO/IEC 27017**: Cloud Computing Security
- **ISO/IEC 27018**: Cloud Computing Personal Data Protection
- **HIPAA**: Health Insurance Portability and Accountability Act
- **COBIT**: Control Objectives for Information and Related Technologies
- **ENISA**: European Union Agency for Cybersecurity Guidelines
- **CMMC**: Cybersecurity Maturity Model Certification
- **FedRAMP**: Federal Risk and Authorization Management Program
- **ITIL**: IT Infrastructure Library - Security Management
- **ISO 22301**: Business Continuity Management

## 🚀 Quick Start (Docker - Recommended)

### Single Command Installation and Startup

The easiest way to get started is using Docker with a single command:

```bash
./docker-up.sh
```

This single command will:
- ✅ Check Docker and Docker Compose installation
- ✅ Build Docker images (if needed)
- ✅ Start PostgreSQL database container
- ✅ Start Backend container (auto-creates database tables, runs migrations, creates default templates and admin user)
- ✅ Start Frontend container
- ✅ Display access information and credentials

### Access Information

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:9090
- **API Documentation**: http://localhost:9090/docs

### Default Admin User

- **Email**: `admin@archrampart.com`
- **Password**: `admin123`

### Customization

You can customize settings by creating a `.env` file:

```bash
# Example .env file
POSTGRES_USER=archrampart
POSTGRES_PASSWORD=archrampart_pass
POSTGRES_DB=archrampart_audit
SECRET_KEY=your-secret-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
ADMIN_NAME=Admin User
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop services and delete volumes (use with caution!)
docker-compose down -v

# Restart services
docker-compose restart

# Check service status
docker-compose ps
```

## 📦 Manual Installation

### Requirements

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env file

# Database tables are created automatically on first run
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🏭 Production Deployment

For production environment, use `docker-compose.prod.yml`:

```bash
# Production build
docker-compose -f docker-compose.prod.yml build

# Start in production
docker-compose -f docker-compose.prod.yml up -d
```

Production settings:
- Frontend: Served with Nginx (port 80)
- Backend: Runs with multiple workers
- Debug: Disabled
- CORS: Only specified origins

## 📝 First Use

When started with Docker:
1. ✅ Database is created automatically
2. ✅ Tables are created automatically
3. ✅ Migrations run automatically
4. ✅ Default templates are created automatically
5. ✅ Admin user is created automatically
6. ✅ Application is ready!

For manual installation:
1. Create PostgreSQL database
2. Start Backend (tables are created automatically)
3. Create admin user with `python backend/scripts/create_admin.py`
4. Create templates with `python backend/scripts/create_default_templates_full.py`
5. Start Frontend and log in

## API Documentation

After Backend starts:
- Swagger UI: http://localhost:9090/docs
- ReDoc: http://localhost:9090/redoc

## Project Structure

```
rampart/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core utilities (config, security, dependencies)
│   │   ├── db/           # Database configuration
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic services
│   ├── scripts/          # Utility scripts
│   ├── Dockerfile        # Backend Docker image
│   ├── docker-init.sh    # Initialization script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # State management
│   │   └── i18n/         # Internationalization
│   ├── Dockerfile        # Frontend dev Docker image
│   ├── Dockerfile.prod   # Frontend production Docker image
│   ├── nginx.conf        # Nginx configuration (production)
│   └── package.json
├── docker-compose.yml         # Development compose
├── docker-compose.prod.yml    # Production compose
├── docker-up.sh               # Quick start script (Docker)
├── backup.sh                  # Backup script
├── restore.sh                 # Restore script
├── start.sh                   # Manual start script (non-Docker)
├── stop.sh                    # Manual stop script (non-Docker)
└── README.md
```

## Development

### Backend Test

```bash
cd backend
pytest
```

### Frontend Test

```bash
cd frontend
npm test
```

## License

This project is proprietary.
