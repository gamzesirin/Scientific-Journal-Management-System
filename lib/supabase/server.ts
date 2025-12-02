import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded values for now (should be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function createServerSupabaseClient() {
	const cookieStore = await cookies()

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
				} catch {
					// Handle cookie error in development
				}
			}
		}
	})
}

// Alias for convenience
export const createClient = createServerSupabaseClient
