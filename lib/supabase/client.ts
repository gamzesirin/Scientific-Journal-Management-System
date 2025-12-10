import { createBrowserClient } from '@supabase/ssr'

// Hardcoded values for now (should be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build time'da null döndür, runtime'da client oluştur
let _supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
	// Build time kontrolü - window yoksa ve env yoksa null döndürme
	if (typeof window === 'undefined') {
		// Server-side rendering veya build time
		if (!supabaseUrl || !supabaseAnonKey) {
			// Build time'da mock client döndür
			return null as any
		}
	}

	// Runtime'da env kontrolü
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase configuration is missing. Check environment variables.')
		throw new Error('Supabase configuration error')
	}

	// Singleton pattern - bir kez oluştur
	if (!_supabaseClient) {
		try {
			_supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
				auth: {
					persistSession: true,
					autoRefreshToken: true,
					detectSessionInUrl: true
				}
			})
		} catch (error) {
			console.error('Error creating Supabase client:', error)
			throw error
		}
	}

	return _supabaseClient
}
