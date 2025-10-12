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
	| 'accepted'
	| 'rejected'
	| 'published'

export interface ArticleStats {
	total: number
	submitted: number
	under_review: number
	revision_requested: number
	accepted: number
	rejected: number
	published: number
}