import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, User, Calendar, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Paper } from '../types/editor.types'
import { PDFCombinedActionsSimple as PDFCombinedActions } from '@/components/common/pdf-actions-simple'

interface PapersListProps {
	papers: Paper[]
	title?: string
	description?: string
}

export default function PapersList({ papers, title = 'Makaleler', description }: PapersListProps) {
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

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			submitted: { label: 'Gönderildi', variant: 'secondary' as const },
			under_review: { label: 'İnceleniyor', variant: 'default' as const },
			revision_requested: { label: 'Revizyon İstendi', variant: 'default' as const },
			accepted: { label: 'Kabul Edildi', variant: 'success' as const },
			rejected: { label: 'Reddedildi', variant: 'destructive' as const },
			published: { label: 'Yayınlandı', variant: 'outline' as const }
		}
		return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
	}

	const getReviewProgress = (paper: Paper) => {
		if (!paper.assignments || paper.assignments.length === 0) {
			return { label: 'Hakem Atanmamış', color: 'text-red-500', icon: '⚠️' }
		}

		const completed = paper.assignments.filter((a) => a.status === 'completed').length
		const total = paper.assignments.length
		const pending = paper.assignments.filter((a) => a.status === 'pending').length
		const inProgress = paper.assignments.filter((a) => a.status === 'in_progress').length

		if (completed === total) {
			return { label: `✓ ${completed}/${total} Tamamlandı`, color: 'text-green-600', icon: '✓' }
		} else if (completed > 0) {
			return { label: `${completed}/${total} Tamamlandı`, color: 'text-yellow-600', icon: '⏳' }
		} else if (inProgress > 0) {
			return { label: `${total} Hakem Atandı (Devam Ediyor)`, color: 'text-blue-600', icon: '🔄' }
		} else {
			return { label: `${total} Hakem Atandı (Değerlendirme Bekleniyor)`, color: 'text-gray-600', icon: '⏰' }
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				{papers.length === 0 ? (
					<div className="text-center py-8 text-gray-500">Henüz makale bulunmamaktadır.</div>
				) : (
					<div className="space-y-4">
						{/* Mobile View */}
						<div className="lg:hidden space-y-4">
							{papers.map((paper) => {
								const status = getStatusBadge(paper.status)
								const progress = getReviewProgress(paper)

								return (
									<Card key={paper.id || `paper-${papers.indexOf(paper)}`}>
										<CardContent className="p-4">
											<div className="space-y-3">
												<div>
													<h3 className="font-semibold line-clamp-2">{paper.title}</h3>
													{paper.author && (
														<p className="text-sm text-gray-500 mt-1">
															<User className="inline h-3 w-3 mr-1" />
															{paper.author.name}
														</p>
													)}
												</div>

												<div className="flex flex-wrap gap-2">
													<Badge variant={status.variant}>{status.label}</Badge>
													<span className={`text-sm ${progress.color}`}>{progress.label}</span>
												</div>

												<div className="flex flex-wrap gap-2">
													{paper.file_url && (
														<PDFCombinedActions
															fileUrl={paper.file_url}
															fileName={getFileNameFromUrl(paper.file_url)}
															size="sm"
														/>
													)}
													{paper.id ? (
														<Link href={`/editor/articles/${paper.id}`}>
															<Button size="sm" variant="outline">
																Detaylar
															</Button>
														</Link>
													) : (
														<Button size="sm" variant="outline" disabled>
															Detaylar (ID yok)
														</Button>
													)}
													{paper.status === 'submitted' && paper.id && (
														<Link href={`/editor/articles/${paper.id}/assign`}>
															<Button size="sm">
																<Users className="h-4 w-4 mr-1" />
																Hakem Ata
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
						<div className="hidden lg:block overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Başlık</TableHead>
										<TableHead>Yazar</TableHead>
										<TableHead>Tarih</TableHead>
										<TableHead>Durum</TableHead>
										<TableHead>Hakem Ataması</TableHead>
										<TableHead className="text-right">İşlemler</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{papers.map((paper) => {
										const status = getStatusBadge(paper.status)
										const progress = getReviewProgress(paper)

										return (
											<TableRow key={paper.id}>
												<TableCell>
													<div className="max-w-md">
														<p className="font-medium line-clamp-1">{paper.title}</p>
														<p className="text-sm text-gray-500 line-clamp-1 mt-1">{paper.abstract}</p>
													</div>
												</TableCell>
												<TableCell>
													{paper.author ? (
														<div>
															<p className="text-sm font-medium">{paper.author.name}</p>
															{paper.author.affiliation && (
																<p className="text-xs text-gray-500">{paper.author.affiliation}</p>
															)}
														</div>
													) : (
														<span className="text-gray-400">-</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-sm">
														<Calendar className="h-4 w-4" />
														{new Date(paper.submitted_at || paper.created_at).toLocaleDateString('tr-TR')}
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={status.variant}>{status.label}</Badge>
												</TableCell>
												<TableCell>
													<span className={`text-sm ${progress.color}`}>{progress.label}</span>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														{paper.file_url && (
															<PDFCombinedActions
																fileUrl={paper.file_url}
																fileName={getFileNameFromUrl(paper.file_url)}
																size="sm"
															/>
														)}
														{paper.id ? (
															<Link href={`/editor/articles/${paper.id}`}>
																<Button size="sm" variant="outline">
																	Detay
																</Button>
															</Link>
														) : (
															<Button size="sm" variant="outline" disabled>
																Detay (ID yok)
															</Button>
														)}
														{paper.status === 'submitted' && paper.id && (
															<Link href={`/editor/articles/${paper.id}/assign`}>
																<Button size="sm">Hakem Ata</Button>
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
