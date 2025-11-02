import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DecisionSection from '@/features/editor/components/DecisionSection'

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export default async function EditorDecisionPage({ params }: PageProps) {
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
		console.error('Paper not found for decision:', paperId, paperError)
		notFound()
	}

	// Editörler sadece kendilerine atanan makalelere karar verebilir (adminler hepsine verebilir)
	if (userData?.role === 'editor' && paper.assigned_editor_id !== user.id) {
		console.error('Editor not authorized to make decision for this paper:', user.id, paper.assigned_editor_id)
		redirect('/dashboard')
	}

	// Get author info separately if paper exists
	let author = null
	if (paper.author_id) {
		const { data: authorData } = await supabase
			.from('users')
			.select('name, email, affiliation')
			.eq('id', paper.author_id)
			.single()

		author = authorData
	}

	// Use paperWithAuthor for the rest
	const paperWithAuthor = {
		...paper,
		author
	}

	// Get reviews with reviewer info
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
		.eq('status', 'submitted')

	// Get existing decision if any
	const { data: existingDecision } = await supabase.from('decisions').select('*').eq('article_id', paperId).single()

	// Calculate review summary
	const reviewSummary = {
		totalReviews: reviews?.length || 0,
		averageScore: reviews?.length ? reviews.reduce((sum, r) => sum + (r.overall_score || 0), 0) / reviews.length : 0,
		recommendations: {
			accept: reviews?.filter((r) => r.recommendation === 'accept').length || 0,
			minorRevision: reviews?.filter((r) => r.recommendation === 'minor_revision').length || 0,
			majorRevision: reviews?.filter((r) => r.recommendation === 'major_revision').length || 0,
			reject: reviews?.filter((r) => r.recommendation === 'reject').length || 0
		}
	}

	// Determine suggested decision based on reviews
	const getSuggestedDecision = () => {
		if (reviewSummary.totalReviews === 0) return null

		const { accept, minorRevision, majorRevision, reject } = reviewSummary.recommendations

		if (accept > reviewSummary.totalReviews / 2) return 'accept'
		if (reject > reviewSummary.totalReviews / 2) return 'reject'
		if (minorRevision + majorRevision > accept && minorRevision + majorRevision > reject) return 'revision'

		return reviewSummary.averageScore >= 3.5 ? 'accept' : reviewSummary.averageScore >= 2.5 ? 'revision' : 'reject'
	}

	const suggestedDecision = getSuggestedDecision()

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
					<h1 className="text-2xl font-bold text-gray-900">Editör Kararı</h1>
					<p className="text-gray-600 mt-2">Hakem değerlendirmelerini inceleyerek nihai kararı verin</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Paper Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Makale Bilgisi
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<h3 className="font-semibold">{paperWithAuthor.title}</h3>
									{paperWithAuthor.author && (
										<p className="text-sm text-gray-600 mt-1">
											Yazar: {paperWithAuthor.author.name} ({paperWithAuthor.author.email})
										</p>
									)}
								</div>
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-1">Özet</h4>
									<p className="text-sm text-gray-600 line-clamp-4">{paperWithAuthor.abstract}</p>
								</div>
								{paperWithAuthor.file_url && (
									<Button size="sm" variant="outline" asChild>
										<a href={paperWithAuthor.file_url} target="_blank" rel="noopener noreferrer">
											<FileText className="h-4 w-4 mr-2" />
											PDF Görüntüle
										</a>
									</Button>
								)}
							</CardContent>
						</Card>

						{/* Reviews Summary */}
						<Card>
							<CardHeader>
								<CardTitle>Hakem Değerlendirmeleri</CardTitle>
								<CardDescription>{reviewSummary.totalReviews} hakem değerlendirmesi tamamlandı</CardDescription>
							</CardHeader>
							<CardContent>
								{reviews && reviews.length > 0 ? (
									<div className="space-y-4">
										{reviews.map((review: any, index: number) => (
											<div key={review.id} className="border rounded-lg p-4">
												<div className="flex items-start justify-between mb-3">
													<div>
														<p className="font-medium">
															Hakem {index + 1}: {review.users.name}
														</p>
														<p className="text-sm text-gray-500">{review.users.email}</p>
													</div>
													<div className="text-right">
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium">Puan:</span>
															<Badge variant="outline">{review.overall_score}/5</Badge>
														</div>
													</div>
												</div>

												<div className="space-y-2">
													<div className="flex items-center gap-2">
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
														<p className="text-sm font-medium mb-1">Yorumlar:</p>
														<p className="text-sm text-gray-600">{review.comments}</p>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8">
										<AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
										<p className="text-gray-500">Henüz tamamlanmış değerlendirme bulunmamaktadır</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Decision Section - handles both new and existing decisions */}
						<DecisionSection
							paperId={paperId}
							paperTitle={paperWithAuthor.title}
							suggestedDecision={suggestedDecision}
							reviews={reviews || []}
							existingDecision={existingDecision}
							paperStatus={paperWithAuthor.status}
						/>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Review Statistics */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Değerlendirme Özeti</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<p className="text-sm text-gray-600">Toplam Değerlendirme</p>
									<p className="text-2xl font-bold">{reviewSummary.totalReviews}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Ortalama Puan</p>
									<p className="text-2xl font-bold">{reviewSummary.averageScore.toFixed(1)}/5</p>
								</div>
								<div className="border-t pt-3">
									<p className="text-sm font-medium mb-2">Hakem Önerileri</p>
									<div className="space-y-1">
										<div className="flex justify-between items-center">
											<span className="text-sm">Kabul</span>
											<Badge variant="success">{reviewSummary.recommendations.accept}</Badge>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm">Küçük Revizyon</span>
											<Badge>{reviewSummary.recommendations.minorRevision}</Badge>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm">Büyük Revizyon</span>
											<Badge>{reviewSummary.recommendations.majorRevision}</Badge>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm">Red</span>
											<Badge variant="destructive">{reviewSummary.recommendations.reject}</Badge>
										</div>
									</div>
								</div>
								{suggestedDecision && (
									<div className="border-t pt-3">
										<p className="text-sm font-medium mb-2">Önerilen Karar</p>
										<Badge
											variant={
												suggestedDecision === 'accept'
													? 'success'
													: suggestedDecision === 'reject'
													? 'destructive'
													: 'default'
											}
											className="w-full justify-center py-2"
										>
											{suggestedDecision === 'accept' ? 'Kabul' : suggestedDecision === 'reject' ? 'Red' : 'Revizyon'}
										</Badge>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Guidelines */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Karar Verme Kriterleri</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 text-sm text-gray-600">
									<div>
										<p className="font-medium text-gray-700">Kabul:</p>
										<ul className="list-disc list-inside ml-2">
											<li>Yüksek özgünlük</li>
											<li>Güçlü metodoloji</li>
											<li>Net sonuçlar</li>
										</ul>
									</div>
									<div>
										<p className="font-medium text-gray-700">Revizyon:</p>
										<ul className="list-disc list-inside ml-2">
											<li>İyileştirme potansiyeli</li>
											<li>Küçük eksiklikler</li>
											<li>Ek veri gereksinimi</li>
										</ul>
									</div>
									<div>
										<p className="font-medium text-gray-700">Red:</p>
										<ul className="list-disc list-inside ml-2">
											<li>Büyük metodolojik hatalar</li>
											<li>Düşük özgünlük</li>
											<li>Yetersiz kalite</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
