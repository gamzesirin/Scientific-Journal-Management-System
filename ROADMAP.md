# 🗺️ SUPABASE İLE MVP YOL HARİTASI

## Bilimsel Dergi Yönetim Sistemi - 6 Haftalık Detaylı Plan

**Proje Adı**: AI-Powered Journal Management System (MVP)
**Teknoloji Stack**: Next.js 15 + TypeScript + Supabase + Tailwind CSS + Shadcn UI
**Hedef Süre**: 6 hafta
**Başlangıç**: Hemen 🚀
**Son Güncelleme**: 4 Ekim 2025
**Mevcut Durum**: ✅ Hafta 1 Tamamlandı | ✅ Hafta 3 Tamamlandı | 🔄 Hafta 2 Devam Ediyor

---

## 📊 6 HAFTALIK GENEL BAKIŞ

```
┌────────────────────────────────────────────────────────────┐
│  Hafta 1: ⚙️  Kurulum + Authentication                     │
│  Hafta 2: 🗄️  Database + Storage Setup                    │
│  Hafta 3: 📝  Yazar Paneli + Makale Yükleme               │
│  Hafta 4: 👨‍💼 Editör Paneli + Hakem Sistemi                │
│  Hafta 5: 👨‍⚖️  Hakem Paneli + Review System                │
│  Hafta 6: 🚀  Polish + Testing + Deploy                   │
└────────────────────────────────────────────────────────────┘
```

**Toplam İş Yükü**: 120-150 saat (20-25 saat/hafta)

---

## 📅 HAFTA 1: KURULUM VE AUTHENTICATION

**Hedef**: Proje altyapısı hazır, kullanıcılar giriş yapabiliyor  
**Süre**: 7 gün  
**Zorluk**: ⭐⭐ Orta

### 🔵 GÜN 1-2: Proje Kurulumu

#### ✅ Görev 1.1: Supabase Projesi Oluştur

**Adımlar**:

1. https://supabase.com/dashboard adresine git
2. "New Project" butonuna tıkla
3. Proje ayarları:
   - **Name**: `journal-management-mvp`
   - **Database Password**: [Güçlü şifre oluştur ve kaydet!]
   - **Region**: `Frankfurt` (Turkey'e en yakın)
   - **Pricing Plan**: Free
4. "Create Project" - 2-3 dakika bekle

**Çıktı**:

- ✅ Supabase projesi aktif
- ✅ Database URL ve API keys alındı

---

#### ✅ Görev 1.2: Next.js Projesi Kur

**Terminal Komutları**:

```bash
# Next.js projesi oluştur
npx create-next-app@latest journal-management \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

# Klasöre gir
cd journal-management

# Supabase paketlerini kur
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr

# Development dependencies
npm install -D @types/node
```

**Çıktı**:

- ✅ Next.js projesi oluşturuldu
- ✅ Supabase dependencies kuruldu

---

#### ✅ Görev 1.3: Environment Variables

**Dosya**: `.env.local`

```bash
# .env.local oluştur
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Güvenlik**:

```bash
# .gitignore'a ekle (zaten olmalı)
echo ".env*.local" >> .gitignore
```

**Çıktı**:

- ✅ Environment variables yapılandırıldı
- ✅ .gitignore güncellendi

---

#### ✅ Görev 1.4: Supabase Client Setup

**Dosya 1**: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
```

**Dosya 2**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
	const cookieStore = await cookies()

	return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value
			}
		}
	})
}
```

**Test**:

```typescript
// app/page.tsx - Test connection
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Home() {
	const supabase = await createServerSupabaseClient()
	const { data, error } = await supabase.auth.getSession()

	return (
		<div>
			<h1>Supabase Connected: {error ? '❌' : '✅'}</h1>
		</div>
	)
}
```

**Çıktı**:

- ✅ Client-side Supabase client
- ✅ Server-side Supabase client
- ✅ Connection test başarılı

---

### 📦 Teslim Edilecekler (Gün 1-2):

- [x] Supabase projesi oluşturuldu
- [x] Next.js projesi kuruldu
- [x] Environment variables yapılandırıldı
- [x] Supabase bağlantısı test edildi

---

### 🔵 GÜN 3-5: Authentication Sistemi

#### ✅ Görev 2.1: Database Users Tablosu

**Supabase Dashboard** → SQL Editor → New Query

```sql
-- Public users tablosu
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  affiliation varchar(255),
  role varchar(50) NOT NULL DEFAULT 'author',
  is_active boolean DEFAULT true,
  expertise_areas text[],
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- RLS aktifleştir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: Yeni auth.users oluşunca public.users'a ekle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'author'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Çıktı**:

- ✅ public.users tablosu oluşturuldu
- ✅ RLS policies aktif
- ✅ Auto-trigger çalışıyor

---

#### ✅ Görev 2.2: Auth Actions

**Dosya**: `app/actions/auth.ts`

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
	const supabase = await createServerSupabaseClient()

	const email = formData.get('email') as string
	const password = formData.get('password') as string
	const name = formData.get('name') as string

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				name
			},
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
		}
	})

	if (error) {
		return { error: error.message }
	}

	redirect('/auth/verify-email')
}

export async function signIn(formData: FormData) {
	const supabase = await createServerSupabaseClient()

	const email = formData.get('email') as string
	const password = formData.get('password') as string

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password
	})

	if (error) {
		return { error: error.message }
	}

	revalidatePath('/', 'layout')
	redirect('/dashboard')
}

export async function signOut() {
	const supabase = await createServerSupabaseClient()
	await supabase.auth.signOut()
	revalidatePath('/', 'layout')
	redirect('/auth/login')
}

export async function getUser() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	return user
}
```

**Çıktı**:

- ✅ Server actions hazır
- ✅ Sign up/in/out functions

---

#### ✅ Görev 2.3: Auth Pages

**Dosya 1**: `app/auth/login/page.tsx`

```typescript
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
				<div>
					<h2 className="text-3xl font-bold text-center">Sign In</h2>
					<p className="mt-2 text-center text-gray-600">Journal Management System</p>
				</div>

				<form action={signIn} className="mt-8 space-y-6">
					<div>
						<label htmlFor="email" className="block text-sm font-medium">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					<button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
						Sign In
					</button>
				</form>

				<p className="text-center text-sm">
					Don't have an account?{' '}
					<a href="/auth/register" className="text-blue-600 hover:text-blue-700">
						Sign up
					</a>
				</p>
			</div>
		</div>
	)
}
```

**Dosya 2**: `app/auth/register/page.tsx`

```typescript
import { signUp } from '@/app/actions/auth'

export default function RegisterPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
				<div>
					<h2 className="text-3xl font-bold text-center">Create Account</h2>
				</div>

				<form action={signUp} className="mt-8 space-y-6">
					<div>
						<label htmlFor="name" className="block text-sm font-medium">
							Full Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm font-medium">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							minLength={6}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					<button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
						Sign Up
					</button>
				</form>

				<p className="text-center text-sm">
					Already have an account?{' '}
					<a href="/auth/login" className="text-blue-600 hover:text-blue-700">
						Sign in
					</a>
				</p>
			</div>
		</div>
	)
}
```

**Dosya 3**: `app/auth/callback/route.ts`

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get('code')

	if (code) {
		const supabase = await createServerSupabaseClient()
		await supabase.auth.exchangeCodeForSession(code)
	}

	return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**Çıktı**:

- ✅ Login page
- ✅ Register page
- ✅ OAuth callback

---

#### ✅ Görev 2.4: Middleware (Route Protection)

**Dosya**: `middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers
		}
	})

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value
				},
				set(name: string, value: string, options: any) {
					response.cookies.set({
						name,
						value,
						...options
					})
				},
				remove(name: string, options: any) {
					response.cookies.set({
						name,
						value: '',
						...options
					})
				}
			}
		}
	)

	const {
		data: { session }
	} = await supabase.auth.getSession()

	// Korunan rotalar - session yoksa login'e yönlendir
	if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
		return NextResponse.redirect(new URL('/auth/login', request.url))
	}

	// Login'deyken dashboard'a yönlendir
	if (session && request.nextUrl.pathname.startsWith('/auth')) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	return response
}

export const config = {
	matcher: [
		'/dashboard/:path*',
		'/admin/:path*',
		'/editor/:path*',
		'/reviewer/:path*',
		'/author/:path*',
		'/auth/:path*'
	]
}
```

**Çıktı**:

- ✅ Protected routes aktif
- ✅ Auto-redirect çalışıyor

---

### 📦 Teslim Edilecekler (Gün 3-5):

- [x] Users tablosu ve RLS ✅
- [x] Auth actions (sign up/in/out) ✅
- [x] Login/Register sayfaları ✅ (Shadcn UI ile)
- [x] Middleware protection ✅
- [x] Test kullanıcısı oluşturuldu ✅

---

### 🔵 GÜN 6-7: Role-Based Access Control

#### ✅ Görev 3.1: Role Helper Functions

**Dosya**: `lib/auth/roles.ts`

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'editor' | 'reviewer' | 'author'

export async function getUserRole(): Promise<UserRole | null> {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) return null

	const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

	return data?.role as UserRole
}

export async function getUserWithRole() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) return null

	const { data } = await supabase.from('users').select('*').eq('id', user.id).single()

	return data
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]) {
	return allowedRoles.includes(userRole)
}

export function getRedirectByRole(role: UserRole): string {
	const redirects: Record<UserRole, string> = {
		admin: '/admin/dashboard',
		editor: '/editor/dashboard',
		reviewer: '/reviewer/dashboard',
		author: '/author/dashboard'
	}
	return redirects[role]
}
```

**Çıktı**:

- ✅ Role helper functions

---

#### ✅ Görev 3.2: Dashboard Redirect

**Dosya**: `app/dashboard/page.tsx`

```typescript
import { getUserRole, getRedirectByRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
	const role = await getUserRole()

	if (!role) {
		redirect('/auth/login')
	}

	redirect(getRedirectByRole(role))
}
```

**Çıktı**:

- ✅ Auto-redirect by role

---

#### ✅ Görev 3.3: Test Kullanıcıları Oluştur

**Manuel Adımlar**:

1. Auth sayfasından 4 kullanıcı oluştur:

   - admin@test.com
   - editor@test.com
   - reviewer@test.com
   - author@test.com

2. **Supabase Dashboard** → SQL Editor:

```sql
-- Rolleri güncelle
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@test.com';

UPDATE public.users
SET role = 'editor'
WHERE email = 'editor@test.com';

UPDATE public.users
SET role = 'reviewer',
    expertise_areas = ARRAY['machine learning', 'artificial intelligence', 'NLP']
WHERE email = 'reviewer@test.com';

-- Zaten author (default)
```

**Çıktı**:

- ✅ 4 test kullanıcısı hazır

---

### 📦 Teslim Edilecekler (Gün 6-7):

- [x] Role helper functions ✅
- [x] Role-based routing ✅
- [x] Test kullanıcıları oluşturuldu ✅
- [x] Her rol kendi dashboard'una gidiyor ✅

---

### ✅ HAFTA 1 - CHECKPOINT ✅ TAMAMLANDI

**Tamamlanması Gerekenler**:

- [x] Supabase projesi aktif ✅
- [x] Next.js projesi çalışıyor ✅
- [x] Authentication tam çalışıyor ✅
- [x] 4 rol sistemi aktif ✅
- [x] Protected routes çalışıyor ✅
- [x] Test kullanıcıları hazır ✅

**Test**:

```bash
# Her kullanıcı ile login ol
# Doğru dashboard'a yönleniyor mu?
- admin@test.com → /admin/dashboard
- editor@test.com → /editor/dashboard
- reviewer@test.com → /reviewer/dashboard
- author@test.com → /author/dashboard
```

---

## 📅 HAFTA 2: DATABASE SETUP VE STORAGE

**Hedef**: Tüm tablolar hazır, file upload çalışıyor  
**Süre**: 7 gün  
**Zorluk**: ⭐⭐⭐ Orta-Zor

### 🔵 GÜN 8-10: Database Schema

#### ✅ Görev 4.1: MVP Tables Oluştur

**Supabase Dashboard** → SQL Editor → New Query

```sql
-- ============================================
-- PAPERS TABLE
-- ============================================
CREATE TABLE papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  abstract text NOT NULL,
  keywords text[],
  file_url text NOT NULL,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status varchar(50) NOT NULL DEFAULT 'submitted',
  assigned_editor_id uuid REFERENCES public.users(id),
  submitted_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected'
  ))
);

-- Indexes
CREATE INDEX idx_papers_author ON papers(author_id);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_papers_editor ON papers(assigned_editor_id);
CREATE INDEX idx_papers_submitted ON papers(submitted_at DESC);

-- Trigger
CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by_editor_id uuid NOT NULL REFERENCES public.users(id),
  status varchar(50) NOT NULL DEFAULT 'pending',
  deadline timestamp NOT NULL,
  assigned_at timestamp DEFAULT now(),
  completed_at timestamp,

  UNIQUE(paper_id, reviewer_id),

  CONSTRAINT valid_assignment_status CHECK (status IN (
    'pending', 'in_progress', 'completed'
  ))
);

-- Indexes
CREATE INDEX idx_assignments_paper ON assignments(paper_id);
CREATE INDEX idx_assignments_reviewer ON assignments(reviewer_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  overall_score int NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
  recommendation varchar(50) NOT NULL,
  comments text NOT NULL,
  status varchar(50) DEFAULT 'draft',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  submitted_at timestamp,

  CONSTRAINT valid_recommendation CHECK (recommendation IN (
    'accept', 'minor_revision', 'major_revision', 'reject'
  )),
  CONSTRAINT valid_review_status CHECK (status IN ('draft', 'submitted'))
);

-- Indexes
CREATE INDEX idx_reviews_paper ON reviews(paper_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DECISIONS TABLE
-- ============================================
CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES public.users(id),
  decision_type varchar(50) NOT NULL,
  decision_reason text NOT NULL,
  status varchar(50) DEFAULT 'draft',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  finalized_at timestamp,

  CONSTRAINT valid_decision_type CHECK (decision_type IN (
    'accept', 'reject', 'revision'
  )),
  CONSTRAINT valid_decision_status CHECK (status IN ('draft', 'final'))
);

-- Indexes
CREATE INDEX idx_decisions_paper ON decisions(paper_id);
CREATE INDEX idx_decisions_editor ON decisions(editor_id);

-- Trigger
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Çıktı**:

- ✅ 4 ana tablo oluşturuldu
- ✅ Foreign keys kuruldu
- ✅ Indexes eklendi
- ✅ Triggers aktif

---

#### ✅ Görev 4.2: Row Level Security (RLS) Policies

**Supabase Dashboard** → SQL Editor

```sql
-- ============================================
-- PAPERS RLS
-- ============================================
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Authors see own papers
CREATE POLICY "Authors see own papers"
  ON papers FOR SELECT
  USING (auth.uid() = author_id);

-- Authors can insert own papers
CREATE POLICY "Authors can insert own papers"
  ON papers FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update own papers (only if not accepted/rejected)
CREATE POLICY "Authors can update own papers"
  ON papers FOR UPDATE
  USING (
    auth.uid() = author_id
    AND status NOT IN ('accepted', 'rejected')
  );

-- Editors see all papers
CREATE POLICY "Editors see all papers"
  ON papers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin')
    )
  );

-- Editors can update all papers
CREATE POLICY "Editors can update all papers"
  ON papers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin')
    )
  );

-- Reviewers see assigned papers
CREATE POLICY "Reviewers see assigned papers"
  ON papers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.paper_id = papers.id
      AND assignments.reviewer_id = auth.uid()
    )
  );

-- ============================================
-- ASSIGNMENTS RLS
-- ============================================
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Editors see and manage all assignments
CREATE POLICY "Editors manage assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin')
    )
  );

-- Reviewers see own assignments
CREATE POLICY "Reviewers see own assignments"
  ON assignments FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Reviewers can update own assignments (status)
CREATE POLICY "Reviewers update own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- ============================================
-- REVIEWS RLS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviewers see and manage own reviews
CREATE POLICY "Reviewers manage own reviews"
  ON reviews FOR ALL
  USING (auth.uid() = reviewer_id);

-- Editors see all reviews
CREATE POLICY "Editors see all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin')
    )
  );

-- Authors see reviews of their papers (only after submitted)
CREATE POLICY "Authors see reviews of own papers"
  ON reviews FOR SELECT
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM papers
      WHERE papers.id = reviews.paper_id
      AND papers.author_id = auth.uid()
    )
  );

-- ============================================
-- DECISIONS RLS
-- ============================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Editors manage decisions
CREATE POLICY "Editors manage decisions"
  ON decisions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin')
    )
  );

-- Authors see decisions on own papers
CREATE POLICY "Authors see own papers decisions"
  ON decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM papers
      WHERE papers.id = decisions.paper_id
      AND papers.author_id = auth.uid()
    )
  );
```

**Çıktı**:

- ✅ RLS aktif tüm tablolarda
- ✅ Role-based permissions çalışıyor

---

### 📦 Teslim Edilecekler (Gün 8-10):

- [x] 4 tablo oluşturuldu
- [x] Foreign keys kuruldu
- [x] RLS policies aktif
- [x] Test sorguları çalışıyor

---

### 🔵 GÜN 11-14: Storage Setup

#### ✅ Görev 5.1: Storage Buckets Oluştur

**Supabase Dashboard** → Storage → New Bucket

**Bucket 1: papers**

- Name: `papers`
- Public: **NO** (Private)
- File size limit: `10 MB`
- Allowed MIME types: `application/pdf`

**Bucket 2: avatars**

- Name: `avatars`
- Public: **YES**
- File size limit: `2 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Çıktı**:

- ✅ 2 bucket oluşturuldu

---

#### ✅ Görev 5.2: Storage Policies

**Supabase Dashboard** → Storage → papers → Policies

```sql
-- Users can upload to own folder
CREATE POLICY "Users can upload own papers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'papers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view own papers
CREATE POLICY "Users can view own papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete own papers
CREATE POLICY "Users can delete own papers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'papers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Editors can view all papers
CREATE POLICY "Editors can view all papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('editor', 'admin')
  )
);

-- Reviewers can view assigned papers
CREATE POLICY "Reviewers can view assigned papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers'
  AND EXISTS (
    SELECT 1 FROM papers p
    JOIN assignments a ON p.id = a.paper_id
    WHERE p.file_url LIKE '%' || name || '%'
    AND a.reviewer_id = auth.uid()
  )
);
```

**Çıktı**:

- ✅ Storage policies aktif

---

#### ✅ Görev 5.3: File Upload Helpers

**Dosya**: `lib/storage/upload.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

export async function uploadPaperFile(
	file: File,
	userId: string,
	paperId: string
): Promise<{ url: string | null; error: string | null }> {
	const supabase = createClient()

	// Validate
	if (file.size > 10 * 1024 * 1024) {
		return { url: null, error: 'File too large (max 10MB)' }
	}

	if (file.type !== 'application/pdf') {
		return { url: null, error: 'Only PDF files allowed' }
	}

	// Upload
	const filePath = `${userId}/${paperId}.pdf`

	const { data, error } = await supabase.storage.from('papers').upload(filePath, file, {
		cacheControl: '3600',
		upsert: false
	})

	if (error) {
		return { url: null, error: error.message }
	}

	// Get signed URL (7 days valid)
	const { data: signedUrl } = await supabase.storage.from('papers').createSignedUrl(data.path, 60 * 60 * 24 * 7)

	return { url: signedUrl?.signedUrl || null, error: null }
}

export async function deletePaperFile(paperId: string, userId: string) {
	const supabase = createClient()
	const filePath = `${userId}/${paperId}.pdf`

	const { error } = await supabase.storage.from('papers').remove([filePath])

	return { error: error?.message || null }
}

export async function downloadPaperFile(fileUrl: string) {
	const supabase = createClient()

	// Extract path from signed URL
	const urlObj = new URL(fileUrl)
	const path = urlObj.pathname.split('/').slice(-2).join('/')

	const { data, error } = await supabase.storage.from('papers').download(path)

	if (error) {
		return { data: null, error: error.message }
	}

	return { data, error: null }
}
```

**Çıktı**:

- ✅ Upload helper
- ✅ Delete helper
- ✅ Download helper

---

### 📦 Teslim Edilecekler (Gün 11-14):

- [x] Storage buckets oluşturuldu
- [x] Storage policies aktif
- [x] Upload/download helpers hazır
- [x] Test file upload başarılı

---

### ✅ HAFTA 2 - CHECKPOINT

**Tamamlanması Gerekenler**:

- [x] Database schema tam
- [x] RLS policies çalışıyor
- [x] Storage buckets hazır
- [x] File upload/download çalışıyor

**Test**:

```bash
# Supabase Dashboard'dan test et:
1. Her tabloya veri ekle
2. RLS policies test et (farklı rollerle)
3. File upload test et
4. File download test et
```

---

## 📅 HAFTA 3: YAZAR PANELİ VE MAKALE YÜKLEME ✅ TAMAMLANDI

**Hedef**: Yazarlar makale yükleyebiliyor ✅
**Süre**: 7 gün
**Zorluk**: ⭐⭐ Orta
**Durum**: ✅ Tamamlandı (Shadcn UI ile modernize edildi)

### 🔵 GÜN 15-17: Yazar Dashboard ✅

- [x] Author Dashboard Layout (Shadcn Card + Button kullanımı)
- [x] Makale istatistikleri (Toplam, Gönderildi, İnceleme, Kabul, Yayınlandı)
- [x] Çıkış yapma fonksiyonu
- [x] Responsive tasarım

### 🔵 GÜN 18-21: Makale Yükleme ✅

- [x] ArticleUploadForm komponenti (Shadcn Form + Input + Textarea + Select)
- [x] File upload (PDF/Word desteği, max 10MB)
- [x] ArticleList komponenti (Shadcn Table + Badge)
- [x] Article detail page (/articles/[id])
- [x] Status badge'leri (submitted, under_review, accepted, rejected, published)

### 📦 Teslim Edilecekler:

- [x] Author dashboard UI ✅ (Shadcn UI ile modernize edildi)
- [x] Paper submission form ✅ (ArticleUploadForm komponenti)
- [x] File upload çalışıyor ✅ (Supabase Storage entegrasyonu)
- [x] Papers listesi ✅ (ArticleList komponenti)
- [x] Article detail page ✅ (Makale detay sayfası)

---

## 📅 HAFTA 4: EDİTÖR PANELİ ✅ TAMAMLANDI

**Hedef**: Editörler hakem atıyor ✅
**Süre**: 7 gün
**Durum**: ✅ Tamamlandı

### 🔵 Tamamlanan Özellikler:

- [x] Editor Dashboard Layout (Shadcn Card + Badge kullanımı)
- [x] Makale listesi görüntüleme (tüm makaleler)
- [x] İstatistik kartları (Gönderildi, İnceleniyor, Kabul, Red, Yayınlandı)
- [x] Makale detay sayfası (/editor/papers/[id])
- [x] Makale durumu güncelleme sistemi
- [x] Hakem atama sayfası (/editor/papers/[id]/assign)
- [x] Hakem seçimi ve deadline belirleme
- [x] Responsive ve modern UI

### 📦 Teslim Edilecekler:

- [x] Editor dashboard UI ✅
- [x] Papers list view ✅
- [x] Paper detail page ✅
- [x] Status management ✅
- [x] Reviewer assignment page ✅

---

## 📅 HAFTA 5: HAKEM PANELİ ✅ TAMAMLANDI

**Hedef**: Hakemler değerlendiriyor ✅
**Süre**: 7 gün
**Durum**: ✅ Tamamlandı

### 🔵 Tamamlanan Özellikler:

- [x] Reviewer Dashboard Layout (İstatistikler ve atanmış makaleler)
- [x] AssignedPapersList komponenti (Hakem için atanmış makalelerin listesi)
- [x] ReviewForm komponenti (Detaylı değerlendirme formu)
- [x] Review detail page (/reviewer/papers/[id]/review)
- [x] ReviewStatistics komponenti (Hakem performans istatistikleri)
- [x] Reviewer statistics page (/reviewer/statistics)
- [x] Review status management (draft/submitted durumları)
- [x] Assignment status tracking (pending/in_progress/completed)

### 📦 Teslim Edilecekler:

- [x] Reviewer dashboard UI ✅
- [x] Assigned papers list ✅
- [x] Review submission form ✅ (Detaylı puanlama ve yorumlar)
- [x] Review status tracking ✅
- [x] Performance statistics ✅

---

## 📅 HAFTA 6: POLISH VE DEPLOY

**Hedef**: Canlıya alma  
**Süre**: 7 gün

_[Decision System, Testing, Deploy]_

---

## 📊 İLERLEME TAKİP TABLOSU

| Hafta | Görev              | Durum | Tamamlanma |
| ----- | ------------------ | ----- | ---------- |
| 1     | Kurulum + Auth     | ✅    | 100%       |
| 2     | Database + Storage | ✅    | 100%       |
| 3     | Yazar Paneli       | ✅    | 100%       |
| 4     | Editör Paneli      | ✅    | 100%       |
| 5     | Hakem Paneli       | ✅    | 100%       |
| 6     | Deploy             | ⬜    | 0%         |

**Not**:
- Auth sistemi tamamlandı, rol seçimi eklendi
- Papers, assignments, reviews, decisions tabloları hazır
- Storage buckets ve policies hazır
- Articles tablosu kullanılıyor (papers yerine şimdilik)
- Editor paneli tamamlandı, hakem atama sistemi çalışıyor
- Reviewer paneli tamamlandı, değerlendirme sistemi çalışıyor

---

## 🎯 BAŞARI KRİTERLERİ

### Minimum Viable Product (MVP):

- [x] ✅ Kullanıcı kaydı ve girişi (Shadcn UI ile)
- [x] ✅ 4 rol sistemi (admin, editor, reviewer, author)
- [x] ✅ Makale yükleme (PDF/Word desteği)
- [x] ✅ Hakem ataması (manuel)
- [x] ✅ Değerlendirme formu (1-5 puan + yorum)
- [ ] ⬜ Editör karar sistemi
- [x] ✅ Status tracking (Badge'lerle gösteriliyor)

---

## 💡 ÖNEMLİ NOTLAR

### Günlük Çalışma Ritmi:

```
09:00-10:00 → Planning (günlük hedefler)
10:00-13:00 → Development (fokus)
13:00-14:00 → Break
14:00-17:00 → Development (fokus)
17:00-18:00 → Testing + Git commit
18:00-18:30 → Yarın planı
```

### Git Workflow:

```bash
# Feature branch
git checkout -b feature/paper-upload

# Commit
git add .
git commit -m "feat: add paper upload form"

# Merge
git checkout main
git merge feature/paper-upload
git push origin main
```

### Takıldığınızda:

1. 🔍 Supabase Docs
2. 📚 Next.js Docs
3. 🐛 GitHub Issues
4. 💬 Stack Overflow
5. 💬 Supabase Discord

---

## 🚀 BAŞLAMAYA HAZIR MISINIZ?

**İlk Adım**: Supabase hesabı oluştur  
**İkinci Adım**: Proje oluştur  
**Üçüncü Adım**: Bu roadmap'i takip et!

**Hadi başlayalım! 💪**

---

**Son Güncelleme**: 5 Ekim 2025
**Versiyon**: 1.5
**Lisans**: MIT
