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
