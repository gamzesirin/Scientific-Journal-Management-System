import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, FileText, Eye, Edit, CheckCircle } from 'lucide-react'
import { PaperWithAssignment, Review } from '../types/review.types'

interface AssignedPapersListProps {
	papers: PaperWithAssignment[]
	reviews: Review[]
}

export default function AssignedPapersList({ papers, reviews }: AssignedPapersListProps) {
	const getReviewStatus = (paperId: string | undefined) => {
		if (!paperId) return { status: 'pending', label: 'Bekliyor', variant: 'secondary' as const }
		const review = reviews.find((r) => r.article_id === paperId)
		if (!review) return { status: 'pending', label: 'Bekliyor', variant: 'secondary' as const }
		if (review.status === 'submitted') return { status: 'submitted', label: 'Tamamlandı', variant: 'success' as const }
		return { status: 'draft', label: 'Taslak', variant: 'default' as const }
	}

	const getDaysRemaining = (deadline: string) => {
		const now = new Date()
		const deadlineDate = new Date(deadline)
		const diff = deadlineDate.getTime() - now.getTime()
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
		return days
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Atanmış Makaleler</CardTitle>
				<CardDescription>Size değerlendirme için atanmış makalelerin listesi</CardDescription>
			</CardHeader>
			<CardContent>
				{papers.length === 0 ? (
					<div className="text-center py-8 text-gray-500">Henüz size atanmış makale bulunmamaktadır.</div>
				) : (
					<div className="space-y-4">
						{/* Mobile View */}
						<div className="lg:hidden space-y-4">
							{papers.map((paper, index) => {
								const paperId = paper.article_id || paper.id
								const reviewStatus = getReviewStatus(paperId)
								const review = reviews.find((r) => r.article_id === paperId)
								const daysRemaining = paper.deadline ? getDaysRemaining(paper.deadline) : null

								return (
									<Card key={paper.assignment_id || paperId || `paper-${index}`}>
										<CardContent className="p-4">
											<div className="space-y-3">
												<div>
													<h3 className="font-semibold line-clamp-2">{paper.title}</h3>
													<p className="text-sm text-gray-500 mt-1 line-clamp-2">{paper.abstract}</p>
												</div>

												<div className="flex items-center justify-between">
													<Badge variant={reviewStatus.variant}>{reviewStatus.label}</Badge>
													{daysRemaining !== null && reviewStatus.status !== 'submitted' && (
														<span className={`text-sm ${daysRemaining < 3 ? 'text-red-600' : 'text-gray-600'}`}>
															{daysRemaining} gün kaldı
														</span>
													)}
												</div>

												<div className="flex flex-wrap gap-2">
													{paper.file_url && (
														<Button size="sm" variant="outline" asChild>
															<a href={paper.file_url} target="_blank" rel="noopener noreferrer">
																<FileText className="h-4 w-4 mr-1" />
																PDF
															</a>
														</Button>
													)}
													{reviewStatus.status === 'submitted' ? (
														<Link href={`/reviews/${paperId}`}>
															<Button size="sm" variant="outline">
																<Eye className="h-4 w-4 mr-1" />
																Görüntüle
															</Button>
														</Link>
													) : (
														<Link href={`/reviews/${paperId}`}>
															<Button size="sm">
																<Edit className="h-4 w-4 mr-1" />
																{reviewStatus.status === 'draft' ? 'Devam Et' : 'Başla'}
															</Button>
														</Link>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>

						{/* Desktop View */}
						<div className="hidden lg:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Başlık</TableHead>
										<TableHead>Atanma Tarihi</TableHead>
										<TableHead>Son Tarih</TableHead>
										<TableHead>Durum</TableHead>
										<TableHead className="text-right">İşlemler</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{papers.map((paper, index) => {
										const paperId = paper.article_id || paper.id
										const reviewStatus = getReviewStatus(paperId)
										const review = reviews.find((r) => r.article_id === paperId)
										const daysRemaining = paper.deadline ? getDaysRemaining(paper.deadline) : null

										return (
											<TableRow key={paper.assignment_id || paperId || `paper-${index}`}>
												<TableCell>
													<div className="max-w-md">
														<p className="font-medium line-clamp-1">{paper.title}</p>
														<p className="text-sm text-gray-500 line-clamp-1 mt-1">{paper.abstract}</p>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-sm">
														<Calendar className="h-4 w-4" />
														{paper.assigned_at ? new Date(paper.assigned_at).toLocaleDateString('tr-TR') : '-'}
													</div>
												</TableCell>
												<TableCell>
													{paper.deadline ? (
														<div className="flex items-center gap-1 text-sm">
															<Clock className="h-4 w-4" />
															<span className={daysRemaining! < 3 ? 'text-red-600' : ''}>
																{new Date(paper.deadline).toLocaleDateString('tr-TR')}
																{reviewStatus.status !== 'submitted' && (
																	<span className="ml-1">({daysRemaining} gün)</span>
																)}
															</span>
														</div>
													) : (
														'-'
													)}
												</TableCell>
												<TableCell>
													<Badge variant={reviewStatus.variant}>
														{reviewStatus.status === 'submitted' && <CheckCircle className="h-3 w-3 mr-1" />}
														{reviewStatus.label}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														{paper.file_url && (
															<Button size="sm" variant="outline" asChild>
																<a href={paper.file_url} target="_blank" rel="noopener noreferrer">
																	<FileText className="h-4 w-4" />
																</a>
															</Button>
														)}
														{reviewStatus.status === 'submitted' ? (
															<Link href={`/reviews/${paperId}`}>
																<Button size="sm" variant="outline">
																	<Eye className="h-4 w-4" />
																</Button>
															</Link>
														) : (
															<Link href={`/reviews/${paperId}`}>
																<Button size="sm">{reviewStatus.status === 'draft' ? 'Devam Et' : 'Başla'}</Button>
															</Link>
														)}
													</div>
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
