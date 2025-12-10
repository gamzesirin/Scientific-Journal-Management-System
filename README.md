# Yapay Zeka Destekli Bilimsel Dergi Yönetim Sistemi

Modern ve güçlü bir akademik dergi yönetim sistemi. Next.js 15, TypeScript, Supabase ve Tailwind CSS ile geliştirilmiştir.

---

## Teknoloji Stack'i

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

## Kurulum ve Başlangıç

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

## Kullanım Kılavuzu

### Kayıt ve Giriş

1. `/auth/register` sayfasından kayıt olun
2. Email doğrulama linkine tıklayın
3. `/auth/login` sayfasından giriş yapın
4. Otomatik olarak rolünüze göre dashboard'a yönlendirileceksiniz

###  Roller ve Yetkiler

#### Yazar (Author)

**Yapabilecekleri:**

- ✅ Yeni makale gönderimi (PDF/Word)
- ✅ Makale durum takibi
- ✅ Revizyon yükleme
- ✅ Ortak yazar ekleme
- ✅ Makale geçmişini görme
- ✅ Hakem yorumlarını görme (editör onayından sonra)

**Sayfalar:**

- Dashboard: `/dashboard` (yazar için)
- Makale Listesi: `/articles`
- Makale Detay: `/articles/[id]`
- Makale Yükleme: `/articles/upload`

#### Editör (Editor)

**Yapabilecekleri:**

- ✅ Atanan makaleleri görüntüleme
- ✅ Desk evaluation (ön değerlendirme)
- ✅ Hakem atama ve davet
- ✅ Hakem raporlarını görüntüleme
- ✅ Karar verme (Accept/Reject/Revision)
- ✅ Yazara geri bildirim gönderme

**Sayfalar:**

- Editor Dashboard: `/editor`
- Makale Listesi: `/editor/articles`
- Makale Detay: `/editor/articles/[id]`
- Hakem Atama: `/editor/articles/[id]/assign`
- Karar Verme: `/editor/articles/[id]/decision`

#### Hakem (Reviewer)

**Yapabilecekleri:**

- ✅ Atanmış makaleleri indirme
- ✅ Detaylı değerlendirme formu doldurma
- ✅ Puanlama (1-5 skala)
- ✅ Editöre gizli yorum
- ✅ Yazara açık yorum
- ✅ CV yükleme

**Sayfalar:**

- Reviewer Dashboard: `/dashboard` (hakem için)
- Atanmış Makaleler: Listede görünür
- Review Formu: `/reviews/[id]`

#### Admin

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

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

Sorularınız veya önerileriniz için:
- 💬 GitHub Issues: [Create an issue](https://github.com/gamzesirin/scientific-journal-management/issues)


**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**
