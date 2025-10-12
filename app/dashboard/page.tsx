import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AuthorDashboard from '@/features/dashboard/components/AuthorDashboard'
import EditorDashboard from '@/features/dashboard/components/EditorDashboard'
import ReviewerDashboard from '@/features/dashboard/components/ReviewerDashboard'
import AdminDashboard from '@/features/dashboard/components/AdminDashboard'
import { Article } from '@/features/articles/types/article.types'
import { AdminStats } from '@/features/dashboard/types/dashboard.types'

export default async function DashboardPage() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Kullanıcı bilgilerini ve rolünü al
	const { data: userData } = await supabase
		.from('users')
		.select('*')
		.eq('id', user.id)
		.single()

	const role = userData?.role || 'author'

	// Role göre gerekli verileri çek
	interface Review {
		id: string
		paper_id: string
		reviewer_id: string
		status: 'draft' | 'submitted'
		created_at: string
		updated_at: string
	}

	interface DashboardData {
		articles?: Article[]
		allPapers?: Article[]
		assignedPapers?: Article[]
		reviews?: Review[]
		stats?: AdminStats
	}
	const dashboardData: DashboardData = {}

	switch (role) {
		case 'author':
			// Yazarın makalelerini al
			const { data: authorArticles } = await supabase
				.from('articles')
				.select('*')
				.eq('author_id', user.id)
				.order('created_at', { ascending: false })

			// Get all decisions to correct article status
			const { data: allDecisionsDebug } = await supabase
				.from('decisions')
				.select('*')

			console.log('ALL Decisions (no filter):', allDecisionsDebug)

			const { data: authorDecisions } = await supabase
				.from('decisions')
				.select('article_id, decision_type, status')
				.eq('status', 'final')

			console.log('Filtered Decisions (status=final):', authorDecisions)

			// Create a map of article_id -> decision_type
			const authorDecisionsByArticle = new Map(authorDecisions?.map(d => [d.article_id, d.decision_type]) || [])

			// Correct article statuses based on decisions
			dashboardData.articles = (authorArticles || []).map(paper => {
				let correctedStatus = paper.status
				const decision = authorDecisionsByArticle.get(paper.id)

				if (decision === 'revision' && paper.status === 'under_review') {
					correctedStatus = 'revision_requested'
				} else if (decision === 'accept' && paper.status !== 'accepted' && paper.status !== 'published') {
					correctedStatus = 'accepted'
				} else if (decision === 'reject' && paper.status !== 'rejected') {
					correctedStatus = 'rejected'
				}

				return {
					...paper,
					status: correctedStatus
				}
			})
			break

	case 'editor':
		// SADECE bu editöre atanan makaleleri al
		const { data: allPapers, error: editorError } = await supabase
			.from('articles')
			.select(`
				*,
				author:users!articles_author_id_fkey(name, email, affiliation)
			`)
			.eq('assigned_editor_id', user.id)
			.order('created_at', { ascending: false })

		// Eğer join'li query çalışmazsa, basit query dene
		if (editorError) {
			const { data: simplePapers, error: simpleError } = await supabase
				.from('articles')
				.select('*')
				.eq('assigned_editor_id', user.id)
				.order('created_at', { ascending: false })

				// Simple query ile gelen makaleleri format et
				if (simplePapers) {
					// Author bilgilerini ayrı çek
					const authorIds = [...new Set(simplePapers.map(p => p.author_id).filter(Boolean))]
					const { data: authors } = await supabase
						.from('users')
						.select('id, name, email, affiliation')
						.in('id', authorIds)

					const authorsMap = new Map(authors?.map(a => [a.id, a]) || [])

					// Assignment bilgilerini ayrı çek
					const { data: allAssignments } = await supabase
						.from('assignments')
						.select('*')

					// Review bilgilerini ayrı çek - tüm reviews
					const { data: allReviews } = await supabase
						.from('reviews')
						.select('*')

					// Create a map of assignment_id -> review status for completed reviews
					const reviewsByAssignment = new Map(
						allReviews?.filter(r => r.status === 'submitted').map(r => [r.assignment_id, r.status]) || []
					)

					// Update assignment status based on reviews
					const correctedAssignments = allAssignments?.map(assignment => {
						// If review is submitted but assignment is not completed, correct it
						if (reviewsByAssignment.has(assignment.id) && assignment.status !== 'completed') {
							return { ...assignment, status: 'completed' as const }
						}
						return assignment
					}) || []

					// Group assignments by article_id
					const assignmentsByArticle = new Map()
					correctedAssignments.forEach(assignment => {
						if (!assignmentsByArticle.has(assignment.article_id)) {
							assignmentsByArticle.set(assignment.article_id, [])
						}
						assignmentsByArticle.get(assignment.article_id).push(assignment)
					})

					// Group reviews by article_id
					const reviewsByArticle = new Map()
					allReviews?.forEach(review => {
						if (!reviewsByArticle.has(review.article_id)) {
							reviewsByArticle.set(review.article_id, [])
						}
						reviewsByArticle.get(review.article_id).push(review)
					})

					// Get all decisions to correct article status
					const { data: allDecisions } = await supabase
						.from('decisions')
						.select('article_id, decision_type, status')
						.eq('status', 'final')

					// Create a map of article_id -> decision_type
					const decisionsByArticle = new Map(allDecisions?.map(d => [d.article_id, d.decision_type]) || [])

					dashboardData.allPapers = simplePapers.map(paper => {
						// Correct article status based on decision
						let correctedStatus = paper.status
						const decision = decisionsByArticle.get(paper.id)

						if (decision === 'revision' && paper.status === 'under_review') {
							correctedStatus = 'revision_requested'
						} else if (decision === 'accept' && paper.status !== 'accepted' && paper.status !== 'published') {
							correctedStatus = 'accepted'
						} else if (decision === 'reject' && paper.status !== 'rejected') {
							correctedStatus = 'rejected'
						}

						return {
							...paper,
							status: correctedStatus,
							author: authorsMap.get(paper.author_id),
							assignments: assignmentsByArticle.get(paper.id) || [],
							reviews: reviewsByArticle.get(paper.id) || []
						}
					})
				} else {
					dashboardData.allPapers = []
				}
			} else {
				// Başarılı join ile gelen makaleler için assignments'ı ayrı çek
				const { data: allAssignments } = await supabase
					.from('assignments')
					.select('*')

				// Review bilgilerini ayrı çek - tüm reviews
				const { data: allReviews } = await supabase
					.from('reviews')
					.select('*')

				// Create a map of assignment_id -> review status for completed reviews
				const reviewsByAssignment = new Map(
					allReviews?.filter(r => r.status === 'submitted').map(r => [r.assignment_id, r.status]) || []
				)

				// Update assignment status based on reviews
				const correctedAssignments = allAssignments?.map(assignment => {
					// If review is submitted but assignment is not completed, correct it
					if (reviewsByAssignment.has(assignment.id) && assignment.status !== 'completed') {
						return { ...assignment, status: 'completed' as const }
					}
					return assignment
				}) || []

				// Group assignments by article_id
				const assignmentsByArticle = new Map()
				correctedAssignments.forEach(assignment => {
					if (!assignmentsByArticle.has(assignment.article_id)) {
						assignmentsByArticle.set(assignment.article_id, [])
					}
					assignmentsByArticle.get(assignment.article_id).push(assignment)
				})

				// Group reviews by article_id
				const reviewsByArticle = new Map()
				allReviews?.forEach(review => {
					if (!reviewsByArticle.has(review.article_id)) {
						reviewsByArticle.set(review.article_id, [])
					}
					reviewsByArticle.get(review.article_id).push(review)
				})

				// Get all decisions to correct article status
				const { data: allDecisions } = await supabase
					.from('decisions')
					.select('article_id, decision_type, status')
					.eq('status', 'final')

				// Create a map of article_id -> decision_type
				const decisionsByArticle = new Map(allDecisions?.map(d => [d.article_id, d.decision_type]) || [])

				dashboardData.allPapers = (allPapers || []).map(paper => {
					// Correct article status based on decision
					let correctedStatus = paper.status
					const decision = decisionsByArticle.get(paper.id)

					if (decision === 'revision' && paper.status === 'under_review') {
						correctedStatus = 'revision_requested'
					} else if (decision === 'accept' && paper.status !== 'accepted' && paper.status !== 'published') {
						correctedStatus = 'accepted'
					} else if (decision === 'reject' && paper.status !== 'rejected') {
						correctedStatus = 'rejected'
					}

					return {
						...paper,
						status: correctedStatus,
						assignments: assignmentsByArticle.get(paper.id) || [],
						reviews: reviewsByArticle.get(paper.id) || []
					}
				})
			}
			break

		case 'reviewer':
			// Hakeme atanan makaleleri al - foreign key ile join
			const { data: assignmentsWithArticles, error: assignmentsError } = await supabase
				.from('assignments')
				.select(`
					*,
					articles:article_id (
						id,
						title,
						abstract,
						keywords,
						file_url,
						status,
						author_id,
						created_at,
						updated_at
					)
				`)
				.eq('reviewer_id', user.id)
				.order('assigned_at', { ascending: false })

			console.log('Reviewer assignments with articles:', assignmentsWithArticles)
			console.log('Assignments error:', assignmentsError)

			// Eğer join başarılı olduysa
			if (assignmentsWithArticles && !assignmentsError) {
				dashboardData.assignedPapers = assignmentsWithArticles.map(assignment => ({
					...assignment.articles,
					article_id: assignment.article_id,
					deadline: assignment.deadline,
					assigned_at: assignment.assigned_at,
					assignment_status: assignment.status,
					assignment_id: assignment.id
				}))
			}
			// Join başarısız olduysa, eski yöntemi dene
			else {
				console.log('Join failed, trying separate queries...')
				const { data: assignments } = await supabase
					.from('assignments')
					.select('*')
					.eq('reviewer_id', user.id)
					.order('assigned_at', { ascending: false })

				console.log('Reviewer assignments:', assignments)
				console.log('Reviewer user ID:', user.id)

				// Article ID'leri topla ve articles'ları çek
				if (assignments && assignments.length > 0) {
					const articleIds = [...new Set(assignments.map(a => a.article_id).filter(Boolean))]
					console.log('Article IDs to fetch:', articleIds)

					const { data: articles, error: articlesError } = await supabase
						.from('articles')
						.select('*')
						.in('id', articleIds)

					console.log('Articles fetched:', articles)
					console.log('Articles error:', articlesError)

					const articlesMap = new Map(articles?.map(a => [a.id, a]) || [])

					// Transform assignments to match expected format
					dashboardData.assignedPapers = assignments.map(assignment => {
						const article = articlesMap.get(assignment.article_id)
						console.log(`Assignment ${assignment.id} -> Article:`, article)
						if (!article) {
							console.log(`Article not found for article_id: ${assignment.article_id}`)
							return null
						}

						return {
							...article,
							article_id: assignment.article_id,
							deadline: assignment.deadline,
							assigned_at: assignment.assigned_at,
							assignment_status: assignment.status,
							assignment_id: assignment.id
						}
					}).filter(Boolean) || []

					console.log('Final assigned papers:', dashboardData.assignedPapers)
				} else {
					console.log('No assignments found for reviewer')
					dashboardData.assignedPapers = []
				}
			}

			// Reviews tablosundan değerlendirmeleri al
			const { data: reviewerReviews } = await supabase
				.from('reviews')
				.select('*')
				.eq('reviewer_id', user.id)

			dashboardData.reviews = reviewerReviews || []
			break

		case 'admin':
			// Admin için genel istatistikleri al
			const { count: totalUsers } = await supabase
				.from('users')
				.select('*', { count: 'exact', head: true })

			const { count: totalPapers } = await supabase
				.from('articles')
				.select('*', { count: 'exact', head: true })

			// Rol bazlı kullanıcı sayıları
			const { data: usersByRole } = await supabase
				.from('users')
				.select('role')

			interface RoleCounts {
				admin: number
				editor: number
				reviewer: number
				author: number
				[key: string]: number
			}

			const roleCounts = usersByRole?.reduce((acc: RoleCounts, user: { role: string }) => {
				acc[user.role] = (acc[user.role] || 0) + 1
				return acc
			}, {
				admin: 0,
				editor: 0,
				reviewer: 0,
				author: 0
			})

			// Durum bazlı makale sayıları
			const { data: papersByStatus } = await supabase
				.from('articles')
				.select('status')

			interface StatusCounts {
				submitted: number
				under_review: number
				revision_requested: number
				accepted: number
				rejected: number
				published: number
				[key: string]: number
			}

			const statusCounts = papersByStatus?.reduce((acc: StatusCounts, paper: { status: string }) => {
				acc[paper.status] = (acc[paper.status] || 0) + 1
				return acc
			}, {
				submitted: 0,
				under_review: 0,
				revision_requested: 0,
				accepted: 0,
				rejected: 0,
				published: 0
			})

			dashboardData.stats = {
				totalUsers: totalUsers || 0,
				totalPapers: totalPapers || 0,
				totalReviews: 0, // TODO: reviews tablosu oluşturulduktan sonra
				usersByRole: roleCounts || {
					admin: 0,
					editor: 0,
					reviewer: 0,
					author: 0
				},
				papersByStatus: statusCounts || {
					submitted: 0,
					under_review: 0,
					accepted: 0,
					rejected: 0,
					published: 0
				}
			}
			break
	}

	async function handleSignOut() {
		'use server'
		const supabase = await createServerSupabaseClient()
		await supabase.auth.signOut()
		redirect('/auth/login')
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				{/* Header - Her rol için ortak */}
				<div className="mb-8">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-2xl">Dashboard</CardTitle>
									<CardDescription className="text-lg mt-2">
										Hoş geldiniz, {userData?.name}!
									</CardDescription>
									<div className="mt-2">
										<span className="text-sm text-gray-600">Email: {user.email}</span>
										<span className="ml-4 text-sm text-gray-600">
											Rol: <span className="font-semibold capitalize">{role}</span>
										</span>
									</div>
								</div>
								<form action={handleSignOut}>
									<Button variant="outline" type="submit">
										Çıkış Yap
									</Button>
								</form>
							</div>
						</CardHeader>
					</Card>
				</div>

				{/* Role göre dashboard içeriği */}
				{role === 'author' && (
					<AuthorDashboard
						user={user}
						userData={userData}
						articles={dashboardData.articles || []}
					/>
				)}

				{role === 'editor' && (
					<EditorDashboard
						user={user}
						userData={userData}
						allPapers={dashboardData.allPapers || []}
					/>
				)}

				{role === 'reviewer' && (
					<ReviewerDashboard
						user={user}
						userData={userData}
						assignedPapers={dashboardData.assignedPapers || []}
						reviews={dashboardData.reviews || []}
					/>
				)}

				{role === 'admin' && dashboardData.stats && (
					<AdminDashboard
						user={user}
						userData={userData}
						stats={dashboardData.stats}
					/>
				)}
			</div>
		</div>
	)
}