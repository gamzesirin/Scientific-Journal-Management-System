export interface Article {
	id: string
	title: string
	abstract: string
	keywords: string[]
	category?: string
	file_url: string
	author_id: string
	status: ArticleStatus
	assigned_editor_id?: string
	created_at: string
	updated_at: string
	assigned_at?: string
	deadline?: string
	// Publication metadata
	doi?: string
	volume?: number
	issue?: number
	start_page?: number
	end_page?: number
	published_date?: string
	article_type?: ArticleType
	citation_count?: number
	users?: {
		name: string
		email: string
		affiliation?: string
	}
	author?: {
		name: string
		email: string
		affiliation?: string
	}
}

export type ArticleStatus =
	| 'submitted'
	| 'under_review'
	| 'revision_requested'
	| 'resubmitted' // Revizyon yapılıp tekrar gönderilmiş
	| 'accepted'
	| 'rejected'
	| 'published'

export type ArticleType = 'research' | 'review' | 'case_study' | 'technical_note' | 'editorial' | 'letter'

export interface ArticleStats {
	total: number
	submitted: number
	under_review: number
	revision_requested: number
	resubmitted: number
	accepted: number
	rejected: number
	published: number
}

export interface PublicationMetadata {
	doi: string
	volume: number
	issue: number
	start_page: number
	end_page: number
	published_date: string
	article_type: ArticleType
}
