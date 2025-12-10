'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
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

	// Supabase client'ı useMemo ile oluştur
	const supabase = useMemo(() => createClient(), [])

	useEffect(() => {
		// Supabase client yoksa (build time), sadece loading'i kapat
		if (!supabase) {
			setLoading(false)
			return
		}

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
		if (!supabase) return

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