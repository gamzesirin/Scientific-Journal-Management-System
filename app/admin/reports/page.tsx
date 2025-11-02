import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ReportsCharts from '@/features/admin/components/ReportsCharts'
import ActivityLog from '@/features/admin/components/ActivityLog'
import DownloadReportButton from '@/features/admin/components/DownloadReportButton'

export default async function AdminReportsPage() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Kullanıcı bilgilerini ve rolünü al
	const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()

	// Sadece admin erişebilir
	if (userData?.role !== 'admin') {
		redirect('/dashboard')
	}

	// Rapor verileri - with error handling
	let articles: any[] = []
	let users: any[] = []
	let reviews: any[] = []
	let deskEvaluations: any[] = []
	let coauthors: any[] = []
	let revisions: any[] = []

	try {
		const { data: articlesData, error: articlesError } = await supabase
			.from('articles')
			.select('status, created_at')
		if (articlesError) console.error('Articles fetch error:', articlesError)
		articles = articlesData || []

		const { data: usersData, error: usersError } = await supabase.from('users').select('role, created_at')
		if (usersError) console.error('Users fetch error:', usersError)
		users = usersData || []

		const { data: reviewsData, error: reviewsError } = await supabase.from('reviews').select('status, created_at')
		if (reviewsError) console.error('Reviews fetch error:', reviewsError)
		reviews = reviewsData || []

		const { data: deskEvalsData, error: deskEvalsError } = await supabase
			.from('editor_desk_evaluations')
			.select('decision, created_at')
		if (deskEvalsError) console.error('Desk evaluations fetch error:', deskEvalsError)
		deskEvaluations = deskEvalsData || []

		const { data: coauthorsData, error: coauthorsError } = await supabase
			.from('article_coauthors')
			.select('id, article_id, created_at')
		if (coauthorsError) console.error('Coauthors fetch error:', coauthorsError)
		coauthors = coauthorsData || []

		const { data: revisionsData, error: revisionsError } = await supabase
			.from('article_versions')
			.select('id, article_id, version_number, created_at')
		if (revisionsError) console.error('Revisions fetch error:', revisionsError)
		revisions = revisionsData || []
	} catch (error) {
		console.error('Failed to fetch report data:', error)
	}

	// Son aktiviteleri çek - makaleler, kullanıcılar, değerlendirmeler ve kararları birleştir
	const activities: any[] = []

	// Son makaleleri al
	let recentArticles: any[] | null = null
	try {
		const { data, error } = await supabase
			.from('articles')
			.select('id, title, author_id, created_at, users!articles_author_id_fkey(name)')
			.order('created_at', { ascending: false })
			.limit(5)
		if (error) {
			console.error('Recent articles fetch error:', error)
		}
		recentArticles = data
	} catch (error) {
		console.error('Failed to fetch recent articles:', error)
	}

	// Fallback: eğer join başarısız olursa
	if (!recentArticles) {
		try {
			const { data: articlesSimple, error: articlesSimpleError } = await supabase
				.from('articles')
				.select('id, title, author_id, created_at')
				.order('created_at', { ascending: false })
				.limit(5)

			if (articlesSimpleError) console.error('Articles simple fetch error:', articlesSimpleError)

			if (articlesSimple && articlesSimple.length > 0) {
				const authorIds = [...new Set(articlesSimple.map((a) => a.author_id))]
				const { data: authors, error: authorsError } = await supabase
					.from('users')
					.select('id, name')
					.in('id', authorIds)

				if (authorsError) console.error('Authors fetch error:', authorsError)

				const authorsMap = new Map(authors?.map((a) => [a.id, a.name]) || [])

				for (const article of articlesSimple) {
					activities.push({
						id: `article-${article.id}`,
						type: 'article' as const,
						action: 'Yeni Makale Gönderildi',
						description: article.title,
						user: authorsMap.get(article.author_id) || 'Bilinmeyen Kullanıcı',
						created_at: article.created_at,
						status: 'success' as const
					})
				}
			}
		} catch (error) {
			console.error('Failed to fetch articles fallback:', error)
		}
	} else {
		for (const article of recentArticles) {
			const author = Array.isArray(article.users) ? article.users[0] : article.users
			activities.push({
				id: `article-${article.id}`,
				type: 'article' as const,
				action: 'Yeni Makale Gönderildi',
				description: article.title,
				user: author?.name || 'Bilinmeyen Kullanıcı',
				created_at: article.created_at,
				status: 'success' as const
			})
		}
	}

	// Son değerlendirmeleri al
	let recentReviews: any[] | null = null
	try {
		const { data, error } = await supabase
			.from('reviews')
			.select(
				'id, article_id, reviewer_id, created_at, users!reviews_reviewer_id_fkey(name), articles!reviews_article_id_fkey(title)'
			)
			.order('created_at', { ascending: false })
			.limit(5)
		if (error) {
			console.error('Recent reviews fetch error:', error)
		}
		recentReviews = data
	} catch (error) {
		console.error('Failed to fetch recent reviews:', error)
	}

	// Fallback: eğer join başarısız olursa
	if (!recentReviews) {
		try {
			const { data: reviewsSimple, error: reviewsSimpleError } = await supabase
				.from('reviews')
				.select('id, article_id, reviewer_id, created_at')
				.order('created_at', { ascending: false })
				.limit(5)

			if (reviewsSimpleError) console.error('Reviews simple fetch error:', reviewsSimpleError)

			if (reviewsSimple && reviewsSimple.length > 0) {
				const reviewerIds = [...new Set(reviewsSimple.map((r) => r.reviewer_id))]
				const articleIds = [...new Set(reviewsSimple.map((r) => r.article_id))]

				const { data: reviewers, error: reviewersError } = await supabase
					.from('users')
					.select('id, name')
					.in('id', reviewerIds)

				if (reviewersError) console.error('Reviewers fetch error:', reviewersError)

				const { data: reviewArticles, error: reviewArticlesError } = await supabase
					.from('articles')
					.select('id, title')
					.in('id', articleIds)

				if (reviewArticlesError) console.error('Review articles fetch error:', reviewArticlesError)

				const reviewersMap = new Map(reviewers?.map((r) => [r.id, r.name]) || [])
				const articlesMap = new Map(reviewArticles?.map((a) => [a.id, a.title]) || [])

				for (const review of reviewsSimple) {
					activities.push({
						id: `review-${review.id}`,
						type: 'review' as const,
						action: 'Yeni Değerlendirme',
						description: `"${articlesMap.get(review.article_id) || 'Bilinmeyen Makale'}" için değerlendirme yapıldı`,
						user: reviewersMap.get(review.reviewer_id) || 'Bilinmeyen Hakem',
						created_at: review.created_at,
						status: 'info' as const
					})
				}
			}
		} catch (error) {
			console.error('Failed to fetch reviews fallback:', error)
		}
	} else {
		for (const review of recentReviews) {
			const reviewer = Array.isArray(review.users) ? review.users[0] : review.users
			const article = Array.isArray(review.articles) ? review.articles[0] : review.articles
			activities.push({
				id: `review-${review.id}`,
				type: 'review' as const,
				action: 'Yeni Değerlendirme',
				description: `"${article?.title || 'Bilinmeyen Makale'}" için değerlendirme yapıldı`,
				user: reviewer?.name || 'Bilinmeyen Hakem',
				created_at: review.created_at,
				status: 'info' as const
			})
		}
	}

	// Son kararları al
	let recentDecisions: any[] | null = null
	try {
		const { data, error } = await supabase
			.from('decisions')
			.select(
				'id, article_id, decision_type, created_at, users!decisions_editor_id_fkey(name), articles!decisions_article_id_fkey(title)'
			)
			.order('created_at', { ascending: false })
			.limit(5)
		if (error) {
			console.error('Recent decisions fetch error:', error)
		}
		recentDecisions = data
	} catch (error) {
		console.error('Failed to fetch recent decisions:', error)
	}

	// Fallback
	if (!recentDecisions) {
		try {
			const { data: decisionsSimple, error: decisionsSimpleError } = await supabase
				.from('decisions')
				.select('id, article_id, editor_id, decision_type, created_at')
				.order('created_at', { ascending: false })
				.limit(5)

			if (decisionsSimpleError) console.error('Decisions simple fetch error:', decisionsSimpleError)

			if (decisionsSimple && decisionsSimple.length > 0) {
				const editorIds = [...new Set(decisionsSimple.map((d) => d.editor_id))]
				const articleIds = [...new Set(decisionsSimple.map((d) => d.article_id))]

				const { data: editors, error: editorsError } = await supabase
					.from('users')
					.select('id, name')
					.in('id', editorIds)

				if (editorsError) console.error('Editors fetch error:', editorsError)

				const { data: decisionArticles, error: decisionArticlesError } = await supabase
					.from('articles')
					.select('id, title')
					.in('id', articleIds)

				if (decisionArticlesError) console.error('Decision articles fetch error:', decisionArticlesError)

				const editorsMap = new Map(editors?.map((e) => [e.id, e.name]) || [])
				const articlesMap = new Map(decisionArticles?.map((a) => [a.id, a.title]) || [])

				for (const decision of decisionsSimple) {
					const decisionLabel =
						decision.decision_type === 'accept' ? 'Kabul' : decision.decision_type === 'reject' ? 'Red' : 'Revizyon'
					activities.push({
						id: `decision-${decision.id}`,
						type: 'decision' as const,
						action: 'Editöryal Karar',
						description: `"${
							articlesMap.get(decision.article_id) || 'Bilinmeyen Makale'
						}" için ${decisionLabel} kararı verildi`,
						user: editorsMap.get(decision.editor_id) || 'Bilinmeyen Editör',
						created_at: decision.created_at,
						status:
							decision.decision_type === 'accept'
								? ('success' as const)
								: decision.decision_type === 'reject'
								? ('error' as const)
								: ('info' as const)
					})
				}
			}
		} catch (error) {
			console.error('Failed to fetch decisions fallback:', error)
		}
	} else {
		for (const decision of recentDecisions) {
			const editor = Array.isArray(decision.users) ? decision.users[0] : decision.users
			const article = Array.isArray(decision.articles) ? decision.articles[0] : decision.articles
			const decisionLabel =
				decision.decision_type === 'accept' ? 'Kabul' : decision.decision_type === 'reject' ? 'Red' : 'Revizyon'
			activities.push({
				id: `decision-${decision.id}`,
				type: 'decision' as const,
				action: 'Editöryal Karar',
				description: `"${article?.title || 'Bilinmeyen Makale'}" için ${decisionLabel} kararı verildi`,
				user: editor?.name || 'Bilinmeyen Editör',
				created_at: decision.created_at,
				status:
					decision.decision_type === 'accept'
						? ('success' as const)
						: decision.decision_type === 'reject'
						? ('error' as const)
						: ('info' as const)
			})
		}
	}

	// Son desk evaluations'ları al
	let recentDeskEvals: any[] | null = null
	try {
		const { data, error } = await supabase
			.from('editor_desk_evaluations')
			.select(
				'id, article_id, decision, created_at, users!editor_desk_evaluations_editor_id_fkey(name), articles!editor_desk_evaluations_article_id_fkey(title)'
			)
			.order('created_at', { ascending: false })
			.limit(5)
		if (error) {
			console.error('Recent desk evaluations fetch error:', error)
		}
		recentDeskEvals = data
	} catch (error) {
		console.error('Failed to fetch recent desk evaluations:', error)
	}

	// Fallback
	if (!recentDeskEvals) {
		try {
			const { data: deskEvalsSimple, error: deskEvalsSimpleError } = await supabase
				.from('editor_desk_evaluations')
				.select('id, article_id, editor_id, decision, created_at')
				.order('created_at', { ascending: false })
				.limit(5)

			if (deskEvalsSimpleError) console.error('Desk evals simple fetch error:', deskEvalsSimpleError)

			if (deskEvalsSimple && deskEvalsSimple.length > 0) {
				const editorIds = [...new Set(deskEvalsSimple.map((d) => d.editor_id))]
				const articleIds = [...new Set(deskEvalsSimple.map((d) => d.article_id))]

				const { data: editors, error: editorsError } = await supabase
					.from('users')
					.select('id, name')
					.in('id', editorIds)

				if (editorsError) console.error('Editors fetch error:', editorsError)

				const { data: deskEvalArticles, error: deskEvalArticlesError } = await supabase
					.from('articles')
					.select('id, title')
					.in('id', articleIds)

				if (deskEvalArticlesError) console.error('Desk eval articles fetch error:', deskEvalArticlesError)

				const editorsMap = new Map(editors?.map((e) => [e.id, e.name]) || [])
				const articlesMap = new Map(deskEvalArticles?.map((a) => [a.id, a.title]) || [])

				for (const deskEval of deskEvalsSimple) {
					const decisionLabel =
						deskEval.decision === 'approve_for_review'
							? 'Onaylandı'
							: deskEval.decision === 'reject'
							? 'Reddedildi'
							: 'Beklemede'
					activities.push({
						id: `desk-eval-${deskEval.id}`,
						type: 'desk_evaluation' as const,
						action: 'Desk Evaluation',
						description: `"${articlesMap.get(deskEval.article_id) || 'Bilinmeyen Makale'}" - ${decisionLabel}`,
						user: editorsMap.get(deskEval.editor_id) || 'Bilinmeyen Editör',
						created_at: deskEval.created_at,
						status:
							deskEval.decision === 'approve_for_review'
								? ('success' as const)
								: deskEval.decision === 'reject'
								? ('error' as const)
								: ('info' as const)
					})
				}
			}
		} catch (error) {
			console.error('Failed to fetch desk evaluations fallback:', error)
		}
	} else {
		for (const deskEval of recentDeskEvals) {
			const editor = Array.isArray(deskEval.users) ? deskEval.users[0] : deskEval.users
			const article = Array.isArray(deskEval.articles) ? deskEval.articles[0] : deskEval.articles
			const decisionLabel =
				deskEval.decision === 'approve_for_review'
					? 'Onaylandı'
					: deskEval.decision === 'reject'
					? 'Reddedildi'
					: 'Beklemede'
			activities.push({
				id: `desk-eval-${deskEval.id}`,
				type: 'desk_evaluation' as const,
				action: 'Desk Evaluation',
				description: `"${article?.title || 'Bilinmeyen Makale'}" - ${decisionLabel}`,
				user: editor?.name || 'Bilinmeyen Editör',
				created_at: deskEval.created_at,
				status:
					deskEval.decision === 'approve_for_review'
						? ('success' as const)
						: deskEval.decision === 'reject'
						? ('error' as const)
						: ('info' as const)
			})
		}
	}

	// Aktiviteleri tarihe göre sırala
	activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

	// İlk 10 aktiviteyi al
	const recentActivities = activities.slice(0, 10)

	// İstatistikler
	const uniqueArticlesWithCoauthors = new Set(coauthors?.map((c) => c.article_id)).size
	const uniqueArticlesWithRevisions = new Set(revisions?.map((r) => r.article_id)).size

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				{/* Header */}
				<div className="mb-6">
					<Link href="/dashboard">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Dashboard&apos;a Dön
						</Button>
					</Link>
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-2xl">Raporlar ve İstatistikler</CardTitle>
									<CardDescription>Sistem genelindeki aktiviteleri ve istatistikleri görüntüleyin</CardDescription>
								</div>
								<DownloadReportButton articles={articles || []} users={users || []} reviews={reviews || []} />
							</div>
						</CardHeader>
					</Card>
				</div>

				{/* Reports */}
				<div className="space-y-6">
					{/* Overview Stats */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Toplam Kullanıcı</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{users?.length || 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Toplam Makale</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{articles?.length || 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Toplam Değerlendirme</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{reviews?.length || 0}</p>
							</CardContent>
						</Card>
						<Card className="border-blue-200 bg-blue-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm text-blue-900">Desk Evaluations</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold text-blue-600">{deskEvaluations?.length || 0}</p>
								<p className="text-xs text-gray-600 mt-1">
									{deskEvaluations?.filter((d) => d.decision === 'approve_for_review').length || 0} Onaylandı
								</p>
							</CardContent>
						</Card>
						<Card className="border-green-200 bg-green-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm text-green-900">Ortak Yazarlar</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold text-green-600">{coauthors?.length || 0}</p>
								<p className="text-xs text-gray-600 mt-1">{uniqueArticlesWithCoauthors} Makale</p>
							</CardContent>
						</Card>
						<Card className="border-purple-200 bg-purple-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm text-purple-900">Revizyonlar</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold text-purple-600">{revisions?.length || 0}</p>
								<p className="text-xs text-gray-600 mt-1">{uniqueArticlesWithRevisions} Makale</p>
							</CardContent>
						</Card>
					</div>

					{/* Charts */}
					<Card>
						<CardHeader>
							<CardTitle>Grafikler ve Analizler</CardTitle>
						</CardHeader>
						<CardContent>
							<ReportsCharts articles={articles || []} users={users || []} reviews={reviews || []} />
						</CardContent>
					</Card>

					{/* Activity Log */}
					<Card>
						<CardHeader>
							<CardTitle>Son Aktiviteler</CardTitle>
							<CardDescription>Sistemdeki son 10 aktivite</CardDescription>
						</CardHeader>
						<CardContent>
							<ActivityLog activities={recentActivities} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
