// ============================================
// HISTORY LOGGER UTILITY
// ============================================
// Helper fonksiyonlar ile manuel audit log ekleme

import { createClient } from '@/lib/supabase/client'
import { AuditSeverity, HistoryAction } from '@/features/history/types/history.types'

export interface LogAuditParams {
	tableName: string
	recordId?: string
	action: HistoryAction
	actionDescription?: string
	oldData?: Record<string, any>
	newData?: Record<string, any>
	severity?: AuditSeverity
	metadata?: Record<string, any>
}

/**
 * Manuel audit log ekleme fonksiyonu
 * Uygulama seviyesinde özel işlemleri loglamak için kullanılır
 *
 * @example
 * await logAudit({
 *   tableName: 'articles',
 *   recordId: article.id,
 *   action: 'CUSTOM',
 *   actionDescription: 'Admin reviewed article',
 *   newData: { status: 'reviewed' },
 *   severity: 'info'
 * })
 */
export async function logAudit(params: LogAuditParams): Promise<string | null> {
	const supabase = createClient()

	try {
		const { data, error } = await supabase.rpc('log_audit', {
			p_table_name: params.tableName,
			p_record_id: params.recordId || null,
			p_action: params.action,
			p_action_description: params.actionDescription || null,
			p_old_data: params.oldData ? JSON.stringify(params.oldData) : null,
			p_new_data: params.newData ? JSON.stringify(params.newData) : null,
			p_severity: params.severity || 'info',
			p_metadata: params.metadata ? JSON.stringify(params.metadata) : null
		})

		if (error) {
			console.error('Error logging audit:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('Exception in logAudit:', error)
		return null
	}
}

/**
 * Makale işlemleri için özel log fonksiyonu
 */
export async function logArticleAction(
	articleId: string,
	action: HistoryAction,
	description: string,
	metadata?: Record<string, any>
) {
	return logAudit({
		tableName: 'articles',
		recordId: articleId,
		action,
		actionDescription: description,
		severity: 'info',
		metadata
	})
}

/**
 * Değerlendirme işlemleri için özel log fonksiyonu
 */
export async function logReviewAction(
	reviewId: string,
	action: HistoryAction,
	description: string,
	metadata?: Record<string, any>
) {
	return logAudit({
		tableName: 'reviews',
		recordId: reviewId,
		action,
		actionDescription: description,
		severity: 'info',
		metadata
	})
}

/**
 * Kullanıcı işlemleri için özel log fonksiyonu
 */
export async function logUserAction(
	userId: string,
	action: HistoryAction,
	description: string,
	metadata?: Record<string, any>
) {
	return logAudit({
		tableName: 'users',
		recordId: userId,
		action,
		actionDescription: description,
		severity: 'info',
		metadata
	})
}

/**
 * Atama işlemleri için özel log fonksiyonu
 */
export async function logAssignmentAction(
	assignmentId: string,
	action: HistoryAction,
	description: string,
	metadata?: Record<string, any>
) {
	return logAudit({
		tableName: 'assignments',
		recordId: assignmentId,
		action,
		actionDescription: description,
		severity: 'info',
		metadata
	})
}

/**
 * Kritik hata logları için
 */
export async function logCriticalError(
	tableName: string,
	error: Error,
	context?: Record<string, any>
) {
	return logAudit({
		tableName,
		action: 'CUSTOM',
		actionDescription: `Critical error: ${error.message}`,
		severity: 'critical',
		metadata: {
			error: error.stack,
			...context
		}
	})
}

/**
 * Güvenlik olayları için
 */
export async function logSecurityEvent(
	eventType: string,
	description: string,
	severity: AuditSeverity = 'warning',
	metadata?: Record<string, any>
) {
	return logAudit({
		tableName: 'security_events',
		action: 'CUSTOM',
		actionDescription: `${eventType}: ${description}`,
		severity,
		metadata: {
			event_type: eventType,
			...metadata
		}
	})
}
