'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
	user: User | null
	loading: boolean
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	signOut: async () => {}
})

export function useAuth() {
	return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const supabase = createClient()

	useEffect(() => {
		// Initial auth state
		const getInitialAuth = async () => {
			try {
				const {
					data: { user }
				} = await supabase.auth.getUser()
				setUser(user)
			} catch (error) {
				console.error('Error getting user:', error)
			} finally {
				setLoading(false)
			}
		}

		getInitialAuth()

		// Listen for auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			setUser(session?.user ?? null)
			setLoading(false)
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [supabase])

	const signOut = async () => {
		try {
			await supabase.auth.signOut()
			setUser(null)
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<AuthContext.Provider value={{ user, loading, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}