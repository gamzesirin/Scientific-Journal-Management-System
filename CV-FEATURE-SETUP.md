# 📄 Hakem Özgeçmiş (CV) Yükleme Özelliği - Kurulum Talimatları

## 🎯 Özellik Özeti

Hakemler artık özgeçmişlerini (CV) yükleyebilir, görüntüleyebilir ve indirebilirler. Bu özellik, gelecekteki AI tabanlı hakem-makale eşleştirme sistemi için kullanılacaktır.

## ✨ Yeni Özellikler

### Hakem Panelinde:

- ✅ Özgeçmiş yükleme (PDF veya DOCX formatında, max 5MB)
- ✅ Yüklenen CV'yi görüntüleme
- ✅ CV'yi indirme
- ✅ CV'yi silme ve yenisini yükleme
- ✅ Kullanıcı dostu arayüz ve durum mesajları

### Teknik Detaylar:

- ✅ Supabase Storage ile güvenli dosya saklama
- ✅ Row Level Security (RLS) ile kullanıcı bazlı erişim kontrolü
- ✅ Admin ve Editörlerin tüm CV'leri görüntüleyebilmesi (AI eşleştirme için)
- ✅ Responsive ve modern UI

## 🚀 Kurulum Adımları

### 1. Supabase Database ve Storage Kurulumu

Aşağıdaki SQL kodunu **Supabase Dashboard → SQL Editor**'de çalıştırın:

\`\`\`sql
-- 1. Add cv_file_url column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cv_file_url text;

-- 2. Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for CVs bucket

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can upload own CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CV" ON storage.objects;
DROP POLICY IF EXISTS "Admins and Editors can view all CVs" ON storage.objects;

-- Policy: Users can upload to own folder
CREATE POLICY "Users can upload own CV"
ON storage.objects FOR INSERT
WITH CHECK (
bucket_id = 'cvs'
AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view own CVs
CREATE POLICY "Users can view own CV"
ON storage.objects FOR SELECT
USING (
bucket_id = 'cvs'
AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update own CVs
CREATE POLICY "Users can update own CV"
ON storage.objects FOR UPDATE
USING (
bucket_id = 'cvs'
AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete own CVs
CREATE POLICY "Users can delete own CV"
ON storage.objects FOR DELETE
USING (
bucket_id = 'cvs'
AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins and Editors can view all CVs (for AI matching)
CREATE POLICY "Admins and Editors can view all CVs"
ON storage.objects FOR SELECT
USING (
bucket_id = 'cvs'
AND EXISTS (
SELECT 1 FROM public.users
WHERE users.id = auth.uid()
AND users.role IN ('admin', 'editor')
)
);
\`\`\`

### 2. Development Sunucusunu Yeniden Başlat

\`\`\`bash

# Mevcut sunucuyu durdur (Ctrl+C)

# Yeniden başlat

npm run dev
\`\`\`

## 📱 Kullanım

### Hakem Olarak:

1. **Giriş Yap**: Hakem hesabınızla sisteme giriş yapın
2. **Dashboard'a Git**: `/dashboard` sayfasına gidin
3. **Özgeçmiş Tab'ına Tıkla**: "Özgeçmiş" sekmesini seçin
4. **CV Yükle**:
   - "Dosya Seç" butonuna tıklayın
   - PDF veya DOCX formatında CV'nizi seçin (max 5MB)
   - "Yükle" butonuna tıklayın
5. **CV'yi Yönet**:
   - **İndir**: İndirme butonuyla CV'nizi bilgisayarınıza kaydedin
   - **Sil**: Silme butonuyla CV'nizi kaldırın
   - **Güncelle**: Yeni bir CV yükleyerek eskisini güncelleyin

### Admin/Editör Olarak:

- Admin ve Editörler, Supabase Storage arayüzünden tüm hakemlerin CV'lerini görüntüleyebilir
- Bu özellik, AI tabanlı hakem-makale eşleştirmesi için kullanılacaktır

## 🔒 Güvenlik Özellikleri

1. **Dosya Tipi Kontrolü**: Sadece PDF ve DOCX formatları kabul edilir
2. **Dosya Boyutu Limiti**: Maksimum 5MB
3. **Kullanıcı İzolasyonu**: Her kullanıcı sadece kendi CV'sini yönetebilir
4. **RLS Koruması**: Row Level Security ile database seviyesinde güvenlik
5. **Storage Policies**: Dosya seviyesinde erişim kontrolü

## 📁 Dosya Yapısı

Yüklenen CV'ler şu formatta saklanır:
\`\`\`
storage/cvs/
├── {userId}/
│ └── cv*{timestamp}.pdf
│ └── cv*{timestamp}.docx
\`\`\`

## 🔮 Gelecek Geliştirmeler (AI Eşleştirme)

Bu özellik, gelecekte şu amaçlar için kullanılacaktır:

1. **AI Tabanlı Uzmanlık Analizi**: CV'lerden hakem uzmanlık alanları otomatik çıkarılacak
2. **Akıllı Hakem-Makale Eşleştirmesi**: Makale konusu ile hakem CV'si karşılaştırılacak
3. **Otomatik Öneri Sistemi**: Editörlere en uygun hakemler önerilecek
4. **Uyumluluk Skoru**: Her hakem için makaleye uygunluk skoru hesaplanacak

## 🎨 Yeni Eklenen Dosyalar

1. **features/reviewer/components/CVUploadSection.tsx** - CV yükleme/yönetim komponenti
2. **supabase-cv-setup.sql** - Database ve Storage kurulum SQL'i
3. **CV-FEATURE-SETUP.md** - Bu dokümantasyon

## 📝 Değişiklikler

### Modified Files:

- **features/dashboard/components/ReviewerDashboard.tsx**
  - CV tab'ı eklendi
  - CVUploadSection komponenti entegre edildi
  - UserData interface'ine cv_file_url eklendi

### Database Changes:

- **public.users** tablosuna `cv_file_url` kolonu eklendi

### Storage Changes:

- **cvs** bucket'ı oluşturuldu
- RLS policies eklendi

## ✅ Test Checklist

- [ ] Supabase SQL kurulumu tamamlandı
- [ ] Hakem hesabıyla giriş yapıldı
- [ ] Özgeçmiş tab'ı görünüyor
- [ ] PDF dosyası yüklendi
- [ ] DOCX dosyası yüklendi
- [ ] CV indirme çalışıyor
- [ ] CV silme çalışıyor
- [ ] CV güncelleme çalışıyor
- [ ] Dosya boyutu kontrolü çalışıyor (5MB üzeri reddediliyor)
- [ ] Dosya tipi kontrolü çalışıyor (sadece PDF/DOCX kabul ediliyor)

## 🆘 Sorun Giderme

### "Bucket not found" Hatası

→ **Çözüm**: `supabase-cv-setup.sql` dosyasını Supabase Dashboard'dan çalıştırın

### CV yüklenmiyor

→ **Çözüm**:

1. Dosya boyutunun 5MB'ın altında olduğundan emin olun
2. Dosya formatının PDF veya DOCX olduğunu kontrol edin
3. Storage policies'in doğru kurulduğunu kontrol edin

### CV görünmüyor

→ **Çözüm**: Sayfayı yenileyin veya browser cache'ini temizleyin

---

**Özellik Durumu**: ✅ Tamamlandı ve test edilmeye hazır!

**Son Güncelleme**: 13 Ekim 2025
