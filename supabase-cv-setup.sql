-- ============================================
-- CV FEATURE SETUP FOR REVIEWER SYSTEM
-- ============================================

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

-- ============================================
-- NOTES:
-- ============================================
-- 1. Bu SQL'i Supabase Dashboard'dan SQL Editor'de çalıştırın
-- 2. CVs bucket'ı public olarak oluşturuldu (getPublicUrl için gerekli)
-- 3. Sadece kullanıcılar kendi CV'lerini yükleyebilir/silebilir
-- 4. Admin ve Editörler tüm CV'leri görebilir (AI eşleştirme için)
-- 5. CV dosyaları: userId/cv_timestamp.pdf veya userId/cv_timestamp.docx formatında saklanır

