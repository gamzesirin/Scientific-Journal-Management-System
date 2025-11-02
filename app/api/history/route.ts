import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/history
 * Genel history/audit verilerini çeker
 * Query params:
 * - table: articles, reviews, users, assignments, audit_log
 * - record_id: Belirli bir kaydın history'si
 * - action: Belirli bir action türü (INSERT, UPDATE, DELETE, etc.)
 * - limit: Sayfa başına kayıt sayısı (default: 50)
 * - offset: Sayfalama için offset
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

		// Get user role
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (!userData) {
			return NextResponse.json({ error: 'Forbidden - User data not found' }, { status: 403 })
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url)
		const table = searchParams.get('table') || 'audit_log'
		const recordId = searchParams.get('record_id')
		const action = searchParams.get('action')
		const limit = parseInt(searchParams.get('limit') || '50')
		const offset = parseInt(searchParams.get('offset') || '0')

		let query

		// Route to appropriate table
		switch (table) {
			case 'articles':
				// Authors can view their own articles history
				// Co-authors can view articles they're added to
				// Admins and Editors can view all

				// If requesting specific article history, check co-author permission
				if (recordId && userData.role !== 'admin' && userData.role !== 'editor') {
					// Check if user is the author or a co-author
					const { data: article } = await supabase
						.from('articles')
						.select('author_id')
						.eq('id', recordId)
						.single()

					const isAuthor = article?.author_id === user.id

					// Check if user is a co-author
					const { data: coauthorData } = await supabase
						.from('article_coauthors')
						.select('id')
						.eq('article_id', recordId)
						.eq('user_id', user.id)
						.single()

					const isCoauthor = !!coauthorData

					if (!isAuthor && !isCoauthor) {
						return NextResponse.json({ error: 'Forbidden - Cannot view this article history' }, { status: 403 })
					}
				}

				query = supabase
					.from('articles_history')
					.select(
						`
            *,
            changed_by_user:users!articles_history_changed_by_fkey(name, email, role)
          `
					)
					.order('changed_at', { ascending: false })
				if (recordId) query = query.eq('article_id', recordId)
				if (action) query = query.eq('action', action)
				break

			case 'reviews':
				query = supabase
					.from('reviews_history')
					.select(
						`
            *,
            changed_by_user:users!reviews_history_changed_by_fkey(name, email, role)
          `
					)
					.order('changed_at', { ascending: false })
				if (recordId) query = query.eq('review_id', recordId)
				if (action) query = query.eq('action', action)
				break

			case 'users':
				// Only admins can view user history
				if (userData.role !== 'admin' && recordId !== user.id) {
					return NextResponse.json({ error: 'Forbidden - Cannot view other users history' }, { status: 403 })
				}

				query = supabase
					.from('users_history')
					.select(
						`
            *,
            changed_by_user:users!users_history_changed_by_fkey(name, email, role)
          `
					)
					.order('changed_at', { ascending: false })
				if (recordId) query = query.eq('user_id', recordId)
				if (action) query = query.eq('action', action)
				break

			case 'assignments':
				query = supabase
					.from('assignments_history')
					.select(
						`
            *,
            changed_by_user:users!assignments_history_changed_by_fkey(name, email, role)
          `
					)
					.order('changed_at', { ascending: false })
				if (recordId) query = query.eq('assignment_id', recordId)
				if (action) query = query.eq('action', action)
				break

			case 'audit_log':
				// Only admins can view full audit log
				if (userData.role !== 'admin') {
					return NextResponse.json({ error: 'Forbidden - Admin access required for audit log' }, { status: 403 })
				}

				query = supabase.from('audit_log').select('*').order('created_at', { ascending: false })
				if (recordId) query = query.eq('record_id', recordId)
				if (action) query = query.eq('action', action)
				break

			default:
				return NextResponse.json({ error: 'Invalid table parameter' }, { status: 400 })
		}

		// Apply pagination
		query = query.range(offset, offset + limit - 1)

		const { data, error } = await query

		if (error) {
			console.error('Error fetching history:', error)
			console.error('Error details:', {
				message: error.message,
				details: error.details,
				hint: error.hint,
				code: error.code
			})
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		console.log(`History fetched successfully for ${table}, record: ${recordId}, count: ${data?.length || 0}`)
		return NextResponse.json({ data, count: data?.length || 0 })
	} catch (error) {
		console.error('Error in GET /api/history:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
