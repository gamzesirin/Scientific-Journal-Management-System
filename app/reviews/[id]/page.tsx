import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, User, Calendar, Clock } from 'lucide-react'
import ReviewForm from '@/features/reviewer/components/ReviewForm'

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export default async function ReviewPage({ params }: PageProps) {
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

	// Verify reviewer role
	if (userData?.role !== 'reviewer' && userData?.role !== 'admin') {
		redirect('/dashboard')
	}

	// Get assignment details
	const { data: assignment, error: assignmentError } = await supabase
		.from('assignments')
		.select('*')
		.eq('article_id', paperId)
		.eq('reviewer_id', user.id)
		.single()

	console.log('Assignment lookup:', { paperId, userId: user.id, assignment, assignmentError })

	if (!assignment) {
		console.error('Assignment not found:', { paperId, userId: user.id })
		notFound()
	}

	// Get paper details without join first
	const { data: paper, error: paperError } = await supabase.from('articles').select('*').eq('id', paperId).single()

	console.log('Paper lookup:', { paperId, paper, paperError })

	if (!paper) {
		console.error('Paper not found:', paperId)
		notFound()
	}

	// Get author info separately
	let author = null
	if (paper.author_id) {
		const { data: authorData } = await supabase
			.from('users')
			.select('name, email, affiliation')
			.eq('id', paper.author_id)
			.single()

		author = authorData
	}

	// Attach author to paper
	const paperWithAuthor = {
		...paper,
		author
	}

	// Get existing review
	const { data: existingReview } = await supabase
		.from('reviews')
		.select('*')
		.eq('article_id', paperId)
		.eq('reviewer_id', user.id)
		.single()

	// Calculate days remaining
	const getDaysRemaining = () => {
		if (!assignment.deadline) return null
		const now = new Date()
		const deadline = new Date(assignment.deadline)
		const diff = deadline.getTime() - now.getTime()
		return Math.ceil(diff / (1000 * 60 * 60 * 24))
	}

	const daysRemaining = getDaysRemaining()
	const isOverdue = daysRemaining !== null && daysRemaining < 0
	const isSubmitted = existingReview?.status === 'submitted'

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation */}
				<Link href="/dashboard">
					<Button variant="ghost" size="sm" className="mb-6">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Dashboard'a Dön
					</Button>
				</Link>

				{/* Paper Info */}
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-start">
							<div className="flex-1">
								<CardTitle className="text-xl mb-2">{paperWithAuthor.title}</CardTitle>
								<CardDescription className="space-y-2">
									<div className="flex items-center gap-2">
										<User className="h-4 w-4" />
										<span>{paperWithAuthor.author?.name || 'Bilinmeyen Yazar'}</span>
										{paperWithAuthor.author?.affiliation && (
											<span className="text-gray-400">• {paperWithAuthor.author.affiliation}</span>
										)}
									</div>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1">
											<Calendar className="h-4 w-4" />
											<span>Atanma: {new Date(assignment.assigned_at).toLocaleDateString('tr-TR')}</span>
										</div>
										{assignment.deadline && (
											<div className="flex items-center gap-1">
												<Clock className="h-4 w-4" />
												<span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
													Son: {new Date(assignment.deadline).toLocaleDateString('tr-TR')}
													{!isSubmitted && daysRemaining !== null && (
														<span
															className={`ml-1 ${
																isOverdue ? 'text-red-600' : daysRemaining < 3 ? 'text-yellow-600' : ''
															}`}
														>
															({isOverdue ? `${Math.abs(daysRemaining)} gün gecikmiş` : `${daysRemaining} gün kaldı`})
														</span>
													)}
												</span>
											</div>
										)}
									</div>
								</CardDescription>
							</div>
							<div className="ml-4 flex flex-col gap-2">
								{isSubmitted && <Badge variant="success">Değerlendirme Tamamlandı</Badge>}
								{isOverdue && !isSubmitted && <Badge variant="destructive">Süresi Geçmiş</Badge>}
								{paperWithAuthor.file_url && (
									<Button size="sm" variant="outline" asChild>
										<a href={paperWithAuthor.file_url} target="_blank" rel="noopener noreferrer">
											<FileText className="h-4 w-4 mr-2" />
											PDF'i Görüntüle
										</a>
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-sm text-gray-700 mb-1">Özet</h3>
								<p className="text-gray-600">{paperWithAuthor.abstract}</p>
							</div>
							{paperWithAuthor.keywords && paperWithAuthor.keywords.length > 0 && (
								<div>
									<h3 className="font-semibold text-sm text-gray-700 mb-1">Anahtar Kelimeler</h3>
									<div className="flex flex-wrap gap-2">
										{paperWithAuthor.keywords.map((keyword: string, index: number) => (
											<Badge key={index} variant="secondary">
												{keyword}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Review Form */}
				<ReviewForm paperId={paperId} assignmentId={assignment.id} existingReview={existingReview} />
			</div>
		</div>
	)
}
