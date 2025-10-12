import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import AssignReviewerForm from '@/features/editor/components/AssignReviewerForm'
import { Reviewer } from '@/features/editor/types/editor.types'

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export default async function AssignReviewerPage({ params }: PageProps) {
	const supabase = await createServerSupabaseClient()
	const resolvedParams = await params
	const paperId = resolvedParams.id

	// Get current user
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	// Get user data with role check
	const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()

	// Verify editor role
	if (userData?.role !== 'editor' && userData?.role !== 'admin') {
		redirect('/dashboard')
	}

	// Get paper details without join
	const { data: paper, error: paperError } = await supabase.from('articles').select('*').eq('id', paperId).single()

	if (!paper) {
		console.error('Paper not found for assignment:', paperId, paperError)
		notFound()
	}

	// Editörler sadece kendilerine atanan makaleleri yönetebilir (adminler hepsini yönetebilir)
	if (userData?.role === 'editor' && paper.assigned_editor_id !== user.id) {
		console.error('Editor not authorized to assign reviewers for this paper:', user.id, paper.assigned_editor_id)
		redirect('/dashboard')
	}

	// Get author info separately if paper exists
	let author = null
	if (paper.author_id) {
		const { data: authorData } = await supabase.from('users').select('name, email').eq('id', paper.author_id).single()

		author = authorData
	}

	// Use paperWithAuthor for the rest
	const paperWithAuthor = {
		...paper,
		author
	}

	// Get existing assignments
	const { data: existingAssignments } = await supabase
		.from('assignments')
		.select(
			`
			*,
			users!assignments_reviewer_id_fkey (
				id,
				name,
				email
			)
		`
		)
		.eq('article_id', paperId)

	// Get available reviewers (excluding author and already assigned)
	const assignedReviewerIds = existingAssignments?.map((a) => a.reviewer_id) || []
	const excludeIds = [...assignedReviewerIds, paperWithAuthor.author_id].filter(Boolean)

	const { data: availableReviewers } = await supabase
		.from('users')
		.select('id, name, email, expertise_areas')
		.eq('role', 'reviewer')
		.not('id', 'in', `(${excludeIds.join(',')})`)
		.eq('is_active', true)
		.order('name')

	// Transform to Reviewer type
	const reviewers: Reviewer[] =
		availableReviewers?.map((r) => ({
			id: r.id,
			name: r.name,
			email: r.email,
			expertise_areas: r.expertise_areas || []
		})) || []

	// Transform existing assignments for the form
	const formattedAssignments =
		existingAssignments?.map((a) => ({
			id: a.id,
			reviewer_id: a.reviewer_id,
			status: a.status,
			reviewer: {
				id: a.users.id,
				name: a.users.name,
				email: a.users.email
			}
		})) || []

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation */}
				<div className="mb-6">
					<Link href={`/editor/articles/${paperId}`}>
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Makale Detayına Dön
						</Button>
					</Link>
				</div>

				{/* Page Header */}
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Hakem Atama</h1>
					<p className="text-gray-600 mt-2">Makaleyi değerlendirecek hakemleri seçin</p>
				</div>

				{/* Paper Info Card */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Makale Bilgisi
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<h3 className="font-semibold">{paperWithAuthor.title}</h3>
							{paperWithAuthor.author && (
								<p className="text-sm text-gray-600">
									Yazar: {paperWithAuthor.author.name} ({paperWithAuthor.author.email})
								</p>
							)}
							<p className="text-sm text-gray-500 line-clamp-3">{paperWithAuthor.abstract}</p>
							{paperWithAuthor.keywords && paperWithAuthor.keywords.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									<span className="text-sm text-gray-600">Anahtar Kelimeler:</span>
									{paperWithAuthor.keywords.map((keyword: string, index: number) => (
										<span key={index} className="text-sm bg-gray-100 px-2 py-0.5 rounded">
											{keyword}
										</span>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Assignment Form */}
				<AssignReviewerForm
					paperId={paperId}
					paperTitle={paperWithAuthor.title}
					existingAssignments={formattedAssignments}
					availableReviewers={reviewers}
				/>
			</div>
		</div>
	)
}
