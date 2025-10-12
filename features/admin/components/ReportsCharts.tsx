'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp } from 'lucide-react'

interface Article {
	status: string
	created_at: string
}

interface User {
	role: string
	created_at: string
}

interface Review {
	status: string
	created_at: string
}

interface ReportsChartsProps {
	articles: Article[]
	users: User[]
	reviews: Review[]
}

export default function ReportsCharts({ articles, users, reviews }: ReportsChartsProps) {
	// Durum bazlı makale sayıları
	const articlesByStatus = articles.reduce((acc: any, article) => {
		acc[article.status] = (acc[article.status] || 0) + 1
		return acc
	}, {})

	// Rol bazlı kullanıcı sayıları
	const usersByRole = users.reduce((acc: any, user) => {
		acc[user.role] = (acc[user.role] || 0) + 1
		return acc
	}, {})

	const getStatusLabel = (status: string) => {
		const labels: Record<string, string> = {
			submitted: 'Gönderildi',
			under_review: 'İncelemede',
			revision_requested: 'Revizyon İstendi',
			accepted: 'Kabul Edildi',
			rejected: 'Reddedildi',
			published: 'Yayınlandı'
		}
		return labels[status] || status
	}

	const getRoleLabel = (role: string) => {
		const labels: Record<string, string> = {
			admin: 'Admin',
			editor: 'Editör',
			reviewer: 'Hakem',
			author: 'Yazar'
		}
		return labels[role] || role
	}

	return (
		<div className="space-y-6">
			{/* Articles by Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Makale Durumları
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Object.entries(articlesByStatus).map(([status, count]) => {
							const total = articles.length
							const percentage = total > 0 ? ((count as number) / total) * 100 : 0
							return (
								<div key={status} className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>{getStatusLabel(status)}</span>
										<span className="font-medium">
											{count as number} ({percentage.toFixed(1)}%)
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-blue-600 h-2 rounded-full transition-all"
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Users by Role */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Kullanıcı Rolleri
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Object.entries(usersByRole).map(([role, count]) => {
							const total = users.length
							const percentage = total > 0 ? ((count as number) / total) * 100 : 0
							return (
								<div key={role} className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>{getRoleLabel(role)}</span>
										<span className="font-medium">
											{count as number} ({percentage.toFixed(1)}%)
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-green-600 h-2 rounded-full transition-all"
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Review Statistics */}
			<Card>
				<CardHeader>
					<CardTitle>Değerlendirme İstatistikleri</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold">{reviews.length}</p>
							<p className="text-sm text-gray-600 mt-1">Toplam Değerlendirme</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold">
								{reviews.filter(r => r.status === 'submitted').length}
							</p>
							<p className="text-sm text-gray-600 mt-1">Tamamlanan Değerlendirme</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
