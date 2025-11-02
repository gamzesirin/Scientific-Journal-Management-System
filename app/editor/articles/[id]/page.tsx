import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
	ArrowLeft,
	FileText,
	User,
	Calendar,
	Clock,
	Users,
	Edit,
	CheckCircle,
	XCircle,
	AlertCircle
} from 'lucide-react'
import { PDFDownloadSection } from '@/components/common/pdf-download-section'
import EditorDeskEvaluationForm from '@/features/editor/components/EditorDeskEvaluationForm'

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export default async function EditorPaperDetailPage({ params }: PageProps) {
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

	// Get paper details first without join
	const { data: paper, error: paperError } = await supabase.from('articles').select('*').eq('id', paperId).single()

	if (!paper) {
		console.error('Paper not found:', paperId, paperError)
		notFound()
	}

	// Editörler sadece kendilerine atanan makaleleri görebilir (adminler hepsini görebilir)
	if (userData?.role === 'editor' && paper.assigned_editor_id !== user.id) {
		console.error('Editor not authorized for this paper:', user.id, paper.assigned_editor_id)
		redirect('/dashboard')
	}

	// Get author info separately if paper exists
	let author = null
	if (paper.author_id) {
		const { data: authorData } = await supabase
			.from('users')
			.select('id, name, email, affiliation')
			.eq('id', paper.author_id)
			.single()

		author = authorData
	}

	// Use paperWithAuthor for the rest of the component
	let paperWithAuthor = {
		...paper,
		author
	}

	// Get decision to correct article status
	const { data: paperDecision } = await supabase
		.from('decisions')
		.select('decision_type, status')
		.eq('article_id', paperId)
		.eq('status', 'final')
		.single()

	// Correct article status based on decision
	if (paperDecision) {
		if (paperDecision.decision_type === 'revision' && paperWithAuthor.status === 'under_review') {
			paperWithAuthor = { ...paperWithAuthor, status: 'revision_requested' }
		} else if (
			paperDecision.decision_type === 'accept' &&
			paperWithAuthor.status !== 'accepted' &&
			paperWithAuthor.status !== 'published'
		) {
			paperWithAuthor = { ...paperWithAuthor, status: 'accepted' }
		} else if (paperDecision.decision_type === 'reject' && paperWithAuthor.status !== 'rejected') {
			paperWithAuthor = { ...paperWithAuthor, status: 'rejected' }
		}
	}

	// Get reviews first
	const { data: reviews } = await supabase
		.from('reviews')
		.select(
			`
			*,
			users!reviews_reviewer_id_fkey (
				name,
				email
			)
		`
		)
		.eq('article_id', paperId)

	// Get assignments first without join
	const { data: assignments, error: assignmentsError } = await supabase
		.from('assignments')
		.select('*')
		.eq('article_id', paperId)
		.order('assigned_at', { ascending: false })

	// Get reviewer info if assignments exist
	let finalAssignments = assignments
	if (assignments && assignments.length > 0) {
		// Get reviewer info separately
		const reviewerIds = [...new Set(assignments.map((a: any) => a.reviewer_id))]
		const { data: reviewers } = await supabase
			.from('users')
			.select('id, name, email, expertise_areas')
			.in('id', reviewerIds)

		const reviewersMap = new Map(reviewers?.map((r) => [r.id, r]) || [])

		// Map reviews by reviewer_id for easy lookup
		const reviewsByReviewer = new Map()
		if (reviews) {
			reviews.forEach((review: any) => {
				reviewsByReviewer.set(review.reviewer_id, review)
			})
		}

		finalAssignments = assignments.map((assignment: any) => {
			const review = reviewsByReviewer.get(assignment.reviewer_id)
			let status = assignment.status

			// Update assignment status based on review status
			if (review) {
				if (review.status === 'submitted') {
					status = 'completed'
				} else if (review.status === 'draft') {
					status = 'in_progress'
				}
			}

			return {
				...assignment,
				status,
				users: reviewersMap.get(assignment.reviewer_id)
			}
		})

		console.log('Final assignments with reviewer info:', finalAssignments)
	}

	// Get decision if exists
	const { data: decision } = await supabase.from('decisions').select('*').eq('article_id', paperId).single()

	// Get editor desk evaluation
	const { data: deskEvaluation } = await supabase
		.from('editor_desk_evaluations')
		.select('*')
		.eq('article_id', paperId)
		.order('created_at', { ascending: false })
		.limit(1)
		.single()

	// Check if there are new submitted reviews after the last decision
	// This is important for revision workflow where editor needs to make a new decision
	const hasNewReviewsAfterDecision = decision && reviews && reviews.length > 0
		? reviews.some((r: any) => {
				if (r.status !== 'submitted') return false
				if (!decision.finalized_at) return true
				const reviewDate = new Date(r.submitted_at || r.updated_at)
				const decisionDate = new Date(decision.finalized_at)
				return reviewDate > decisionDate
		  })
		: false

	// Show "Karar Ver" button when:
	// 1. No decision exists (first time), OR
	// 2. Article is resubmitted AND there are new submitted reviews
	const canMakeDecision = !decision || (paperWithAuthor.status === 'resubmitted' && hasNewReviewsAfterDecision)

	// Check if reviewer assignment is allowed
	// For submitted articles: always allow
	// For resubmitted articles: only if editor evaluation is done and positive
	const canAssignReviewer = paperWithAuthor.status === 'submitted' ||
		(paperWithAuthor.status === 'resubmitted' && deskEvaluation?.decision === 'accept')

	// Dosya URL'sinden gerçek dosya adını çıkar
	const getFileNameFromUrl = (url: string) => {
		try {
			const urlObj = new URL(url)
			const pathParts = urlObj.pathname.split('/')
			return decodeURIComponent(pathParts[pathParts.length - 1])
		} catch {
			return 'makale.pdf'
		}
	}

	const actualFileName = paperWithAuthor.file_url ? getFileNameFromUrl(paperWithAuthor.file_url) : 'makale.pdf'

	// Status configuration
	const getStatusBadge = (status: string) => {
		const statusConfig = {
			submitted: { label: 'Gönderildi', variant: 'secondary' as const },
			resubmitted: { label: 'Yeniden Gönderildi', variant: 'secondary' as const },
			under_review: { label: 'İnceleniyor', variant: 'default' as const },
			revision_requested: { label: 'Revizyon İstendi', variant: 'default' as const },
			accepted: { label: 'Kabul Edildi', variant: 'success' as const },
			rejected: { label: 'Reddedildi', variant: 'destructive' as const },
			published: { label: 'Yayınlandı', variant: 'outline' as const }
		}
		return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
	}

	const statusBadge = getStatusBadge(paperWithAuthor.status)

	// Calculate review progress
	const totalAssignments = finalAssignments?.length || 0
	const completedReviews = finalAssignments?.filter((a) => a.status === 'completed').length || 0
	const reviewProgress = totalAssignments > 0 ? Math.round((completedReviews / totalAssignments) * 100) : 0

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation */}
				<Link href="/dashboard">
					<Button variant="ghost" size="sm" className="mb-6">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Dashboard'a Dön
					</Button>
				</Link>

				{/* Paper Header */}
				<div className="mb-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">{paperWithAuthor.title}</h1>
							<div className="flex items-center gap-4 mt-2">
								<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
								{reviewProgress > 0 && (
									<span className="text-sm text-gray-600">İnceleme: %{reviewProgress} tamamlandı</span>
								)}
							</div>
						</div>
						<div className="flex gap-2">
							{paperWithAuthor.file_url && (
								<PDFDownloadSection fileUrl={paperWithAuthor.file_url} fileName={actualFileName} />
							)}
							{canAssignReviewer && (
								<Link href={`/editor/articles/${paperId}/assign`}>
									<Button>
										<Users className="h-4 w-4 mr-2" />
										Hakem Ata
									</Button>
								</Link>
							)}
							{reviews && reviews.length > 0 && canMakeDecision && (
								<Link href={`/editor/articles/${paperId}/decision`}>
									<Button variant="default">
										{decision ? 'Yeni Karar Ver' : 'Karar Ver'}
									</Button>
								</Link>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Desk Evaluation - Show for submitted or resubmitted articles without evaluation */}
						{(paperWithAuthor.status === 'submitted' ||
						  (paperWithAuthor.status === 'resubmitted' && !deskEvaluation)) && (
							<EditorDeskEvaluationForm articleId={paperId} articleTitle={paperWithAuthor.title} editorId={user.id} />
						)}

						{/* Show evaluation result for resubmitted articles */}
						{paperWithAuthor.status === 'resubmitted' && deskEvaluation && (
							<Card>
								<CardHeader>
									<CardTitle>Editör Ön Değerlendirmesi</CardTitle>
									<CardDescription>
										{deskEvaluation.decision === 'accept' ? (
											<span className="text-green-600">✓ Makale hakem değerlendirmesine uygun bulunmuştur</span>
										) : deskEvaluation.decision === 'reject' ? (
											<span className="text-red-600">✗ Makale reddedilmiştir</span>
										) : (
											<span className="text-yellow-600">⏳ Değerlendirme bekliyor</span>
										)}
									</CardDescription>
								</CardHeader>
								{(deskEvaluation.notes || deskEvaluation.rejection_reason) && (
									<CardContent>
										<p className="text-sm text-gray-600">
											{deskEvaluation.rejection_reason || deskEvaluation.notes}
										</p>
										{deskEvaluation.decision === 'accept' && !finalAssignments?.length && (
											<Link href={`/editor/articles/${paperId}/assign`}>
												<Button className="mt-4">
													<Users className="h-4 w-4 mr-2" />
													Hakem Ata
												</Button>
											</Link>
										)}
									</CardContent>
								)}
							</Card>
						)}

						{/* Paper Details */}
						<Card>
							<CardHeader>
								<CardTitle>Makale Detayları</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
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
							</CardContent>
						</Card>

						{/* Assignments */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Hakem Atamaları
								</CardTitle>
								<CardDescription>
									{totalAssignments} hakem atandı, {completedReviews} değerlendirme tamamlandı
								</CardDescription>
							</CardHeader>
							<CardContent>
								{finalAssignments && finalAssignments.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Hakem</TableHead>
												<TableHead>Atanma Tarihi</TableHead>
												<TableHead>Son Tarih</TableHead>
												<TableHead>Durum</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{finalAssignments.map((assignment: any) => {
												const daysRemaining = assignment.deadline
													? Math.ceil(
															(new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
													  )
													: null

												return (
													<TableRow key={assignment.id}>
														<TableCell>
															<div>
																<p className="font-medium">{assignment.users?.name || 'Bilinmeyen Hakem'}</p>
																<p className="text-sm text-gray-500">{assignment.users?.email || '-'}</p>
															</div>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-1 text-sm">
																<Calendar className="h-4 w-4" />
																{new Date(assignment.assigned_at).toLocaleDateString('tr-TR')}
															</div>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-1 text-sm">
																<Clock className="h-4 w-4" />
																{new Date(assignment.deadline).toLocaleDateString('tr-TR')}
																{assignment.status !== 'completed' && daysRemaining !== null && (
																	<span
																		className={`ml-1 ${
																			daysRemaining < 0 ? 'text-red-600' : daysRemaining < 3 ? 'text-yellow-600' : ''
																		}`}
																	>
																		(
																		{daysRemaining < 0
																			? `${Math.abs(daysRemaining)} gün gecikmiş`
																			: `${daysRemaining} gün kaldı`}
																		)
																	</span>
																)}
															</div>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	assignment.status === 'completed'
																		? 'success'
																		: assignment.status === 'in_progress'
																		? 'default'
																		: 'secondary'
																}
															>
																{assignment.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
																{assignment.status === 'completed'
																	? 'Tamamlandı'
																	: assignment.status === 'in_progress'
																	? 'Devam Ediyor'
																	: 'Bekliyor'}
															</Badge>
														</TableCell>
													</TableRow>
												)
											})}
										</TableBody>
									</Table>
								) : (
									<div className="text-center py-8">
										<Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
										<p className="text-gray-500">Henüz hakem atanmamış</p>
										{canAssignReviewer && (
											<Link href={`/editor/articles/${paperId}/assign`}>
												<Button className="mt-4">
													<Users className="h-4 w-4 mr-2" />
													İlk Hakemi Ata
												</Button>
											</Link>
										)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Reviews */}
						{reviews && reviews.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Değerlendirmeler</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{reviews.map((review: any) => (
											<div key={review.id} className="border rounded-lg p-4">
												<div className="flex items-start justify-between mb-3">
													<div>
														<p className="font-medium">{review.users.name}</p>
														<p className="text-sm text-gray-500">{review.users.email}</p>
													</div>
													<div className="text-right">
														<Badge variant={review.status === 'submitted' ? 'success' : 'secondary'}>
															{review.status === 'submitted' ? 'Tamamlandı' : 'Taslak'}
														</Badge>
														{review.submitted_at && (
															<p className="text-xs text-gray-500 mt-1">
																{new Date(review.submitted_at).toLocaleDateString('tr-TR')}
															</p>
														)}
													</div>
												</div>
												{review.status === 'submitted' && (
													<div className="space-y-2">
														<div className="flex items-center gap-4">
															<span className="text-sm font-medium">Puan:</span>
															<span className="text-sm">{review.overall_score}/5</span>
														</div>
														<div className="flex items-center gap-4">
															<span className="text-sm font-medium">Öneri:</span>
															<Badge
																variant={
																	review.recommendation === 'accept'
																		? 'success'
																		: review.recommendation === 'reject'
																		? 'destructive'
																		: 'default'
																}
															>
																{review.recommendation === 'accept'
																	? 'Kabul'
																	: review.recommendation === 'minor_revision'
																	? 'Küçük Revizyon'
																	: review.recommendation === 'major_revision'
																	? 'Büyük Revizyon'
																	: 'Red'}
															</Badge>
														</div>
														<div>
															<span className="text-sm font-medium">Yorumlar:</span>
															<p className="text-sm text-gray-600 mt-1">{review.comments}</p>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Author Info */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Yazar Bilgileri</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{paperWithAuthor.author ? (
										<>
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-gray-500" />
												<span className="text-sm">{paperWithAuthor.author.name}</span>
											</div>
											<div className="text-sm text-gray-600">{paperWithAuthor.author.email}</div>
											{paperWithAuthor.author.affiliation && (
												<div className="text-sm text-gray-600">{paperWithAuthor.author.affiliation}</div>
											)}
										</>
									) : (
										<div className="text-sm text-gray-500">Yazar bilgisi bulunamadı</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Dates */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Tarihler</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<p className="text-xs text-gray-500">Gönderim</p>
										<p className="text-sm font-medium">
											{new Date(paperWithAuthor.submitted_at || paperWithAuthor.created_at).toLocaleDateString('tr-TR')}
										</p>
									</div>
									{paperWithAuthor.updated_at && (
										<div>
											<p className="text-xs text-gray-500">Son Güncelleme</p>
											<p className="text-sm font-medium">
												{new Date(paperWithAuthor.updated_at).toLocaleDateString('tr-TR')}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Decision */}
						{decision && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Editör Kararı</CardTitle>
								</CardHeader>
								<CardContent>
									<Badge
										variant={
											decision.decision_type === 'accept'
												? 'success'
												: decision.decision_type === 'reject'
												? 'destructive'
												: 'default'
										}
										className="mb-2"
									>
										{decision.decision_type === 'accept'
											? 'Kabul'
											: decision.decision_type === 'reject'
											? 'Red'
											: 'Revizyon'}
									</Badge>
									<p className="text-sm text-gray-600">{decision.decision_reason}</p>
									{decision.finalized_at && (
										<p className="text-xs text-gray-500 mt-2">
											{new Date(decision.finalized_at).toLocaleDateString('tr-TR')}
										</p>
									)}
								</CardContent>
							</Card>
						)}

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Hızlı İşlemler</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{canAssignReviewer && finalAssignments && finalAssignments.length === 0 && (
									<Link href={`/editor/articles/${paperId}/assign`} className="block">
										<Button className="w-full" variant="outline">
											<Users className="h-4 w-4 mr-2" />
											Hakem Ata
										</Button>
									</Link>
								)}
								{canAssignReviewer && paperWithAuthor.status === 'under_review' && finalAssignments && finalAssignments.length > 0 && (
									<Link href={`/editor/articles/${paperId}/assign`} className="block">
										<Button className="w-full" variant="outline">
											<Users className="h-4 w-4 mr-2" />
											Ek Hakem Ata
										</Button>
									</Link>
								)}
								{reviews && reviews.filter((r: any) => r.status === 'submitted').length > 0 && canMakeDecision && (
									<Link href={`/editor/articles/${paperId}/decision`} className="block">
										<Button className="w-full">
											{decision ? 'Yeni Karar Ver' : 'Karar Ver'}
										</Button>
									</Link>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
