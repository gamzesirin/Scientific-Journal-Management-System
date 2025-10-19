'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Database, Activity } from 'lucide-react'
import type { HistoryStats } from '@/features/history/types/history.types'

export default function HistoryStats() {
	const [stats, setStats] = useState<HistoryStats | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchStats()
	}, [])

	const fetchStats = async () => {
		try {
			const response = await fetch('/api/history/stats')
			const { data } = await response.json()
			setStats(data)
		} catch (error) {
			console.error('Error fetching stats:', error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardContent className="pt-6">
							<div className="animate-pulse space-y-3">
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								<div className="h-8 bg-gray-200 rounded w-1/3"></div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (!stats) return null

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Toplam İşlem
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-blue-600">{stats.total_changes.toLocaleString()}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<TrendingUp className="h-4 w-4" />
							INSERT İşlemleri
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-green-600">{(stats.by_action.INSERT || 0).toLocaleString()}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<BarChart3 className="h-4 w-4" />
							UPDATE İşlemleri
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-blue-600">{(stats.by_action.UPDATE || 0).toLocaleString()}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Database className="h-4 w-4" />
							DELETE İşlemleri
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-red-600">{(stats.by_action.DELETE || 0).toLocaleString()}</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Stats */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* By Table */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							Tabloya Göre Dağılım
						</CardTitle>
						<CardDescription>Her tablodaki toplam değişiklik sayısı</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Object.entries(stats.by_table)
								.sort(([, a], [, b]) => b - a)
								.map(([table, count]) => (
									<div key={table} className="flex items-center justify-between">
										<span className="text-sm font-medium capitalize">{table}</span>
										<div className="flex items-center gap-3">
											<div className="w-32 bg-gray-200 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full"
													style={{ width: `${(count / stats.total_changes) * 100}%` }}
												></div>
											</div>
											<span className="text-sm font-bold min-w-[60px] text-right">{count.toLocaleString()}</span>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>

				{/* By User */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							En Aktif Kullanıcılar
						</CardTitle>
						<CardDescription>En çok işlem yapan ilk 10 kullanıcı</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{stats.by_user.slice(0, 10).map((user, index) => (
								<div key={user.user_id} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<span className="text-sm font-bold text-gray-400">#{index + 1}</span>
										<span className="text-sm font-medium">{user.user_name}</span>
									</div>
									<div className="flex items-center gap-3">
										<div className="w-24 bg-gray-200 rounded-full h-2">
											<div
												className="bg-green-600 h-2 rounded-full"
												style={{ width: `${(user.count / stats.by_user[0].count) * 100}%` }}
											></div>
										</div>
										<span className="text-sm font-bold min-w-[40px] text-right">{user.count}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
