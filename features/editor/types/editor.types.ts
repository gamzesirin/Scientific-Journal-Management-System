export interface Paper {
	id: string
	title: string
	abstract: string
	keywords?: string[]
	file_url: string
	author_id: string
	status: 'submitted' | 'under_review' | 'revision_requested' | 'resubmitted' | 'accepted' | 'rejected' | 'published'
	assigned_editor_id?: string
	submitted_at: string
	created_at: string
	updated_at: string
	// Relations
	author?: Author
	assignments?: Assignment[]
	reviews?: Review[]
	decision?: Decision
}

export interface Author {
	id: string
	name: string
	email: string
	affiliation?: string
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
	reviewer?: Reviewer
}

export interface Reviewer {
	id: string
	name: string
	email: string
	expertise_areas?: string[]
}

export interface Review {
	id: string
	article_id: string
	reviewer_id: string
	assignment_id: string
	overall_score: number
	recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
	comments: string
	status: 'draft' | 'submitted'
	submitted_at?: string
	reviewer?: Reviewer
}

export interface Decision {
	id: string
	article_id: string
	editor_id: string
	decision_type: 'accept' | 'reject' | 'revision'
	decision_reason: string
	status: 'draft' | 'final'
	created_at: string
	finalized_at?: string
}

export interface EditorStats {
	totalPapers: number
	pendingReview: number
	underReview: number
	revisionRequested: number
	reviewed: number
	accepted: number
	rejected: number
	published: number
	averageReviewTime: number
	activeReviewers: number
}

export interface AssignmentFormData {
	reviewer_id: string
	deadline: string
	message?: string
}

export interface EditorDeskEvaluation {
	id: string
	article_id: string
	editor_id: string
	decision: 'pending' | 'approve_for_review' | 'reject'
	rejection_reason?: string
	notes?: string
	scope_fit_score?: number
	originality_score?: number
	methodology_quality_score?: number
	created_at: string
	updated_at: string
	submitted_at?: string
}

export interface EditorDeskEvaluationFormData {
	decision: EditorDeskEvaluation['decision']
	rejection_reason?: string
	notes?: string
	scope_fit_score?: number
	originality_score?: number
	methodology_quality_score?: number
}

export interface ReviewerPerformance {
	id: string
	name: string
	email: string
	affiliation?: string
	expertise_areas: string[]
	totalAssignments: number
	completedAssignments: number
	pendingAssignments: number
	overdueAssignments: number
	completionRate: number
	averageCompletionTime: number | null
	firstAssignmentDate: string | null
	memberSince: string
}
