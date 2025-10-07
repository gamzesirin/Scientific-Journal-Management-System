import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'editor' | 'reviewer' | 'author'

export interface UserProfile {
	id: string
	email: string
	name: string
	role: UserRole
	affiliation?: string
	expertise_areas?: string[]
	is_active: boolean
	created_at: string
	updated_at: string
}

export interface AuthContextType {
	user: User | null
	loading: boolean
	signOut: () => Promise<void>
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface RegisterData extends LoginCredentials {
	name: string
	role: UserRole
}