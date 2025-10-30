import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Get user role
	const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

	// Check if user is admin
	if (!userData || userData.role !== 'admin') {
		redirect('/dashboard')
	}

	// Redirect admin to the dashboard which will show admin-specific content
	redirect('/dashboard')
}