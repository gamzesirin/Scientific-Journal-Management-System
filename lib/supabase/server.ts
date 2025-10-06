import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded values for now (should be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwbxfqzkruhguctxbslf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YnhmcXprcnVoZ3VjdHhic2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTc1OTQsImV4cCI6MjA3NTE3MzU5NH0.9-20rUdtycbP9jqR-7EwGsszj299BvXBRvhheu-plIY'

export async function createServerSupabaseClient() {
	const cookieStore = await cookies()

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookieStore.set(name, value, options)
					)
				} catch {
					// Handle cookie error in development
				}
			}
		}
	})
}
