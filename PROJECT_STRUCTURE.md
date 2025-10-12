# 📁 Proje Yapısı - Features Based Architecture

```
final/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Ana dashboard sayfası (tüm roller için)
│   │   └── page.tsx
│   ├── auth/                    # Auth sayfaları
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   ├── articles/                # Makale detay sayfası
│   │   └── [id]/
│   │       └── page.tsx
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css
│
├── features/                    # Feature-based modüller
│   ├── auth/                   # Authentication özellikleri
│   │   ├── components/
│   │   │   └── AuthProvider.tsx
│   │   ├── actions/
│   │   │   └── auth.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── dashboard/              # Dashboard özellikleri
│   │   ├── components/
│   │   │   ├── AuthorDashboard.tsx
│   │   │   ├── EditorDashboard.tsx
│   │   │   ├── ReviewerDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   └── types/
│   │       └── dashboard.types.ts
│   │
│   ├── articles/               # Makale yönetimi
│   │   ├── components/
│   │   │   ├── ArticleList.tsx
│   │   │   ├── ArticleUploadForm.tsx
│   │   │   └── ArticleDetail.tsx
│   │   ├── actions/
│   │   │   └── articles.ts
│   │   └── types/
│   │       └── article.types.ts
│   │
│   ├── editor/                 # Editör özellikleri
│   │   ├── components/
│   │   │   ├── PaperReview.tsx
│   │   │   └── AssignReviewer.tsx
│   │   └── pages/
│   │       └── papers/
│   │
│   ├── reviewer/               # Hakem özellikleri
│   │   ├── components/
│   │   │   └── ReviewForm.tsx
│   │   └── types/
│   │       └── review.types.ts
│   │
│   ├── admin/                  # Admin özellikleri
│   │   ├── components/
│   │   │   └── UserManagement.tsx
│   │   └── types/
│   │       └── admin.types.ts
│   │
│   └── common/                 # Ortak componentler
│       ├── components/
│       │   └── Navbar.tsx
│       └── types/
│           └── common.types.ts
│
├── lib/                        # Utility ve helper fonksiyonlar
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── storage/
│   │   └── upload.ts
│   ├── auth/
│   │   └── roles.ts
│   └── utils.ts
│
├── components/                 # UI componentleri (Shadcn)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── calendar.tsx
│       ├── checkbox.tsx
│       ├── popover.tsx
│       └── ...
│
├── hooks/                      # Custom React hooks
│   └── useUserRole.ts
│
├── database/                   # Database scripts
│   ├── create-papers-tables.sql
│   ├── create-rls-policies.sql
│   ├── create-storage-buckets.sql
│   ├── update-user-trigger.sql
│   └── SETUP_INSTRUCTIONS.md
│
├── public/                     # Static dosyalar
│
├── types/                      # Global TypeScript types
│   └── global.d.ts
│
└── config files               # Konfigürasyon dosyaları
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.local
```

## 🎯 Mimari Prensipler

### 1. Feature-Based Organization
- Her özellik kendi klasöründe
- Components, actions, types bir arada
- Kolay bulunabilir ve yönetilebilir

### 2. Separation of Concerns
- UI components (Shadcn) ayrı
- Business logic features içinde
- Database logic lib içinde

### 3. Type Safety
- Her feature için ayrı type dosyaları
- Global types için types klasörü

### 4. Reusability
- Common components için ayrı klasör
- Shared utilities lib içinde

## 🚀 Avantajlar

1. **Modülerlik**: Her feature bağımsız
2. **Ölçeklenebilirlik**: Yeni feature eklemek kolay
3. **Bakım Kolaylığı**: İlgili kodlar bir arada
4. **Test Edilebilirlik**: Feature bazlı test yazılabilir
5. **Takım Çalışması**: Farklı takımlar farklı feature'larda çalışabilir

## 📝 Kullanım

### Yeni Feature Eklemek
```bash
mkdir -p features/new-feature/{components,actions,types}
```

### Import Örneği
```typescript
// Feature component
import ArticleList from '@/features/articles/components/ArticleList'

// UI component
import { Button } from '@/components/ui/button'

// Utility
import { createClient } from '@/lib/supabase/client'

// Type
import { Article } from '@/features/articles/types/article.types'
```