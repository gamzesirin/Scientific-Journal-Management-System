export interface Review {
	id: string
	article_id: string
	reviewer_id: string
	assignment_id?: string // Optional since it might not always be present
	overall_score?: number // Optional for drafts
	recommendation?: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
	comments?: string // Optional for drafts
	status: 'draft' | 'submitted'
	created_at: string
	updated_at: string
	submitted_at?: string
}

export interface Assignment {
	id: string
	article_id: string
	reviewer_id: string
	assigned_by_editor_id: string
	status: 'pending' | 'in_progress' | 'completed'
	deadline: string
	assigned_at: string
	completed_at?: string
}

export interface ReviewFormData {
	overall_score: number
	recommendation: Review['recommendation']
	comments: string
	// Detailed criteria scores (optional for MVP)
	originality_score?: number
	methodology_score?: number
	clarity_score?: number
	significance_score?: number
	// Additional comments
	strengths?: string
	weaknesses?: string
	suggestions?: string
}

export interface PaperWithAssignment {
	id: string
	article_id?: string // Added for compatibility with assignments table
	title: string
	abstract: string
	keywords?: string[]
	file_url: string
	author_id: string
	status: string
	created_at: string
	updated_at: string
	// Assignment details
	assignment?: Assignment
	assignment_id?: string // Added for unique key
	deadline?: string
	assigned_at?: string
	assignment_status?: string
	// Review details
	review?: Review
}
