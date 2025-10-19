// ============================================
// HISTORY & AUDIT TRACKING TYPES
// ============================================

export type HistoryAction =
	| 'INSERT'
	| 'UPDATE'
	| 'DELETE'
	| 'STATUS_CHANGE'
	| 'SUBMIT'
	| 'ROLE_CHANGE'
	| 'DEACTIVATE'
	| 'COMPLETE'
	| 'REASSIGN'
	| 'SELECT'
	| 'CUSTOM'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

// ============================================
// ARTICLES HISTORY
// ============================================

export interface ArticleHistory {
	history_id: string
	article_id: string
	title: string
	abstract: string
	keywords: string[]
	category?: string
	file_url: string
	author_id: string
	status: string
	assigned_editor_id?: string
	deadline?: string
	assigned_at?: string

	// History metadata
	action: HistoryAction
	changed_by?: string
	changed_at: string
	change_reason?: string

	// Original timestamps
	original_created_at: string
	original_updated_at: string

	// Changed fields
	changed_fields?: Record<string, boolean>
	previous_values?: Record<string, any>

	// Soft delete
	is_deleted: boolean
	deleted_at?: string
	deleted_by?: string

	// Relations
	changed_by_user?: {
		name: string
		email: string
		role: string
	}
}

// ============================================
// REVIEWS HISTORY
// ============================================

export interface ReviewHistory {
	history_id: string
	review_id: string
	article_id: string
	reviewer_id: string
	assignment_id?: string
	overall_score?: number
	recommendation?: string
	comments?: string
	status: string

	// History metadata
	action: HistoryAction
	changed_by?: string
	changed_at: string
	change_reason?: string

	// Original timestamps
	original_created_at: string
	original_updated_at: string
	submitted_at?: string

	// Changed fields
	changed_fields?: Record<string, boolean>
	previous_values?: Record<string, any>

	// Relations
	changed_by_user?: {
		name: string
		email: string
		role: string
	}
}

// ============================================
// USERS HISTORY
// ============================================

export interface UserHistory {
	history_id: string
	user_id: string
	email: string
	name: string
	role: string
	affiliation?: string
	expertise_areas?: string[]
	is_active: boolean
	cv_file_url?: string

	// History metadata
	action: HistoryAction
	changed_by?: string
	changed_at: string
	change_reason?: string

	// Original timestamps
	original_created_at: string
	original_updated_at: string

	// Changed fields
	changed_fields?: Record<string, boolean>
	previous_values?: Record<string, any>

	// Relations
	changed_by_user?: {
		name: string
		email: string
		role: string
	}
}

// ============================================
// ASSIGNMENTS HISTORY
// ============================================

export interface AssignmentHistory {
	history_id: string
	assignment_id: string
	article_id: string
	reviewer_id: string
	assigned_by_editor_id: string
	status: string
	deadline: string

	// History metadata
	action: HistoryAction
	changed_by?: string
	changed_at: string
	change_reason?: string

	// Original timestamps
	assigned_at: string
	completed_at?: string

	// Changed fields
	changed_fields?: Record<string, boolean>
	previous_values?: Record<string, any>

	// Relations
	changed_by_user?: {
		name: string
		email: string
		role: string
	}
}

// ============================================
// GENERAL AUDIT LOG
// ============================================

export interface AuditLog {
	id: string

	// What happened
	table_name: string
	record_id?: string
	action: HistoryAction
	action_description?: string

	// Who did it
	user_id?: string
	user_email?: string
	user_role?: string
	ip_address?: string
	user_agent?: string

	// When
	created_at: string

	// Data
	old_data?: Record<string, any>
	new_data?: Record<string, any>
	changed_fields?: string[]

	// Additional context
	metadata?: Record<string, any>
	severity?: AuditSeverity

	// For compliance
	retention_until?: string
}

// ============================================
// UNIFIED HISTORY ENTRY (for timeline view)
// ============================================

export interface UnifiedHistoryEntry {
	id: string
	table_name: 'articles' | 'reviews' | 'users' | 'assignments'
	record_id: string
	action: HistoryAction
	changed_by?: string
	changed_at: string
	changed_fields?: Record<string, boolean>
	previous_values?: Record<string, any>

	// Relations
	changed_by_user?: {
		name: string
		email: string
		role: string
	}

	// Table-specific data
	data: ArticleHistory | ReviewHistory | UserHistory | AssignmentHistory
}

// ============================================
// HISTORY QUERY FILTERS
// ============================================

export interface HistoryFilters {
	table_name?: string
	record_id?: string
	action?: HistoryAction
	changed_by?: string
	date_from?: string
	date_to?: string
	limit?: number
	offset?: number
}

export interface AuditLogFilters extends HistoryFilters {
	severity?: AuditSeverity
	user_email?: string
	user_role?: string
}

// ============================================
// HISTORY STATISTICS
// ============================================

export interface HistoryStats {
	total_changes: number
	by_action: Record<HistoryAction, number>
	by_table: Record<string, number>
	by_user: Array<{
		user_id: string
		user_name: string
		count: number
	}>
	recent_activity: UnifiedHistoryEntry[]
}

// ============================================
// USER ACTIVITY SUMMARY
// ============================================

export interface UserActivitySummary {
	id: string
	name: string
	email: string
	role: string
	total_actions: number
	last_activity: string
	inserts: number
	updates: number
	deletes: number
}
