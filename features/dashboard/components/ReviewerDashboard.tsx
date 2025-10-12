'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, FileText, BarChart3, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Article } from '@/features/articles/types/article.types'
import AssignedPapersList from '@/features/reviewer/components/AssignedPapersList'
import ReviewStatistics from '@/features/reviewer/components/ReviewStatistics'
import ProfileUpdateForm from '@/features/auth/components/ProfileUpdateForm'
import { Review } from '@/features/reviewer/types/review.types'

interface UserData {
	id: string
	email: string
	name: string
	role: string
	expertise_areas?: string[]
	affiliation?: string
}

interface ReviewerDashboardProps {
	user: User
	userData: UserData
	assignedPapers: any[]
	reviews: Review[]
}

export default function ReviewerDashboard({ user, userData, assignedPapers, reviews }: ReviewerDashboardProps) {
	const [activeTab, setActiveTab] = useState('overview')

	// İstatistikleri hesapla
	const stats = {
		pending:
			assignedPapers?.filter(
				(p) => !reviews?.find((r) => r.article_id === (p.article_id || p.id) && r.status === 'submitted')
			).length || 0,
		inProgress: reviews?.filter((r) => r.status === 'draft').length || 0,
		completed: reviews?.filter((r) => r.status === 'submitted').length || 0,
		total: assignedPapers?.length || 0,
		overdue:
			assignedPapers?.filter((p) => {
				if (!p.deadline) return false
				const review = reviews?.find((r) => r.article_id === (p.article_id || p.id))
				if (review?.status === 'submitted') return false
				return new Date(p.deadline) < new Date()
			}).length || 0
	}

	const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

	return (
		<>
			<h1 className="text-3xl font-bold text-gray-900 mb-6">Hakem Paneli</h1>

			{/* User Info */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Hoş geldiniz, {userData?.name}!</CardTitle>
					<CardDescription>
						{userData?.expertise_areas && userData.expertise_areas.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								<span className="text-sm text-gray-600">Uzmanlık Alanları:</span>
								{userData.expertise_areas.map((area: string, index: number) => (
									<Badge key={index} variant="secondary">
										{area}
									</Badge>
								))}
							</div>
						)}
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Toplam</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{stats.total}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Bekleyen</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Devam Eden</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-600">{stats.completed}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Geciken</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Tamamlanma</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">%{completionRate}</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs for different views */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid w-full max-w-2xl grid-cols-4">
					<TabsTrigger value="overview">Genel Bakış</TabsTrigger>
					<TabsTrigger value="assignments">Atamalar</TabsTrigger>
					<TabsTrigger value="statistics">İstatistikler</TabsTrigger>
					<TabsTrigger value="profile">Profilim</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					{/* Priority Papers */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-orange-600" />
								Öncelikli Değerlendirmeler
							</CardTitle>
							<CardDescription>Yaklaşan son tarihi olan veya gecikmiş değerlendirmeler</CardDescription>
						</CardHeader>
						<CardContent>
							{assignedPapers &&
							assignedPapers.filter((p) => {
								const paperId = p.article_id || p.id
								const review = reviews?.find((r) => r.article_id === paperId)
								if (review?.status === 'submitted') return false
								if (!p.deadline) return false
								const daysRemaining = Math.ceil(
									(new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
								)
								return daysRemaining <= 3
							}).length > 0 ? (
								<div className="space-y-3">
									{assignedPapers
										.filter((p) => {
											const paperId = p.article_id || p.id
											const review = reviews?.find((r) => r.article_id === paperId)
											if (review?.status === 'submitted') return false
											if (!p.deadline) return false
											const daysRemaining = Math.ceil(
												(new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
											)
											return daysRemaining <= 3
										})
										.map((paper) => {
											const paperId = paper.article_id || paper.id
											const daysRemaining = Math.ceil(
												(new Date(paper.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
											)
											const review = reviews?.find((r) => r.article_id === paperId)

											return (
												<div
													key={paperId}
													className="flex items-center justify-between p-3 border rounded-lg bg-orange-50"
												>
													<div className="flex-1">
														<p className="font-medium line-clamp-1">{paper.title}</p>
														<p className="text-sm text-gray-600">
															{daysRemaining < 0
																? `${Math.abs(daysRemaining)} gün gecikmiş`
																: `${daysRemaining} gün kaldı`}
														</p>
													</div>
													<Link href={`/reviews/${paperId}`}>
														<Button size="sm" variant={daysRemaining < 0 ? 'destructive' : 'default'}>
															{review?.status === 'draft' ? 'Devam Et' : 'Değerlendir'}
														</Button>
													</Link>
												</div>
											)
										})}
								</div>
							) : (
								<p className="text-gray-500 text-center py-4">Acil değerlendirme gerektiren makale bulunmamaktadır.</p>
							)}
						</CardContent>
					</Card>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5 text-blue-600" />
								Son Aktiviteler
							</CardTitle>
						</CardHeader>
						<CardContent>
							{reviews && reviews.length > 0 ? (
								<div className="space-y-3">
									{reviews.slice(0, 5).map((review) => {
										const paper = assignedPapers?.find((p) => (p.article_id || p.id) === review.article_id)
										return (
											<div key={review.id} className="flex items-center justify-between py-2 border-b last:border-0">
												<div>
													<p className="font-medium text-sm line-clamp-1">{paper?.title || 'Makale'}</p>
													<p className="text-xs text-gray-500">
														{review.status === 'submitted' ? 'Tamamlandı' : 'Taslak'} -
														{new Date(review.updated_at).toLocaleDateString('tr-TR')}
													</p>
												</div>
												<Badge variant={review.status === 'submitted' ? 'success' : 'secondary'}>
													{review.status === 'submitted' ? 'Tamamlandı' : 'Taslak'}
												</Badge>
											</div>
										)
									})}
								</div>
							) : (
								<p className="text-gray-500 text-center py-4">Henüz aktivite bulunmamaktadır.</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="assignments">
					<AssignedPapersList papers={assignedPapers || []} reviews={reviews || []} />
				</TabsContent>

				<TabsContent value="statistics">
					<ReviewStatistics papers={assignedPapers || []} reviews={reviews || []} />
				</TabsContent>

				<TabsContent value="profile">
					<ProfileUpdateForm userData={userData} />
				</TabsContent>
			</Tabs>
		</>
	)
}
