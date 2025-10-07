'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
	try {
		const supabase = await createServerSupabaseClient()

		const email = formData.get('email') as string
		const password = formData.get('password') as string
		const name = formData.get('name') as string

		if (!email || !password || !name) {
			return { error: 'Tüm alanları doldurun' }
		}

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
			console.error('Sign up error:', error)
			return { error: error.message }
		}

		console.log('Sign up success:', data)
		return { success: true, data }
	} catch (error) {
		console.error('Sign up error:', error)
		return { error: 'Beklenmeyen bir hata oluştu' }
	}
}

export async function signIn(formData: FormData) {
	try {
		const supabase = await createServerSupabaseClient()

		const email = formData.get('email') as string
		const password = formData.get('password') as string

		if (!email || !password) {
			return { error: 'Email ve şifre gerekli' }
		}

		console.log('Signing in with:', { email, password })

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		})

		if (error) {
			console.error('Sign in error:', error)
			return { error: error.message }
		}

		console.log('Sign in success:', data)
		revalidatePath('/', 'layout')
		redirect('/dashboard')
	} catch (error) {
		console.error('Sign in error:', error)
		return { error: 'Giriş yapılırken bir hata oluştu' }
	}
}

export async function signOut() {
	try {
		const supabase = await createServerSupabaseClient()
		await supabase.auth.signOut()
		revalidatePath('/', 'layout')
		redirect('/auth/login')
	} catch (error) {
		console.error('Sign out error:', error)
		return { error: 'Çıkış yapılırken bir hata oluştu' }
	}
}

export async function getUser() {
	try {
		const supabase = await createServerSupabaseClient()
		const {
			data: { user },
			error
		} = await supabase.auth.getUser()

		if (error) {
			console.error('Get user error:', error)
			return null
		}

		return user
	} catch (error) {
		console.error('Get user error:', error)
		return null
	}
}
