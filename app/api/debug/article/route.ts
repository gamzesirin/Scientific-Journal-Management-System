import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DEBUG ROUTE - Test article fetching
 * GET /api/debug/article?id=xxx
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = await createServerSupabaseClient()
		const { searchParams } = new URL(request.url)
		const articleId = searchParams.get('id')

		if (!articleId) {
			return NextResponse.json({ error: 'No article ID provided' }, { status: 400 })
		}

		// Check auth
		const {
			data: { user }
		} = await supabase.auth.getUser()

		const authInfo = {
			isAuthenticated: !!user,
			userId: user?.id || null
		}

		// Get user role if logged in
		let userRole = null
		if (user) {
			const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
			userRole = userData?.role || null
		}

		// Try to fetch article with join
		const { data: articleWithJoin, error: joinError } = await supabase
			.from('articles')
			.select(
				`
        *,
        author:users!articles_author_id_fkey(name, email, affiliation)
      `
			)
			.eq('id', articleId)
			.single()

		// Try simple query
		const { data: simpleArticle, error: simpleError } = await supabase
			.from('articles')
			.select('*')
			.eq('id', articleId)
			.single()

		// Check if user can access this article
		let accessCheck = {
			isAuthor: false,
			isAdmin: false,
			isEditor: false,
			hasAccess: false
		}

		if (user && simpleArticle) {
			accessCheck.isAuthor = user.id === simpleArticle.author_id
			accessCheck.isAdmin = userRole === 'admin'
			accessCheck.isEditor = userRole === 'editor'
			accessCheck.hasAccess = accessCheck.isAuthor || accessCheck.isAdmin || accessCheck.isEditor
		}

		return NextResponse.json({
			articleId,
			authInfo: {
				...authInfo,
				userRole
			},
			joinQuery: {
				success: !joinError && !!articleWithJoin,
				error: joinError?.message || null,
				errorCode: joinError?.code || null,
				data: articleWithJoin || null
			},
			simpleQuery: {
				success: !simpleError && !!simpleArticle,
				error: simpleError?.message || null,
				errorCode: simpleError?.code || null,
				data: simpleArticle || null
			},
			accessCheck,
			summary: {
				articleExists: !!simpleArticle,
				canFetchWithJoin: !joinError && !!articleWithJoin,
				userHasAccess: accessCheck.hasAccess,
				shouldShow404:
					!simpleArticle || (!accessCheck.isAuthor && !accessCheck.isAdmin && !accessCheck.isEditor)
			}
		})
	} catch (error) {
		console.error('Debug route error:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
