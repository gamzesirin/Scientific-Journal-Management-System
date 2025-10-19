import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/history/stats
 * İstatistik ve özet bilgiler
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = await createServerSupabaseClient()

		// Auth check
		const {
			data: { user }
		} = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if user is admin
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (!userData || userData.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url)
		const dateFrom = searchParams.get('date_from')
		const dateTo = searchParams.get('date_to')

		// Build audit log query
		let query = supabase.from('audit_log').select('table_name, action, user_id, user_email, created_at')

		if (dateFrom) {
			query = query.gte('created_at', dateFrom)
		}
		if (dateTo) {
			query = query.lte('created_at', dateTo)
		}

		const { data: auditLogs, error } = await query.order('created_at', { ascending: false }).limit(1000)

		if (error) {
			console.error('Error fetching audit logs for stats:', error)
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// Calculate statistics
		const by_action: Record<string, number> = {}
		const by_table: Record<string, number> = {}
		const by_user_map: Record<string, { name: string; count: number }> = {}

		auditLogs?.forEach((log) => {
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

		// Get recent changes from view
		const { data: recentChanges } = await supabase
			.from('v_recent_changes')
			.select('*')
			.order('changed_at', { ascending: false })
			.limit(10)

		const stats = {
			total_changes: auditLogs?.length || 0,
			by_action,
			by_table,
			by_user,
			recent_activity: recentChanges || [],
			date_range: {
				from: dateFrom,
				to: dateTo
			}
		}

		return NextResponse.json({ data: stats })
	} catch (error) {
		console.error('Error in GET /api/history/stats:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
