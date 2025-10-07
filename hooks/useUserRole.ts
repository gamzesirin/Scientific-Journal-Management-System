'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/components/AuthProvider'

export function useUserRole() {
	const { user } = useAuth()
	const [role, setRole] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const supabase = createClient()

	useEffect(() => {
		async function getUserRole() {
			if (!user) {
				setRole(null)
				setLoading(false)
				return
			}

			try {
				const { data } = await supabase
					.from('users')
					.select('role')
					.eq('id', user.id)
					.single()

				setRole(data?.role || 'author')
			} catch (error) {
				console.error('Error fetching user role:', error)
				setRole('author')
			} finally {
				setLoading(false)
			}
		}

		getUserRole()
	}, [user, supabase])

	const getDashboardPath = () => {
		const paths: Record<string, string> = {
			admin: '/admin/dashboard',
			editor: '/editor/dashboard',
			reviewer: '/reviewer/dashboard',
			author: '/author/dashboard'
		}
		return paths[role || 'author'] || '/author/dashboard'
	}

	return { role, loading, getDashboardPath }
}