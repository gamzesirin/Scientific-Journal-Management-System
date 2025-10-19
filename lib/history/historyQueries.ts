// ============================================
// HISTORY QUERY HELPERS
// ============================================
// Veritabanından history verilerini çekmek için helper fonksiyonlar

import { createClient } from '@/lib/supabase/client'
import type {
	ArticleHistory,
	ReviewHistory,
	UserHistory,
	AssignmentHistory,
	AuditLog,
	HistoryFilters,
	AuditLogFilters,
	UnifiedHistoryEntry,
	HistoryStats,
	UserActivitySummary
} from '@/features/history/types/history.types'

// ============================================
// ARTICLE HISTORY QUERIES
// ============================================

export async function getArticleHistory(articleId: string, limit = 50) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('articles_history')
		.select(
			`
      *,
      changed_by_user:users!articles_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('article_id', articleId)
		.order('changed_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching article history:', error)
		return { data: null, error }
	}

	return { data: data as ArticleHistory[], error: null }
}

export async function getArticleStatusChanges(articleId: string) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('articles_history')
		.select(
			`
      *,
      changed_by_user:users!articles_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('article_id', articleId)
		.eq('action', 'STATUS_CHANGE')
		.order('changed_at', { ascending: false })

	if (error) {
		console.error('Error fetching status changes:', error)
		return { data: null, error }
	}

	return { data: data as ArticleHistory[], error: null }
}

// ============================================
// REVIEW HISTORY QUERIES
// ============================================

export async function getReviewHistory(reviewId: string, limit = 50) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('reviews_history')
		.select(
			`
      *,
      changed_by_user:users!reviews_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('review_id', reviewId)
		.order('changed_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching review history:', error)
		return { data: null, error }
	}

	return { data: data as ReviewHistory[], error: null }
}

export async function getReviewerActivityForArticle(articleId: string) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('reviews_history')
		.select(
			`
      *,
      changed_by_user:users!reviews_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('article_id', articleId)
		.order('changed_at', { ascending: false })

	if (error) {
		console.error('Error fetching reviewer activity:', error)
		return { data: null, error }
	}

	return { data: data as ReviewHistory[], error: null }
}

// ============================================
// USER HISTORY QUERIES
// ============================================

export async function getUserHistory(userId: string, limit = 50) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('users_history')
		.select(
			`
      *,
      changed_by_user:users!users_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('user_id', userId)
		.order('changed_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching user history:', error)
		return { data: null, error }
	}

	return { data: data as UserHistory[], error: null }
}

export async function getUserRoleChanges(userId: string) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('users_history')
		.select(
			`
      *,
      changed_by_user:users!users_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('user_id', userId)
		.eq('action', 'ROLE_CHANGE')
		.order('changed_at', { ascending: false })

	if (error) {
		console.error('Error fetching role changes:', error)
		return { data: null, error }
	}

	return { data: data as UserHistory[], error: null }
}

// ============================================
// ASSIGNMENT HISTORY QUERIES
// ============================================

export async function getAssignmentHistory(assignmentId: string, limit = 50) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('assignments_history')
		.select(
			`
      *,
      changed_by_user:users!assignments_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('assignment_id', assignmentId)
		.order('changed_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching assignment history:', error)
		return { data: null, error }
	}

	return { data: data as AssignmentHistory[], error: null }
}

export async function getAssignmentHistoryForArticle(articleId: string) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('assignments_history')
		.select(
			`
      *,
      changed_by_user:users!assignments_history_changed_by_fkey(name, email, role)
    `
		)
		.eq('article_id', articleId)
		.order('changed_at', { ascending: false })

	if (error) {
		console.error('Error fetching assignment history:', error)
		return { data: null, error }
	}

	return { data: data as AssignmentHistory[], error: null }
}

// ============================================
// UNIFIED HISTORY QUERIES
// ============================================

export async function getRecentChanges(filters?: HistoryFilters) {
	const supabase = createClient()
	const limit = filters?.limit || 100

	const { data, error } = await supabase
		.from('v_recent_changes')
		.select('*')
		.order('changed_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching recent changes:', error)
		return { data: null, error }
	}

	return { data: data as UnifiedHistoryEntry[], error: null }
}

export async function getRecordTimeline(tableName: string, recordId: string) {
	const supabase = createClient()

	let query = supabase.from(`${tableName}_history`).select('*').eq(`${tableName.slice(0, -1)}_id`, recordId)

	if (tableName === 'articles') {
		query = query.eq('article_id', recordId)
	} else if (tableName === 'reviews') {
		query = query.eq('review_id', recordId)
	} else if (tableName === 'users') {
		query = query.eq('user_id', recordId)
	} else if (tableName === 'assignments') {
		query = query.eq('assignment_id', recordId)
	}

	const { data, error } = await query.order('changed_at', { ascending: false })

	if (error) {
		console.error('Error fetching record timeline:', error)
		return { data: null, error }
	}

	return { data, error: null }
}

// ============================================
// AUDIT LOG QUERIES
// ============================================

export async function getAuditLogs(filters?: AuditLogFilters) {
	const supabase = createClient()

	let query = supabase.from('audit_log').select('*')

	if (filters?.table_name) {
		query = query.eq('table_name', filters.table_name)
	}
	if (filters?.record_id) {
		query = query.eq('record_id', filters.record_id)
	}
	if (filters?.action) {
		query = query.eq('action', filters.action)
	}
	if (filters?.severity) {
		query = query.eq('severity', filters.severity)
	}
	if (filters?.user_email) {
		query = query.eq('user_email', filters.user_email)
	}
	if (filters?.user_role) {
		query = query.eq('user_role', filters.user_role)
	}
	if (filters?.date_from) {
		query = query.gte('created_at', filters.date_from)
	}
	if (filters?.date_to) {
		query = query.lte('created_at', filters.date_to)
	}

	query = query.order('created_at', { ascending: false }).limit(filters?.limit || 100)

	if (filters?.offset) {
		query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching audit logs:', error)
		return { data: null, error }
	}

	return { data: data as AuditLog[], error: null }
}

export async function getUserAuditLogs(userId: string, limit = 50) {
	const supabase = createClient()

	const { data, error } = await supabase
		.from('audit_log')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) {
		console.error('Error fetching user audit logs:', error)
		return { data: null, error }
	}

	return { data: data as AuditLog[], error: null }
}

// ============================================
// STATISTICS & REPORTING
// ============================================

export async function getHistoryStats(dateFrom?: string, dateTo?: string): Promise<{
	data: HistoryStats | null
	error: any
}> {
	const supabase = createClient()

	try {
		// Get recent changes
		const { data: recentChanges } = await getRecentChanges({ limit: 10 })

		// Get audit logs with filters
		const filters: AuditLogFilters = {}
		if (dateFrom) filters.date_from = dateFrom
		if (dateTo) filters.date_to = dateTo

		const { data: auditLogs } = await getAuditLogs(filters)

		if (!auditLogs) {
			return { data: null, error: 'Failed to fetch audit logs' }
		}

		// Calculate statistics
		const by_action: Record<string, number> = {}
		const by_table: Record<string, number> = {}
		const by_user_map: Record<string, { name: string; count: number }> = {}

		auditLogs.forEach((log) => {
			// By action
			by_action[log.action] = (by_action[log.action] || 0) + 1

			// By table
			by_table[log.table_name] = (by_table[log.table_name] || 0) + 1

			// By user
			if (log.user_id && log.user_email) {
				if (!by_user_map[log.user_id]) {
					by_user_map[log.user_id] = { name: log.user_email, count: 0 }
				}
				by_user_map[log.user_id].count++
			}
		})

		const by_user = Object.entries(by_user_map)
			.map(([user_id, data]) => ({
				user_id,
				user_name: data.name,
				count: data.count
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)

		const stats: HistoryStats = {
			total_changes: auditLogs.length,
			by_action: by_action as any,
			by_table,
			by_user,
			recent_activity: recentChanges || []
		}

		return { data: stats, error: null }
	} catch (error) {
		console.error('Error calculating history stats:', error)
		return { data: null, error }
	}
}

export async function getUserActivitySummary() {
	const supabase = createClient()

	const { data, error } = await supabase.from('v_user_activity_summary').select('*').order('total_actions', {
		ascending: false
	})

	if (error) {
		console.error('Error fetching user activity summary:', error)
		return { data: null, error }
	}

	return { data: data as UserActivitySummary[], error: null }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export async function exportHistoryToJSON(tableName: string, recordId: string) {
	const { data } = await getRecordTimeline(tableName, recordId)
	if (!data) return null

	return JSON.stringify(data, null, 2)
}

export async function exportAuditLogsToJSON(filters?: AuditLogFilters) {
	const { data } = await getAuditLogs(filters)
	if (!data) return null

	return JSON.stringify(data, null, 2)
}
