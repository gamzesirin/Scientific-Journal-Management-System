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

			dashboardData.articles = authorArticles || []
			break

		case 'editor':
			// Tüm makaleleri al (editör hepsini görebilir)
			const { data: allPapers, error: editorError } = await supabase
				.from('articles')
				.select(`
					*,
					author:users!articles_author_id_fkey(name, email, affiliation)
				`)
				.order('created_at', { ascending: false })

			// Eğer join'li query çalışmazsa, basit query dene
			if (editorError) {
				const { data: simplePapers, error: simpleError } = await supabase
					.from('articles')
					.select('*')
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

					dashboardData.allPapers = simplePapers.map(paper => ({
						...paper,
						author: authorsMap.get(paper.author_id)
					}))
				} else {
					dashboardData.allPapers = []
				}
			} else {
				dashboardData.allPapers = allPapers || []
			}
			break

		case 'reviewer':
			// Hakeme atanan makaleleri al - foreign key ile join
			const { data: assignmentsWithArticles, error: assignmentsError } = await supabase
				.from('assignments')
				.select(`
					*,
					articles:paper_id (
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
					paper_id: assignment.paper_id,
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

				// Paper ID'leri topla ve articles'ları çek
				if (assignments && assignments.length > 0) {
					const paperIds = [...new Set(assignments.map(a => a.paper_id).filter(Boolean))]
					console.log('Paper IDs to fetch:', paperIds)

					const { data: articles, error: articlesError } = await supabase
						.from('articles')
						.select('*')
						.in('id', paperIds)

					console.log('Articles fetched:', articles)
					console.log('Articles error:', articlesError)

					const articlesMap = new Map(articles?.map(a => [a.id, a]) || [])

					// Transform assignments to match expected format
					dashboardData.assignedPapers = assignments.map(assignment => {
						const article = articlesMap.get(assignment.paper_id)
						console.log(`Assignment ${assignment.id} -> Article:`, article)
						if (!article) {
							console.log(`Article not found for paper_id: ${assignment.paper_id}`)
							return null
						}

						return {
							...article,
							paper_id: assignment.paper_id,  // Keep paper_id for reviews
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