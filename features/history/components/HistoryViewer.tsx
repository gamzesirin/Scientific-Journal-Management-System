'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, Clock, User, Database, Filter, Download } from 'lucide-react'
import type { UnifiedHistoryEntry } from '@/features/history/types/history.types'

interface HistoryViewerProps {
	table?: 'articles' | 'reviews' | 'users' | 'assignments' | 'audit_log'
	recordId?: string
}

export default function HistoryViewer({ table = 'audit_log', recordId }: HistoryViewerProps) {
	const [history, setHistory] = useState<UnifiedHistoryEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedTable, setSelectedTable] = useState(table)
	const [actionFilter, setActionFilter] = useState<string>('all')
	const [limit, setLimit] = useState(50)

	useEffect(() => {
		fetchHistory()
	}, [selectedTable, recordId, actionFilter, limit])

	const fetchHistory = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams({
				table: selectedTable,
				limit: limit.toString()
			})

			if (recordId) params.append('record_id', recordId)
			if (actionFilter !== 'all') params.append('action', actionFilter)

			const response = await fetch(`/api/history?${params}`)
			const { data } = await response.json()

			setHistory(data || [])
		} catch (error) {
			console.error('Error fetching history:', error)
		} finally {
			setLoading(false)
		}
	}

	const getActionColor = (action: string) => {
		switch (action) {
			case 'INSERT':
				return 'bg-green-100 text-green-800'
			case 'UPDATE':
				return 'bg-blue-100 text-blue-800'
			case 'DELETE':
				return 'bg-red-100 text-red-800'
			case 'STATUS_CHANGE':
				return 'bg-purple-100 text-purple-800'
			case 'ROLE_CHANGE':
				return 'bg-orange-100 text-orange-800'
			case 'SUBMIT':
				return 'bg-indigo-100 text-indigo-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const exportToJSON = () => {
		const dataStr = JSON.stringify(history, null, 2)
		const dataBlob = new Blob([dataStr], { type: 'application/json' })
		const url = URL.createObjectURL(dataBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `history-${selectedTable}-${new Date().toISOString()}.json`
		link.click()
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<History className="h-5 w-5" />
							History & Audit Log
						</CardTitle>
						<CardDescription>Veritabanı değişikliklerini görüntüleyin ve takip edin</CardDescription>
					</div>
					<Button onClick={exportToJSON} variant="outline" size="sm">
						<Download className="h-4 w-4 mr-2" />
						Export JSON
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Filters */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Tablo</label>
						<Select value={selectedTable} onValueChange={(value: any) => setSelectedTable(value)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="articles">Makaleler</SelectItem>
								<SelectItem value="reviews">Değerlendirmeler</SelectItem>
								<SelectItem value="users">Kullanıcılar</SelectItem>
								<SelectItem value="assignments">Atamalar</SelectItem>
								<SelectItem value="audit_log">Tüm İşlemler</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Action Türü</label>
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tümü</SelectItem>
								<SelectItem value="INSERT">INSERT</SelectItem>
								<SelectItem value="UPDATE">UPDATE</SelectItem>
								<SelectItem value="DELETE">DELETE</SelectItem>
								<SelectItem value="STATUS_CHANGE">STATUS_CHANGE</SelectItem>
								<SelectItem value="ROLE_CHANGE">ROLE_CHANGE</SelectItem>
								<SelectItem value="SUBMIT">SUBMIT</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Limit</label>
						<Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="25">25</SelectItem>
								<SelectItem value="50">50</SelectItem>
								<SelectItem value="100">100</SelectItem>
								<SelectItem value="200">200</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* History Timeline */}
				<div className="space-y-4">
					{loading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="animate-pulse">
									<div className="h-24 bg-gray-200 rounded-lg"></div>
								</div>
							))}
						</div>
					) : history.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
							<p>Henüz kayıt bulunmamaktadır.</p>
						</div>
					) : (
						<div className="space-y-3">
							{history.map((entry: any) => (
								<div
									key={entry.history_id || entry.id}
									className="border-l-4 border-blue-500 pl-4 py-3 bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
												<span className="text-sm text-gray-600">
													{selectedTable !== 'audit_log' ? selectedTable : entry.table_name}
												</span>
											</div>

											<div className="space-y-2">
												{/* Changed By */}
												{entry.changed_by_user && (
													<div className="flex items-center gap-2 text-sm">
														<User className="h-4 w-4 text-gray-400" />
														<span className="font-medium">{entry.changed_by_user.name}</span>
														<span className="text-gray-500">({entry.changed_by_user.role})</span>
													</div>
												)}

												{/* User info for audit_log */}
												{selectedTable === 'audit_log' && entry.user_email && (
													<div className="flex items-center gap-2 text-sm">
														<User className="h-4 w-4 text-gray-400" />
														<span className="font-medium">{entry.user_email}</span>
														{entry.user_role && <span className="text-gray-500">({entry.user_role})</span>}
													</div>
												)}

												{/* Timestamp */}
												<div className="flex items-center gap-2 text-sm text-gray-600">
													<Clock className="h-4 w-4 text-gray-400" />
													{new Date(entry.changed_at || entry.created_at).toLocaleString('tr-TR', {
														day: 'numeric',
														month: 'long',
														year: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
														second: '2-digit'
													})}
												</div>

												{/* Changed Fields */}
												{entry.changed_fields && Object.keys(entry.changed_fields).length > 0 && (
													<div className="text-sm">
														<span className="text-gray-600">Değişen alanlar: </span>
														<span className="font-medium text-blue-600">
															{Object.keys(entry.changed_fields).join(', ')}
														</span>
													</div>
												)}

												{/* Previous Values */}
												{entry.previous_values && Object.keys(entry.previous_values).length > 0 && (
													<details className="text-sm">
														<summary className="cursor-pointer text-gray-600 hover:text-gray-900">
															Önceki değerler
														</summary>
														<pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
															{JSON.stringify(entry.previous_values, null, 2)}
														</pre>
													</details>
												)}

												{/* Action Description (audit_log) */}
												{entry.action_description && (
													<div className="text-sm text-gray-700 italic">{entry.action_description}</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Load More */}
				{history.length >= limit && (
					<div className="text-center">
						<Button onClick={() => setLimit(limit + 50)} variant="outline">
							Daha Fazla Yükle
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
