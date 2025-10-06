import { createBrowserClient } from '@supabase/ssr'

// Hardcoded values for now (should be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwbxfqzkruhguctxbslf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YnhmcXprcnVoZ3VjdHhic2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTc1OTQsImV4cCI6MjA3NTE3MzU5NH0.9-20rUdtycbP9jqR-7EwGsszj299BvXBRvhheu-plIY'

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
