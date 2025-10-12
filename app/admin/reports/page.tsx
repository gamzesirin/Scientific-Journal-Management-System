import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
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

	// Rapor verileri
	const { data: articles } = await supabase.from('articles').select('status, created_at')
	const { data: users } = await supabase.from('users').select('role, created_at')
	const { data: reviews } = await supabase.from('reviews').select('status, created_at')

	// Son aktiviteleri çek - makaleler, kullanıcılar, değerlendirmeler ve kararları birleştir
	const activities = []

	// Son makaleleri al
	const { data: recentArticles } = await supabase
		.from('articles')
		.select('id, title, author_id, created_at, users!articles_author_id_fkey(name)')
		.order('created_at', { ascending: false })
		.limit(5)

	// Fallback: eğer join başarısız olursa
	if (!recentArticles) {
		const { data: articlesSimple } = await supabase
			.from('articles')
			.select('id, title, author_id, created_at')
			.order('created_at', { ascending: false })
			.limit(5)

		if (articlesSimple) {
			const authorIds = [...new Set(articlesSimple.map(a => a.author_id))]
			const { data: authors } = await supabase
				.from('users')
				.select('id, name')
				.in('id', authorIds)

			const authorsMap = new Map(authors?.map(a => [a.id, a.name]) || [])

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
	} else {
		for (const article of recentArticles) {
			activities.push({
				id: `article-${article.id}`,
				type: 'article' as const,
				action: 'Yeni Makale Gönderildi',
				description: article.title,
				user: article.users?.name || 'Bilinmeyen Kullanıcı',
				created_at: article.created_at,
				status: 'success' as const
			})
		}
	}

	// Son değerlendirmeleri al
	const { data: recentReviews } = await supabase
		.from('reviews')
		.select('id, article_id, reviewer_id, created_at, users!reviews_reviewer_id_fkey(name), articles!reviews_article_id_fkey(title)')
		.order('created_at', { ascending: false })
		.limit(5)

	// Fallback: eğer join başarısız olursa
	if (!recentReviews) {
		const { data: reviewsSimple } = await supabase
			.from('reviews')
			.select('id, article_id, reviewer_id, created_at')
			.order('created_at', { ascending: false })
			.limit(5)

		if (reviewsSimple) {
			const reviewerIds = [...new Set(reviewsSimple.map(r => r.reviewer_id))]
			const articleIds = [...new Set(reviewsSimple.map(r => r.article_id))]

			const { data: reviewers } = await supabase
				.from('users')
				.select('id, name')
				.in('id', reviewerIds)

			const { data: reviewArticles } = await supabase
				.from('articles')
				.select('id, title')
				.in('id', articleIds)

			const reviewersMap = new Map(reviewers?.map(r => [r.id, r.name]) || [])
			const articlesMap = new Map(reviewArticles?.map(a => [a.id, a.title]) || [])

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
	} else {
		for (const review of recentReviews) {
			activities.push({
				id: `review-${review.id}`,
				type: 'review' as const,
				action: 'Yeni Değerlendirme',
				description: `"${review.articles?.title || 'Bilinmeyen Makale'}" için değerlendirme yapıldı`,
				user: review.users?.name || 'Bilinmeyen Hakem',
				created_at: review.created_at,
				status: 'info' as const
			})
		}
	}

	// Son kararları al
	const { data: recentDecisions } = await supabase
		.from('decisions')
		.select('id, article_id, decision_type, created_at, users!decisions_editor_id_fkey(name), articles!decisions_article_id_fkey(title)')
		.order('created_at', { ascending: false })
		.limit(5)

	// Fallback
	if (!recentDecisions) {
		const { data: decisionsSimple } = await supabase
			.from('decisions')
			.select('id, article_id, editor_id, decision_type, created_at')
			.order('created_at', { ascending: false })
			.limit(5)

		if (decisionsSimple) {
			const editorIds = [...new Set(decisionsSimple.map(d => d.editor_id))]
			const articleIds = [...new Set(decisionsSimple.map(d => d.article_id))]

			const { data: editors } = await supabase
				.from('users')
				.select('id, name')
				.in('id', editorIds)

			const { data: decisionArticles } = await supabase
				.from('articles')
				.select('id, title')
				.in('id', articleIds)

			const editorsMap = new Map(editors?.map(e => [e.id, e.name]) || [])
			const articlesMap = new Map(decisionArticles?.map(a => [a.id, a.title]) || [])

			for (const decision of decisionsSimple) {
				const decisionLabel = decision.decision_type === 'accept' ? 'Kabul' : decision.decision_type === 'reject' ? 'Red' : 'Revizyon'
				activities.push({
					id: `decision-${decision.id}`,
					type: 'decision' as const,
					action: 'Editöryal Karar',
					description: `"${articlesMap.get(decision.article_id) || 'Bilinmeyen Makale'}" için ${decisionLabel} kararı verildi`,
					user: editorsMap.get(decision.editor_id) || 'Bilinmeyen Editör',
					created_at: decision.created_at,
					status: decision.decision_type === 'accept' ? 'success' as const : decision.decision_type === 'reject' ? 'error' as const : 'info' as const
				})
			}
		}
	} else {
		for (const decision of recentDecisions) {
			const decisionLabel = decision.decision_type === 'accept' ? 'Kabul' : decision.decision_type === 'reject' ? 'Red' : 'Revizyon'
			activities.push({
				id: `decision-${decision.id}`,
				type: 'decision' as const,
				action: 'Editöryal Karar',
				description: `"${decision.articles?.title || 'Bilinmeyen Makale'}" için ${decisionLabel} kararı verildi`,
				user: decision.users?.name || 'Bilinmeyen Editör',
				created_at: decision.created_at,
				status: decision.decision_type === 'accept' ? 'success' as const : decision.decision_type === 'reject' ? 'error' as const : 'info' as const
			})
		}
	}

	// Aktiviteleri tarihe göre sırala
	activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

	// İlk 10 aktiviteyi al
	const recentActivities = activities.slice(0, 10)

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				{/* Header */}
				<div className="mb-6">
					<Link href="/dashboard">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Dashboard'a Dön
						</Button>
					</Link>
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-2xl">Raporlar ve İstatistikler</CardTitle>
									<CardDescription>
										Sistem genelindeki aktiviteleri ve istatistikleri görüntüleyin
									</CardDescription>
								</div>
								<DownloadReportButton
									articles={articles || []}
									users={users || []}
									reviews={reviews || []}
								/>
							</div>
						</CardHeader>
					</Card>
				</div>

				{/* Reports */}
				<div className="space-y-6">
					{/* Overview Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Toplam Kullanıcı</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{users?.length || 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Toplam Makale</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{articles?.length || 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Toplam Değerlendirme</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold">{reviews?.length || 0}</p>
							</CardContent>
						</Card>
					</div>

					{/* Charts */}
					<Card>
						<CardHeader>
							<CardTitle>Grafikler ve Analizler</CardTitle>
						</CardHeader>
						<CardContent>
							<ReportsCharts
								articles={articles || []}
								users={users || []}
								reviews={reviews || []}
							/>
						</CardContent>
					</Card>

					{/* Activity Log */}
					<Card>
						<CardHeader>
							<CardTitle>Son Aktiviteler</CardTitle>
							<CardDescription>
								Sistemdeki son 10 aktivite
							</CardDescription>
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
