import { UserProfile } from '@/features/auth/types/auth.types'
import { Article } from '@/features/articles/types/article.types'
import { User } from '@supabase/supabase-js'

export interface DashboardProps {
	user: User
	userData: UserProfile
}

export interface AuthorDashboardProps extends DashboardProps {
	articles: Article[]
}

export interface EditorDashboardProps extends DashboardProps {
	allPapers: Article[]
}

interface Review {
	id: string
	article_id: string
	reviewer_id: string
	status: 'draft' | 'submitted'
	created_at: string
	updated_at: string
}

export interface ReviewerDashboardProps extends DashboardProps {
	assignedPapers: Article[]
	reviews: Review[]
}

export interface AdminDashboardProps extends DashboardProps {
	stats: AdminStats
}

export interface AdminStats {
	totalUsers: number
	totalPapers: number
	totalReviews: number
	usersByRole: {
		admin: number
		editor: number
		reviewer: number
		author: number
	}
	papersByStatus: {
		submitted: number
		under_review: number
		accepted: number
		rejected: number
		published: number
	}
}
