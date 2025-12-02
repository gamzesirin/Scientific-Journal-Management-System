import { createBrowserClient } from '@supabase/ssr'

// Hardcoded values for now (should be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
	// URL ve Key kontrolü
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase configuration is missing. Check environment variables.')
		throw new Error('Supabase configuration error')
	}

	try {
		return createBrowserClient(supabaseUrl, supabaseAnonKey, {
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
