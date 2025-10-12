# 📋 Veritabanı Kurulum Talimatları

## 🎯 Supabase Dashboard'da Yapılacaklar

### 1️⃣ Kullanıcı Trigger'ını Güncelle
**Dosya**: `update-user-trigger.sql`
- Supabase Dashboard → SQL Editor
- Dosyayı kopyala-yapıştır ve çalıştır
- Bu, kayıt olurken seçilen rolün kaydedilmesini sağlar

### 2️⃣ Papers ve İlişkili Tabloları Oluştur
**Dosya**: `create-papers-tables.sql`
- Supabase Dashboard → SQL Editor
- Dosyayı kopyala-yapıştır ve çalıştır
- Papers, assignments, reviews, decisions tabloları oluşturulur

### 3️⃣ RLS Policies Ekle
**Dosya**: `create-rls-policies.sql`
- Supabase Dashboard → SQL Editor
- Dosyayı kopyala-yapıştır ve çalıştır
- Tüm tablolar için güvenlik politikaları aktif edilir

### 4️⃣ Storage Buckets Oluştur
**İki yöntem var:**

#### Yöntem 1: SQL ile (Önerilen)
**Dosya**: `create-storage-buckets.sql`
- Supabase Dashboard → SQL Editor
- Dosyayı kopyala-yapıştır ve çalıştır

#### Yöntem 2: Dashboard UI ile
- Supabase Dashboard → Storage → New Bucket

**Papers Bucket:**
- Name: `papers`
- Public: ❌ (Private seç)
- File size limit: `10 MB`
- Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Avatars Bucket:**
- Name: `avatars`
- Public: ✅ (Public seç)
- File size limit: `2 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

## ✅ Kontrol Listesi

- [ ] Kullanıcı trigger'ı güncellendi
- [ ] Papers tablosu oluşturuldu
- [ ] Assignments tablosu oluşturuldu
- [ ] Reviews tablosu oluşturuldu
- [ ] Decisions tablosu oluşturuldu
- [ ] RLS policies eklendi
- [ ] Papers storage bucket oluşturuldu
- [ ] Avatars storage bucket oluşturuldu
- [ ] Storage policies eklendi

## 🧪 Test

### Rol Seçimini Test Et:
1. `/auth/register` sayfasına git
2. Yeni kullanıcı oluştur ve rol seç (Yazar/Hakem/Editör)
3. Giriş yap
4. Doğru dashboard'a yönlendirildiğini kontrol et

### Storage Test:
1. Author olarak giriş yap
2. Dashboard'da makale yükle
3. PDF dosyasının başarıyla yüklendiğini kontrol et

## 🔍 Sorun Giderme

### "Permission denied" hatası:
- RLS policies'in doğru eklendiğini kontrol et
- Kullanıcı rolünün doğru kaydedildiğini kontrol et

### Storage yükleme hatası:
- Bucket'ların oluşturulduğunu kontrol et
- Storage policies'in eklendiğini kontrol et
- Dosya boyutu ve tipinin uygun olduğunu kontrol et

## 📝 Notlar

- Articles tablosu zaten mevcut, papers tablosuyla çakışma olabilir
- İleride articles'ı papers'a migrate etmek gerekebilir
- Admin rolü için ayrı bir panel gerekebilir