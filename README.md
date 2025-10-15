# 📚 Bilimsel Dergi Yönetim Sistemi

Modern ve güçlü bir akademik dergi yönetim sistemi. Next.js 15, TypeScript, Supabase ve Tailwind CSS ile geliştirilmiştir.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## 🌟 Özellikler

### 👥 Çok Rollü Kullanıcı Sistemi

- **Yazar**: Makale gönderimi, revizyon yükleme, durum takibi
- **Hakem**: Değerlendirme formu, makale puanlama, yorum sistemi
- **Editör**: Hakem atama, desk evaluation, karar mekanizması
- **Admin**: Sistem yönetimi, kullanıcı yönetimi, raporlama

### 📝 Makale Yönetimi

- ✅ PDF ve Word formatında makale yükleme (max 10MB)
- ✅ Makale durum takibi (Submitted, Under Review, Accepted, Rejected, Published)
- ✅ Revizyon yükleme ve geçmiş takibi
- ✅ Ortak yazar (co-author) ekleme ve yönetimi
- ✅ Makale timeline (zaman çizelgesi görünümü)
- ✅ Detaylı makale istatistikleri

### 👨‍💼 Editör Özellikleri

- ✅ Desk evaluation (ön değerlendirme) sistemi
- ✅ Hakem atama ve deadline belirleme
- ✅ Makale durum güncelleme
- ✅ Editör bazlı makale filtreleme (güvenlik)
- ✅ Hakem raporlarını görüntüleme
- ✅ Karar mekanizması (Accept, Minor Revision, Major Revision, Reject)
- ✅ Editör istatistikleri ve performans takibi

### 👨‍⚖️ Hakem Özellikleri

- ✅ Atanmış makaleleri görüntüleme
- ✅ Detaylı değerlendirme formu (1-5 puan skalası)
- ✅ Editöre özel gizli yorum
- ✅ Yazara açık yorum
- ✅ Review durumu takibi (Draft/Submitted)
- ✅ Assignment durumu (Pending/In Progress/Completed)
- ✅ Hakem performans istatistikleri
- ✅ CV yükleme sistemi

### 🔐 Güvenlik ve Yetkilendirme

- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control (RBAC)
- ✅ Editör bazlı makale erişimi
- ✅ URL manipülasyon koruması
- ✅ Secure file storage (Supabase Storage)
- ✅ Session management
- ✅ Email verification

### 📊 Admin Paneli

- ✅ Kullanıcı yönetimi (CRUD işlemleri)
- ✅ Rol atama ve düzenleme
- ✅ Editör atama mekanizması
- ✅ Sistem raporları ve istatistikler
- ✅ Activity log takibi
- ✅ Backup ve restore işlemleri
- ✅ Sistem ayarları

### 📈 İstatistik ve Raporlama

- ✅ Dashboard istatistikleri (tüm roller için)
- ✅ Grafik ve chart desteği
- ✅ PDF rapor indirme
- ✅ Activity log görüntüleme
- ✅ Performans metrikleri
- ✅ Tarihsel veri analizi

### 🎨 Modern UI/UX

- ✅ Shadcn UI component library
- ✅ Responsive tasarım (mobile-first)
- ✅ Dark mode desteği (planlı)
- ✅ Toast notifications (Sonner)
- ✅ Loading states ve skeletons
- ✅ Form validation (React Hook Form + Zod)
- ✅ Accessible components (ARIA)

---

## 🛠️ Teknoloji Stack'i

### Frontend

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI + Radix UI
- **Forms**: React Hook Form 7.64 + Zod 4.1.11
- **Icons**: Lucide React 0.544
- **Notifications**: Sonner 2.0.7
- **Date Handling**: date-fns 4.1.0

### Backend

- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime (planlı)
- **API**: Next.js API Routes (REST)

### Development Tools

- **Package Manager**: npm
- **Linter**: ESLint 9
- **Type Checking**: TypeScript Compiler
- **Version Control**: Git

---

## 📁 Proje Yapısı

```
Scientific-Journal-Management-System/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Ana dashboard (rol bazlı redirect)
│   ├── auth/                    # Authentication sayfaları
│   │   ├── login/              # Giriş sayfası
│   │   ├── register/           # Kayıt sayfası
│   │   ├── verify-email/       # Email doğrulama
│   │   └── callback/           # OAuth callback
│   ├── articles/               # Makale sayfaları
│   │   ├── [id]/              # Makale detay
│   │   └── upload/            # Makale yükleme
│   ├── editor/                 # Editör sayfaları
│   │   ├── page.tsx           # Editör dashboard
│   │   └── articles/          # Editör makale yönetimi
│   ├── reviews/                # Hakem değerlendirme
│   │   └── [id]/              # Review detay
│   ├── admin/                  # Admin paneli
│   │   ├── users/             # Kullanıcı yönetimi
│   │   ├── articles/          # Makale yönetimi
│   │   ├── reports/           # Raporlar
│   │   ├── backup/            # Yedekleme
│   │   └── settings/          # Sistem ayarları
│   └── api/                    # API endpoints
│       ├── articles/          # Article API
│       ├── admin/             # Admin API
│       ├── history/           # History API
│       └── storage/           # Storage API
│
├── features/                   # Feature-based modules
│   ├── auth/                  # Auth özellikleri
│   │   ├── components/       # Auth componentleri
│   │   ├── actions/          # Server actions
│   │   └── types/            # Type definitions
│   ├── dashboard/             # Dashboard özellikleri
│   │   ├── components/       # Dashboard componentleri
│   │   └── types/
│   ├── articles/              # Makale özellikleri
│   │   ├── components/       # Article componentleri
│   │   │   ├── ArticleList.tsx
│   │   │   ├── ArticleUploadForm.tsx
│   │   │   ├── ArticleTimeline.tsx
│   │   │   ├── CoauthorsManager.tsx
│   │   │   ├── RevisionHistory.tsx
│   │   │   └── RevisionUploadForm.tsx
│   │   ├── actions/
│   │   └── types/
│   ├── editor/                # Editör özellikleri
│   │   ├── components/
│   │   │   ├── PapersList.tsx
│   │   │   ├── AssignReviewerForm.tsx
│   │   │   ├── DecisionForm.tsx
│   │   │   ├── EditorDeskEvaluationForm.tsx
│   │   │   └── EditorStatistics.tsx
│   │   └── types/
│   ├── reviewer/              # Hakem özellikleri
│   │   ├── components/
│   │   │   ├── AssignedPapersList.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── ReviewStatistics.tsx
│   │   │   └── CVUploadSection.tsx
│   │   └── types/
│   ├── admin/                 # Admin özellikleri
│   │   └── components/
│   │       ├── UsersManagementTable.tsx
│   │       ├── AdminArticlesTable.tsx
│   │       ├── ReportsCharts.tsx
│   │       ├── BackupManager.tsx
│   │       ├── ActivityLog.tsx
│   │       └── SystemSettingsForm.tsx
│   └── history/               # Geçmiş takibi
│       ├── components/
│       │   ├── HistoryViewer.tsx
│       │   └── HistoryStats.tsx
│       └── types/
│
├── lib/                       # Utilities ve helpers
│   ├── supabase/             # Supabase client
│   │   ├── client.ts        # Client-side
│   │   └── server.ts        # Server-side
│   ├── storage/              # File upload/download
│   │   └── upload.ts
│   ├── auth/                 # Auth utilities
│   │   └── roles.ts
│   ├── history/              # History logging
│   │   ├── historyLogger.ts
│   │   └── historyQueries.ts
│   └── utils.ts              # Genel utilities
│
├── components/               # UI components (Shadcn)
│   ├── common/              # Ortak componentler
│   │   ├── Navbar.tsx
│   │   ├── pdf-actions.tsx
│   │   └── pdf-download-section.tsx
│   └── ui/                  # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── alert.tsx
│       └── ... (30+ component)
│
├── hooks/                    # Custom React hooks
│   └── useUserRole.ts
│
├── middleware.ts             # Route protection
│
└── Database Scripts/         # SQL scripts
    ├── supabase-revisions-coauthors-setup.sql
    ├── supabase-editor-desk-evaluation-setup.sql
    ├── supabase-history-authors-policy.sql
    └── supabase-history-foreign-keys.sql
```

---

## 🚀 Kurulum ve Başlangıç

### Gereksinimler

- Node.js 20+
- npm veya yarn
- Supabase hesabı

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yourusername/scientific-journal-management.git
cd scientific-journal-management
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Variables Ayarlayın

`.env.local` dosyası oluşturun:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Supabase Database Setup

Supabase Dashboard → SQL Editor'de aşağıdaki scriptleri sırayla çalıştırın:

1. **Users Tablosu ve Auth Trigger** (ROADMAP.md'deki SQL kodları)
2. **Papers, Assignments, Reviews, Decisions Tabloları**
3. **RLS Policies**
4. **Revisions ve Coauthors Setup**:
   ```bash
   # Dosyayı çalıştır
   supabase-revisions-coauthors-setup.sql
   ```
5. **Editor Desk Evaluation**:
   ```bash
   supabase-editor-desk-evaluation-setup.sql
   ```
6. **History System**:
   ```bash
   supabase-history-authors-policy.sql
   supabase-history-foreign-keys.sql
   ```

### 5. Storage Buckets Oluşturun

Supabase Dashboard → Storage:

- **papers** (Private, max 10MB, application/pdf)
- **avatars** (Public, max 2MB, image/\*)
- **cvs** (Private, max 5MB, application/pdf)

### 6. Development Server Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 📖 Kullanım Kılavuzu

### 🔐 Kayıt ve Giriş

1. `/auth/register` sayfasından kayıt olun
2. Email doğrulama linkine tıklayın
3. `/auth/login` sayfasından giriş yapın
4. Otomatik olarak rolünüze göre dashboard'a yönlendirileceksiniz

### 👤 Roller ve Yetkiler

#### 🖊️ Yazar (Author)

**Yapabilecekleri:**

- ✅ Yeni makale gönderimi (PDF/Word)
- ✅ Makale durum takibi
- ✅ Revizyon yükleme
- ✅ Ortak yazar ekleme
- ✅ Makale geçmişini görme
- ✅ Hakem yorumlarını görme (editör onayından sonra)

**Yapamayacakları:**

- ❌ Başkalarının makalelerini görme
- ❌ Hakem isimlerini görme
- ❌ Editörlük işlemleri

**Sayfalar:**

- Dashboard: `/dashboard` (yazar için)
- Makale Listesi: `/articles`
- Makale Detay: `/articles/[id]`
- Makale Yükleme: `/articles/upload`

#### 👨‍💼 Editör (Editor)

**Yapabilecekleri:**

- ✅ Atanan makaleleri görüntüleme
- ✅ Desk evaluation (ön değerlendirme)
- ✅ Hakem atama ve davet
- ✅ Hakem raporlarını görüntüleme
- ✅ Karar verme (Accept/Reject/Revision)
- ✅ Yazara geri bildirim gönderme

**Yapamayacakları:**

- ❌ Atanmamış makalelere erişim (güvenlik)
- ❌ Sistem ayarlarını değiştirme
- ❌ Kullanıcı ekleme/silme

**Sayfalar:**

- Editor Dashboard: `/editor`
- Makale Listesi: `/editor/articles`
- Makale Detay: `/editor/articles/[id]`
- Hakem Atama: `/editor/articles/[id]/assign`
- Karar Verme: `/editor/articles/[id]/decision`

#### 👨‍⚖️ Hakem (Reviewer)

**Yapabilecekleri:**

- ✅ Atanmış makaleleri indirme
- ✅ Detaylı değerlendirme formu doldurma
- ✅ Puanlama (1-5 skala)
- ✅ Editöre gizli yorum
- ✅ Yazara açık yorum
- ✅ CV yükleme

**Yapamayacakları:**

- ❌ Diğer hakemlerin yorumlarını görme
- ❌ Yazar bilgilerini görme (çift-kör hakemlik)
- ❌ Nihai karar verme (sadece öneri)

**Sayfalar:**

- Reviewer Dashboard: `/dashboard` (hakem için)
- Atanmış Makaleler: Listede görünür
- Review Formu: `/reviews/[id]`

#### 👑 Admin

**Yapabilecekleri:**

- ✅ Tüm kullanıcı yönetimi
- ✅ Rol atama ve düzenleme
- ✅ Editör atama mekanizması
- ✅ Sistem raporları
- ✅ Activity log görüntüleme
- ✅ Backup ve restore
- ✅ Sistem ayarları

**Sayfalar:**

- Admin Dashboard: `/admin`
- Kullanıcı Yönetimi: `/admin/users`
- Makale Yönetimi: `/admin/articles`
- Raporlar: `/admin/reports`
- Yedekleme: `/admin/backup`
- Ayarlar: `/admin/settings`

---

## 🗄️ Database Schema

### Tablolar

#### `users`

```sql
- id (uuid, PK, references auth.users)
- email (varchar, unique)
- name (varchar)
- affiliation (varchar)
- role (varchar: admin, editor, reviewer, author)
- is_active (boolean)
- expertise_areas (text[])
- created_at, updated_at (timestamp)
```

#### `articles` (papers)

```sql
- id (uuid, PK)
- title (text)
- abstract (text)
- keywords (text[])
- file_url (text)
- author_id (uuid, FK → users)
- assigned_editor_id (uuid, FK → users)
- status (varchar: submitted, under_review, accepted, rejected, published)
- submitted_at, created_at, updated_at (timestamp)
```

#### `coauthors`

```sql
- id (uuid, PK)
- article_id (uuid, FK → articles)
- name (varchar)
- email (varchar)
- affiliation (varchar)
- order_index (int)
- created_at (timestamp)
```

#### `revisions`

```sql
- id (uuid, PK)
- article_id (uuid, FK → articles)
- version_number (int)
- file_url (text)
- changes_summary (text)
- uploaded_at (timestamp)
```

#### `assignments`

```sql
- id (uuid, PK)
- paper_id (uuid, FK → articles)
- reviewer_id (uuid, FK → users)
- assigned_by_editor_id (uuid, FK → users)
- status (varchar: pending, in_progress, completed)
- deadline (timestamp)
- assigned_at, completed_at (timestamp)
```

#### `reviews`

```sql
- id (uuid, PK)
- paper_id (uuid, FK → articles)
- reviewer_id (uuid, FK → users)
- assignment_id (uuid, FK → assignments)
- overall_score (int 1-5)
- recommendation (varchar: accept, minor_revision, major_revision, reject)
- comments (text)
- status (varchar: draft, submitted)
- created_at, updated_at, submitted_at (timestamp)
```

#### `decisions`

```sql
- id (uuid, PK)
- paper_id (uuid, FK → articles)
- editor_id (uuid, FK → users)
- decision_type (varchar: accept, reject, revision)
- decision_reason (text)
- status (varchar: draft, final)
- created_at, updated_at, finalized_at (timestamp)
```

#### `editor_desk_evaluations`

```sql
- id (uuid, PK)
- article_id (uuid, FK → articles)
- editor_id (uuid, FK → users)
- evaluation_result (varchar: accept, reject)
- comments (text)
- created_at, updated_at (timestamp)
```

#### `history`

```sql
- id (uuid, PK)
- table_name (varchar)
- record_id (uuid)
- action (varchar: created, updated, deleted)
- changed_fields (jsonb)
- changed_by (uuid, FK → users)
- created_at (timestamp)
```

### Storage Buckets

- **papers**: Makale PDF dosyaları (Private, 10MB max)
- **avatars**: Kullanıcı profil resimleri (Public, 2MB max)
- **cvs**: Hakem CV'leri (Private, 5MB max)

---

## 🔒 Güvenlik

### Row Level Security (RLS)

Tüm tablolarda RLS aktif. Her kullanıcı yalnızca yetkili olduğu verilere erişebilir.

### Örnek RLS Policy:

```sql
-- Yazarlar sadece kendi makalelerini görür
CREATE POLICY "Authors see own papers"
  ON papers FOR SELECT
  USING (auth.uid() = author_id);

-- Editörler atandıkları makaleleri görür
CREATE POLICY "Editors see assigned papers"
  ON papers FOR SELECT
  USING (auth.uid() = assigned_editor_id);
```

### Middleware Protection

```typescript
// middleware.ts
// Protected routes: /dashboard, /editor, /admin, /reviews
// Oturum yoksa → /auth/login
// Oturum varsa auth sayfalarında → /dashboard
```

---

## 📊 İlerleme Durumu

| Özellik                    | Durum        | Tamamlanma |
| -------------------------- | ------------ | ---------- |
| ✅ Authentication          | Tamamlandı   | 100%       |
| ✅ Database Setup          | Tamamlandı   | 100%       |
| ✅ Storage Setup           | Tamamlandı   | 100%       |
| ✅ Yazar Paneli            | Tamamlandı   | 100%       |
| ✅ Editör Paneli           | Tamamlandı   | 100%       |
| ✅ Hakem Paneli            | Tamamlandı   | 100%       |
| ✅ Admin Paneli            | Tamamlandı   | 100%       |
| ✅ Revizyon Sistemi        | Tamamlandı   | 100%       |
| ✅ Ortak Yazar Yönetimi    | Tamamlandı   | 100%       |
| ✅ History Logging         | Tamamlandı   | 100%       |
| ✅ Desk Evaluation         | Tamamlandı   | 100%       |
| 🔄 Decision System         | Devam Ediyor | 80%        |
| ⬜ Email Notifications     | Planlanıyor  | 0%         |
| ⬜ AI Reviewer Suggestions | Planlanıyor  | 0%         |
| ⬜ Dark Mode               | Planlanıyor  | 0%         |

**Toplam İlerleme**: ~85%

---

## 🎯 Roadmap

### ✅ Tamamlanan Özellikler (Hafta 1-5)

- [x] Proje kurulumu ve konfigürasyonu
- [x] Supabase entegrasyonu
- [x] Authentication sistemi (email/password)
- [x] 4 rol sistemi (Admin, Editor, Reviewer, Author)
- [x] Database schema ve RLS policies
- [x] Storage buckets ve file upload
- [x] Yazar dashboard ve makale yükleme
- [x] Editör dashboard ve hakem atama
- [x] Hakem dashboard ve değerlendirme formu
- [x] Admin paneli ve kullanıcı yönetimi
- [x] Revizyon yükleme sistemi
- [x] Ortak yazar (coauthor) yönetimi
- [x] Makale timeline görünümü
- [x] History logging sistemi
- [x] Editor desk evaluation
- [x] Editör bazlı güvenlik
- [x] CV upload sistemi

### 🔄 Devam Eden (Hafta 6)

- [ ] Decision system (Karar mekanizması)
- [ ] Email notification sistemi
- [ ] Testing ve QA
- [ ] Production deployment

### ⬜ Gelecek Özellikler

- [ ] AI-powered reviewer suggestions
- [ ] Real-time notifications (WebSocket)
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Advanced search ve filtreleme
- [ ] Plagiarism check entegrasyonu
- [ ] DOI assignment
- [ ] Export to XML/JSON

---

## 🧪 Test Kullanıcıları

Geliştirme ortamında test için kullanabilirsiniz:

```
Admin:
  Email: admin@test.com
  Password: Test123!

Editor:
  Email: editor@test.com
  Password: Test123!

Reviewer:
  Email: reviewer@test.com
  Password: Test123!

Author:
  Email: author@test.com
  Password: Test123!
```

**Not**: Production ortamında bu kullanıcıları silmeyi unutmayın!

---

## 📝 API Endpoints

### Articles API

```
GET    /api/articles/[id]                 # Makale detayı
GET    /api/articles/[id]/coauthors       # Ortak yazarlar
POST   /api/articles/[id]/coauthors       # Ortak yazar ekle
DELETE /api/articles/[id]/coauthors/[id]  # Ortak yazar sil
GET    /api/articles/[id]/revision        # Revizyon geçmişi
POST   /api/articles/[id]/revision        # Revizyon yükle
PUT    /api/articles/[id]/status          # Durum güncelle
```

### Admin API

```
GET    /api/admin/users                   # Kullanıcı listesi
POST   /api/admin/users/create            # Kullanıcı oluştur
PUT    /api/admin/users/[id]              # Kullanıcı güncelle
DELETE /api/admin/users/[id]              # Kullanıcı sil
GET    /api/admin/articles                # Tüm makaleler
PUT    /api/admin/articles/[id]           # Editör atama
```

### History API

```
GET    /api/history                       # History listesi
GET    /api/history/stats                 # İstatistikler
```

### Editor Desk Evaluation API

```
GET    /api/editor-desk-evaluations/[articleId]  # Evaluation getir
POST   /api/editor-desk-evaluations/[articleId]  # Evaluation kaydet
```

### Storage API

```
GET    /api/storage/download              # File download
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Vercel CLI kur
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Environment Variables (Production)

Vercel Dashboard'da aşağıdaki environment variables'ı ekleyin:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

### Supabase Production Setup

1. Production Supabase projesi oluşturun
2. SQL scriptleri çalıştırın
3. Storage buckets oluşturun
4. RLS policies aktif edin
5. Environment variables güncelleyin

---

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Mesaj Formatı

```
feat: yeni özellik ekleme
fix: hata düzeltme
docs: dokümantasyon güncelleme
style: kod formatı
refactor: kod iyileştirme
test: test ekleme
chore: genel işler
```

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👥 Yazarlar

- **Proje Ekibi** - _Initial work_

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Radix UI](https://radix-ui.com/) - Primitive components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide Icons](https://lucide.dev/) - Icon library
- Tüm açık kaynak katkıda bulunanlara

---

## 📞 İletişim

Sorularınız veya önerileriniz için:

- 📧 Email: [your-email@example.com]
- 💬 GitHub Issues: [Create an issue](https://github.com/yourusername/scientific-journal-management/issues)

---

## 📚 Ek Dokümantasyon

- [ROADMAP.md](ROADMAP.md) - Detaylı 6 haftalık geliştirme planı
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Proje yapısı açıklaması
- [oku.md](oku.md) - Türkçe rol ve yetki analizi
- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - Kurulum talimatları
- [REVISIONS-COAUTHORS-SETUP.md](REVISIONS-COAUTHORS-SETUP.md) - Revizyon sistemi kurulumu
- [EDITOR-DESK-EVALUATION-SETUP.md](EDITOR-DESK-EVALUATION-SETUP.md) - Desk evaluation kurulumu
- [HISTORY-SETUP.md](HISTORY-SETUP.md) - History logging kurulumu

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by Scientific Journal Management Team

</div>
