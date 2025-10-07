import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import { PaperWithAssignment, Review } from '../types/review.types'

interface ReviewStatisticsProps {
	papers: PaperWithAssignment[]
	reviews: Review[]
}

export default function ReviewStatistics({ papers, reviews }: ReviewStatisticsProps) {
	// Calculate statistics
	const stats = {
		total: papers.length,
		pending: papers.filter((p) => !reviews.find((r) => r.article_id === p.id)).length,
		inProgress: reviews.filter((r) => r.status === 'draft').length,
		completed: reviews.filter((r) => r.status === 'submitted').length,
		overdue: papers.filter((p) => {
			if (!p.deadline) return false
			const review = reviews.find((r) => r.article_id === p.id)
			if (review?.status === 'submitted') return false
			return new Date(p.deadline) < new Date()
		}).length
	}

	const avgScore =
		reviews.filter((r) => r.status === 'submitted' && r.overall_score).reduce((sum, r) => sum + r.overall_score, 0) /
		(stats.completed || 1)

	const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<FileText className="h-4 w-4 text-blue-600" />
						Toplam Atama
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">{stats.total}</p>
					<p className="text-xs text-gray-500 mt-1">Makale sayısı</p>
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
					<p className="text-2xl font-bold">{stats.pending + stats.inProgress}</p>
					<p className="text-xs text-gray-500 mt-1">
						{stats.pending} yeni, {stats.inProgress} devam eden
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<CheckCircle className="h-4 w-4 text-green-600" />
						Tamamlanan
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">{stats.completed}</p>
					<p className="text-xs text-gray-500 mt-1">%{completionRate} tamamlanma</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-600" />
						Geciken
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
					<p className="text-xs text-gray-500 mt-1">
						{stats.overdue > 0 ? 'Acil değerlendirme gerekli' : 'Geciken yok'}
					</p>
				</CardContent>
			</Card>

			{/* Additional Stats */}
			<Card className="md:col-span-2">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">Değerlendirme Özeti</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Ortalama Puan</span>
							<span className="font-semibold">{avgScore.toFixed(1)} / 5</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Tamamlanma Oranı</span>
							<span className="font-semibold">%{completionRate}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="md:col-span-2">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">Öneri Dağılımı</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{stats.completed > 0 ? (
							<>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Kabul</span>
									<span className="font-semibold">{reviews.filter((r) => r.recommendation === 'accept').length}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Revizyon</span>
									<span className="font-semibold">
										{
											reviews.filter(
												(r) => r.recommendation === 'minor_revision' || r.recommendation === 'major_revision'
											).length
										}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600">Red</span>
									<span className="font-semibold">{reviews.filter((r) => r.recommendation === 'reject').length}</span>
								</div>
							</>
						) : (
							<p className="text-sm text-gray-500">Henüz değerlendirme yok</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
