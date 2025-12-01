import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle, BarChart } from 'lucide-react'
import { Paper, EditorStats } from '../types/editor.types'

interface EditorStatisticsProps {
	papers: Paper[]
	stats?: EditorStats
}

export default function EditorStatistics({ papers, stats }: EditorStatisticsProps) {
	// Calculate statistics from papers if not provided
	const calculateStats = (): EditorStats => {
		if (stats) return stats

		const totalPapers = papers.length
		// Include both 'submitted' and 'resubmitted' as pending review
		const pendingReview = papers.filter(p => p.status === 'submitted' || p.status === 'resubmitted').length
		const underReview = papers.filter(p => p.status === 'under_review').length
		const revisionRequested = papers.filter(p => p.status === 'revision_requested').length
		const reviewed = papers.filter(p =>
			p.reviews?.some(r => r.status === 'submitted')
		).length
		const accepted = papers.filter(p => p.status === 'accepted').length
		const rejected = papers.filter(p => p.status === 'rejected').length
		const published = papers.filter(p => p.status === 'published').length

		// Get unique reviewers (all reviewers who have assignments)
		const activeReviewers = new Set(
			papers.flatMap(p =>
				p.assignments?.map(a => a.reviewer_id) || []
			)
		).size

		// Calculate average review time (in days)
		const reviewTimes = papers
			.flatMap(p => p.reviews || [])
			.filter(r => r.status === 'submitted')
			.map(r => {
				const reviewDate = r.submitted_at || r.updated_at
				if (!reviewDate || !r.created_at) return 0
				const created = new Date(r.created_at)
				const completed = new Date(reviewDate)
				return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
			})
			.filter(time => time > 0)

		const averageReviewTime = reviewTimes.length > 0
			? Math.round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length)
			: 0

		return {
			totalPapers,
			pendingReview,
			underReview,
			revisionRequested,
			reviewed,
			accepted,
			rejected,
			published,
			averageReviewTime,
			activeReviewers
		}
	}

	const currentStats = calculateStats()

	// Calculate percentages
	const acceptanceRate = currentStats.totalPapers > 0
		? Math.round((currentStats.accepted / currentStats.totalPapers) * 100)
		: 0

	// Calculate review completion rate based on assignments
	const totalAssignments = papers.flatMap(p => p.assignments || []).length
	const completedAssignments = papers.flatMap(p => p.assignments || []).filter(a => a.status === 'completed').length
	const reviewCompletionRate = totalAssignments > 0
		? Math.round((completedAssignments / totalAssignments) * 100)
		: 0

	// Get recent activity
	const recentPapers = [...papers]
		.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
		.slice(0, 5)

	return (
		<div className="space-y-6">
			{/* Overview Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<FileText className="h-4 w-4 text-blue-600" />
							Toplam Makale
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{currentStats.totalPapers}</p>
						<p className="text-xs text-gray-500 mt-1">Sistemdeki tüm makaleler</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Clock className="h-4 w-4 text-yellow-600" />
							Bekleyen
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-yellow-600">{currentStats.pendingReview}</p>
						<p className="text-xs text-gray-500 mt-1">Hakem ataması bekliyor</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Users className="h-4 w-4 text-purple-600" />
							İnceleniyor
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-purple-600">{currentStats.underReview}</p>
						<p className="text-xs text-gray-500 mt-1">Hakem değerlendirmesinde</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<CheckCircle className="h-4 w-4 text-green-600" />
							Kabul Oranı
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-600">%{acceptanceRate}</p>
						<p className="text-xs text-gray-500 mt-1">
							{currentStats.accepted} kabul / {currentStats.rejected} red
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Stats */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Status Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart className="h-5 w-5 text-blue-600" />
							Durum Dağılımı
						</CardTitle>
						<CardDescription>
							Makalelerin mevcut durumları
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">Bekleyen (Yeni/Revize)</span>
									<Badge variant="secondary">{currentStats.pendingReview}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-blue-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.pendingReview / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">İnceleniyor</span>
									<Badge variant="default">{currentStats.underReview}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-purple-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.underReview / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">Revizyon İstendi</span>
									<Badge className="bg-orange-500">{currentStats.revisionRequested}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-orange-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.revisionRequested / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">Kabul Edildi</span>
									<Badge variant="success">{currentStats.accepted}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-green-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.accepted / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">Reddedildi</span>
									<Badge variant="destructive">{currentStats.rejected}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-red-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.rejected / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-sm font-medium">Yayınlandı</span>
									<Badge variant="outline">{currentStats.published}</Badge>
								</div>
								<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-blue-500"
										style={{
											width: `${currentStats.totalPapers > 0
												? (currentStats.published / currentStats.totalPapers) * 100
												: 0}%`
										}}
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Performance Metrics */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-green-600" />
							Performans Metrikleri
						</CardTitle>
						<CardDescription>
							Sistem performans göstergeleri
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between items-center pb-3 border-b">
								<div>
									<p className="text-sm font-medium">Aktif Hakemler</p>
									<p className="text-xs text-gray-500">Değerlendirme yapan</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold">{currentStats.activeReviewers}</p>
									<p className="text-xs text-gray-500">hakem</p>
								</div>
							</div>

							<div className="flex justify-between items-center pb-3 border-b">
								<div>
									<p className="text-sm font-medium">İnceleme Tamamlanma</p>
									<p className="text-xs text-gray-500">Atanan incelemeler</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold">%{reviewCompletionRate}</p>
									<p className="text-xs text-gray-500">tamamlandı</p>
								</div>
							</div>

							<div className="flex justify-between items-center">
								<div>
									<p className="text-sm font-medium">Değerlendirilen</p>
									<p className="text-xs text-gray-500">Toplam makale</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold">{currentStats.reviewed}</p>
									<p className="text-xs text-gray-500">makale</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-orange-600" />
						Son Gönderimler
					</CardTitle>
					<CardDescription>
						En son gönderilen makaleler
					</CardDescription>
				</CardHeader>
				<CardContent>
					{recentPapers.length > 0 ? (
						<div className="space-y-3">
							{recentPapers.map((paper) => (
								<div key={paper.id} className="flex items-center justify-between py-2 border-b last:border-0">
									<div className="flex-1">
										<p className="font-medium text-sm line-clamp-1">{paper.title}</p>
										<div className="flex items-center gap-3 mt-1">
											<span className="text-xs text-gray-500">
												{paper.author?.name || 'Yazar bilinmiyor'}
											</span>
											<span className="text-xs text-gray-500">
												{new Date(paper.submitted_at).toLocaleDateString('tr-TR')}
											</span>
										</div>
									</div>
									<Badge variant={
										paper.status === 'submitted' ? 'secondary' :
										paper.status === 'under_review' ? 'default' :
										paper.status === 'revision_requested' ? 'outline' :
										paper.status === 'accepted' ? 'success' :
										paper.status === 'rejected' ? 'destructive' :
										'outline'
									}
									className={paper.status === 'revision_requested' ? 'bg-orange-500 text-white' : ''}
									>
										{paper.status === 'submitted' ? 'Bekliyor' :
										 paper.status === 'under_review' ? 'İnceleniyor' :
										 paper.status === 'revision_requested' ? 'Revizyon' :
										 paper.status === 'accepted' ? 'Kabul' :
										 paper.status === 'rejected' ? 'Red' :
										 'Yayınlandı'}
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className="text-gray-500 text-center py-4">
							Henüz makale gönderimi bulunmamaktadır.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}