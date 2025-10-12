import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	try {
		const supabase = await createServerSupabaseClient()

		// Check if user is admin
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
		}

		// Get request body
		const { name, email, password, role, affiliation } = await request.json()

		// Validate required fields
		if (!name || !email || !password) {
			return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
		}

		if (password.length < 6) {
			return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
		}

		// Create user with Supabase Auth (using service role)
		// Note: We need to use service role key for admin user creation
		const { createClient } = await import('@supabase/supabase-js')
		const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		})

		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true, // Auto-confirm email
			user_metadata: {
				name,
				role: role || 'author'
			}
		})

		if (authError) {
			console.error('Auth error:', authError)
			return NextResponse.json({ error: authError.message }, { status: 400 })
		}

		// Update user in public.users table
		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({
				name,
				role: role || 'author',
				affiliation: affiliation || null
			})
			.eq('id', authData.user.id)

		if (updateError) {
			console.error('Update error:', updateError)
			// User is created but role update failed
			return NextResponse.json(
				{ error: 'User created but role update failed: ' + updateError.message },
				{ status: 500 }
			)
		}

		return NextResponse.json(
			{
				message: 'User created successfully',
				user: {
					id: authData.user.id,
					email: authData.user.email,
					name
				}
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Error creating user:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
