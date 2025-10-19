'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Search, ArrowUpDown } from 'lucide-react'
import { ReviewerPerformance } from '../types/editor.types'
import { toast } from '@/lib/toast'

type SortField = 'name' | 'totalAssignments' | 'completionRate' | 'averageCompletionTime' | 'overdueAssignments'
type SortDirection = 'asc' | 'desc'

export default function ReviewerPerformanceTable() {
	const [loading, setLoading] = useState(true)
	const [reviewers, setReviewers] = useState<ReviewerPerformance[]>([])
	const [filteredReviewers, setFilteredReviewers] = useState<ReviewerPerformance[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [sortField, setSortField] = useState<SortField>('completionRate')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

	useEffect(() => {
		fetchPerformanceData()
	}, [])

	useEffect(() => {
		// Filter reviewers based on search query
		let filtered = reviewers.filter(
			(r) =>
				r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.affiliation?.toLowerCase().includes(searchQuery.toLowerCase())
		)

		// Sort reviewers
		filtered = filtered.sort((a, b) => {
			let aValue: any = a[sortField]
			let bValue: any = b[sortField]

			// Handle null values for averageCompletionTime
			if (sortField === 'averageCompletionTime') {
				if (aValue === null) aValue = 999999
				if (bValue === null) bValue = 999999
			}

			if (typeof aValue === 'string') {
				aValue = aValue.toLowerCase()
				bValue = bValue.toLowerCase()
			}

			if (sortDirection === 'asc') {
				return aValue > bValue ? 1 : -1
			} else {
				return aValue < bValue ? 1 : -1
			}
		})

		setFilteredReviewers(filtered)
	}, [reviewers, searchQuery, sortField, sortDirection])

	const fetchPerformanceData = async () => {
		setLoading(true)
		try {
			const response = await fetch('/api/editor/reviewer-performance')
			if (!response.ok) {
				throw new Error('Failed to fetch performance data')
			}
			const { data } = await response.json()
			setReviewers(data)
		} catch (error: any) {
			toast.error('Hata', error.message || 'Hakem performans verileri alınamadı')
		} finally {
			setLoading(false)
		}
	}

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc')
		}
	}

	const getCompletionRateBadge = (rate: number) => {
		if (rate >= 90) return <Badge variant="success">{rate}%</Badge>
		if (rate >= 70) return <Badge className="bg-blue-500">{rate}%</Badge>
		if (rate >= 50) return <Badge className="bg-yellow-500">{rate}%</Badge>
		return <Badge variant="destructive">{rate}%</Badge>
	}

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '-'
		return new Date(dateStr).toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	// Calculate summary stats
	const totalReviewers = reviewers.length
	const activeReviewers = reviewers.filter((r) => r.totalAssignments > 0).length
	const avgCompletionRate =
		reviewers.length > 0 ? Math.round(reviewers.reduce((sum, r) => sum + r.completionRate, 0) / reviewers.length) : 0
	const totalPendingReviews = reviewers.reduce((sum, r) => sum + r.pendingAssignments, 0)
	const totalOverdueReviews = reviewers.reduce((sum, r) => sum + r.overdueAssignments, 0)

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Hakem Performans Raporu</CardTitle>
					<CardDescription>Yükleniyor...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-48">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Toplam Hakem</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{totalReviewers}</p>
						<p className="text-xs text-gray-500 mt-1">{activeReviewers} aktif</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Ort. Tamamlama</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-600">{avgCompletionRate}%</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Bekleyen</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-yellow-600">{totalPendingReviews}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Geciken</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-red-600">{totalOverdueReviews}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-blue-600">
							{reviewers.reduce((sum, r) => sum + r.completedAssignments, 0)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Table */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Hakem Performans Detayları</CardTitle>
							<CardDescription>Hakemlerin görev ve performans metrikleri</CardDescription>
						</div>
						<Button onClick={fetchPerformanceData} variant="outline" size="sm">
							<TrendingUp className="h-4 w-4 mr-2" />
							Yenile
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{/* Search */}
					<div className="mb-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								type="text"
								placeholder="Hakem ara (isim, email, kurum)..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					{/* Table */}
					<div className="border rounded-lg overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-50">
									<TableHead>
										<Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="font-semibold">
											Hakem
											<ArrowUpDown className="ml-2 h-3 w-3" />
										</Button>
									</TableHead>
									<TableHead className="text-center">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort('totalAssignments')}
											className="font-semibold"
										>
											Toplam Görev
											<ArrowUpDown className="ml-2 h-3 w-3" />
										</Button>
									</TableHead>
									<TableHead className="text-center">Tamamlanan</TableHead>
									<TableHead className="text-center">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort('completionRate')}
											className="font-semibold"
										>
											Tamamlama Oranı
											<ArrowUpDown className="ml-2 h-3 w-3" />
										</Button>
									</TableHead>
									<TableHead className="text-center">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort('averageCompletionTime')}
											className="font-semibold"
										>
											Ort. Süre
											<ArrowUpDown className="ml-2 h-3 w-3" />
										</Button>
									</TableHead>
									<TableHead className="text-center">Bekleyen</TableHead>
									<TableHead className="text-center">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleSort('overdueAssignments')}
											className="font-semibold"
										>
											Geciken
											<ArrowUpDown className="ml-2 h-3 w-3" />
										</Button>
									</TableHead>
									<TableHead className="text-center">İlk Görev</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredReviewers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-8 text-gray-500">
											{searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz hakem bulunmamaktadır'}
										</TableCell>
									</TableRow>
								) : (
									filteredReviewers.map((reviewer) => (
										<TableRow key={reviewer.id} className="hover:bg-gray-50">
											<TableCell>
												<div>
													<p className="font-medium">{reviewer.name}</p>
													<p className="text-xs text-gray-500">{reviewer.email}</p>
													{reviewer.affiliation && (
														<p className="text-xs text-gray-400 mt-1">{reviewer.affiliation}</p>
													)}
												</div>
											</TableCell>
											<TableCell className="text-center">
												<span className="font-semibold text-lg">{reviewer.totalAssignments}</span>
											</TableCell>
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-1">
													<CheckCircle2 className="h-4 w-4 text-green-600" />
													<span>{reviewer.completedAssignments}</span>
												</div>
											</TableCell>
											<TableCell className="text-center">{getCompletionRateBadge(reviewer.completionRate)}</TableCell>
											<TableCell className="text-center">
												{reviewer.averageCompletionTime !== null ? (
													<div className="flex items-center justify-center gap-1">
														<Clock className="h-4 w-4 text-gray-500" />
														<span>{reviewer.averageCompletionTime} gün</span>
													</div>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="text-center">
												{reviewer.pendingAssignments > 0 ? (
													<Badge className="bg-yellow-500">{reviewer.pendingAssignments}</Badge>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="text-center">
												{reviewer.overdueAssignments > 0 ? (
													<div className="flex items-center justify-center gap-1">
														<AlertCircle className="h-4 w-4 text-red-600" />
														<Badge variant="destructive">{reviewer.overdueAssignments}</Badge>
													</div>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="text-center text-sm text-gray-600">
												{formatDate(reviewer.firstAssignmentDate)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Footer */}
					<div className="mt-4 text-sm text-gray-500 text-center">
						Toplam {filteredReviewers.length} hakem gösteriliyor
						{searchQuery && ` (${reviewers.length} hakemden filtrelendi)`}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
