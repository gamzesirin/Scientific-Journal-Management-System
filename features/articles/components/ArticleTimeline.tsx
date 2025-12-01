'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	CheckCircle,
	Clock,
	FileText,
	UserCheck,
	AlertCircle,
	GitBranch,
	Send,
	Eye,
	Edit,
	Trash2,
	User
} from 'lucide-react'
import type { ArticleHistory } from '@/features/history/types/history.types'

interface ArticleTimelineProps {
	articleId: string
	showFullDetails?: boolean // Admin/Editor için detaylı görünüm
}

export default function ArticleTimeline({ articleId, showFullDetails = false }: ArticleTimelineProps) {
	const [timeline, setTimeline] = useState<ArticleHistory[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchTimeline()
	}, [articleId])

	const fetchTimeline = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch(`/api/history?table=articles&record_id=${articleId}&limit=100`)
			const { data, error: apiError } = await response.json()

			if (apiError) {
				throw new Error(apiError)
			}

			setTimeline(data || [])
		} catch (err: any) {
			console.error('Error fetching timeline:', err)
			setError(err.message || 'Timeline yüklenirken hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const getActionInfo = (action: string, status?: string) => {
		switch (action) {
			case 'INSERT':
				return {
					icon: <Send className="h-5 w-5" />,
					color: 'bg-blue-500',
					text: 'Makale Gönderildi',
					description: 'Makale sisteme yüklendi ve inceleme için gönderildi'
				}
			case 'STATUS_CHANGE':
				return getStatusChangeInfo(status)
			case 'UPDATE':
				return {
					icon: <Edit className="h-5 w-5" />,
					color: 'bg-yellow-500',
					text: 'Makale Güncellendi',
					description: 'Makale bilgileri güncellendi'
				}
			case 'DELETE':
				return {
					icon: <Trash2 className="h-5 w-5" />,
					color: 'bg-red-500',
					text: 'Makale Silindi',
					description: 'Makale sistemden kaldırıldı'
				}
			default:
				return {
					icon: <FileText className="h-5 w-5" />,
					color: 'bg-gray-500',
					text: action,
					description: 'İşlem gerçekleştirildi'
				}
		}
	}

	const getStatusChangeInfo = (status?: string) => {
		switch (status) {
			case 'submitted':
				return {
					icon: <Send className="h-5 w-5" />,
					color: 'bg-blue-500',
					text: 'Gönderildi',
					description: 'Makale editör incelemesi için gönderildi'
				}
			case 'under_review':
				return {
					icon: <Eye className="h-5 w-5" />,
					color: 'bg-purple-500',
					text: 'İnceleme Aşamasında',
					description: 'Makale hakemler tarafından inceleniyor'
				}
			case 'revision_requested':
				return {
					icon: <AlertCircle className="h-5 w-5" />,
					color: 'bg-orange-500',
					text: 'Revizyon İstendi',
					description: 'Makalenizde değişiklik yapmanız gerekiyor'
				}
			case 'accepted':
				return {
					icon: <CheckCircle className="h-5 w-5" />,
					color: 'bg-green-500',
					text: 'Kabul Edildi',
					description: 'Makaleniz yayın için kabul edildi'
				}
			case 'rejected':
				return {
					icon: <AlertCircle className="h-5 w-5" />,
					color: 'bg-red-500',
					text: 'Reddedildi',
					description: 'Makaleniz yayınlanamaz olarak işaretlendi'
				}
			case 'published':
				return {
					icon: <CheckCircle className="h-5 w-5" />,
					color: 'bg-green-600',
					text: 'Yayınlandı',
					description: 'Makaleniz başarıyla yayınlandı'
				}
			default:
				return {
					icon: <GitBranch className="h-5 w-5" />,
					color: 'bg-gray-500',
					text: 'Durum Değişti',
					description: 'Makale durumu güncellendi'
				}
		}
	}

	const getStatusBadgeColor = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'bg-blue-100 text-blue-800'
			case 'under_review':
				return 'bg-purple-100 text-purple-800'
			case 'revision_requested':
				return 'bg-orange-100 text-orange-800'
			case 'accepted':
				return 'bg-green-100 text-green-800'
			case 'rejected':
				return 'bg-red-100 text-red-800'
			case 'published':
				return 'bg-green-100 text-green-900'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

		if (diffInHours < 1) {
			const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
			return `${diffInMinutes} dakika önce`
		} else if (diffInHours < 24) {
			return `${diffInHours} saat önce`
		} else if (diffInHours < 48) {
			return 'Dün'
		} else {
			return date.toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Makale Takibi
					</CardTitle>
					<CardDescription>Makalenizin tüm süreç adımlarını görüntüleyin</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="animate-pulse flex gap-4">
								<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-gray-200 rounded w-1/4"></div>
									<div className="h-3 bg-gray-200 rounded w-1/2"></div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-red-600">
						<AlertCircle className="h-5 w-5" />
						Hata
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-red-600">{error}</p>
					<Button onClick={fetchTimeline} variant="outline" className="mt-4">
						Tekrar Dene
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					Makale Takibi
				</CardTitle>
				<CardDescription>
					Makalenizin {timeline.length} adımlık yolculuğu. Her aşamayı buradan takip edebilirsiniz.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{timeline.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p>Henüz işlem kaydı bulunmamaktadır.</p>
					</div>
				) : (
					<div className="relative">
						{/* Timeline Line */}
						<div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

						<div className="space-y-6">
							{timeline.map((entry, index) => {
								const actionInfo = getActionInfo(entry.action, entry.status)
								const isRecent = index === 0

								return (
									<div key={entry.history_id} className="relative flex gap-4">
										{/* Icon */}
										<div
											className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-white ${actionInfo.color} ${
												isRecent ? 'ring-4 ring-offset-2 ring-blue-100' : ''
											}`}
										>
											{actionInfo.icon}
										</div>

										{/* Content */}
										<div className={`flex-1 pb-6 ${isRecent ? 'bg-blue-50 -ml-2 pl-6 pr-4 py-4 rounded-r-lg' : ''}`}>
											<div className="flex items-start justify-between gap-4 mb-2">
												<div>
													<h3 className="font-semibold text-gray-900">{actionInfo.text}</h3>
													<p className="text-sm text-gray-600 mt-1">{actionInfo.description}</p>
												</div>
												{isRecent && (
													<Badge className="bg-blue-600 text-white">En Son</Badge>
												)}
											</div>

											{/* Details */}
											<div className="space-y-2 mt-3">
												{/* Status Badge */}
												{entry.status && (
													<div className="flex items-center gap-2">
														<Badge className={getStatusBadgeColor(entry.status)}>
															{entry.status === 'submitted' && 'Gönderildi'}
															{entry.status === 'under_review' && 'İnceleme Aşamasında'}
															{entry.status === 'revision_requested' && 'Revizyon İstendi'}
															{entry.status === 'accepted' && 'Kabul Edildi'}
															{entry.status === 'rejected' && 'Reddedildi'}
															{entry.status === 'published' && 'Yayınlandı'}
														</Badge>
													</div>
												)}

												{/* Changed By (if showFullDetails) */}
												{showFullDetails && entry.changed_by_user && (
													<div className="flex items-center gap-2 text-sm text-gray-600">
														<User className="h-4 w-4" />
														<span>
															{entry.changed_by_user.name} ({entry.changed_by_user.role})
														</span>
													</div>
												)}

												{/* Timestamp */}
												<div className="flex items-center gap-2 text-sm text-gray-500">
													<Clock className="h-4 w-4" />
													<span>{formatDate(entry.changed_at)}</span>
													<span className="text-xs">
														({new Date(entry.changed_at).toLocaleDateString('tr-TR')})
													</span>
												</div>


												{/* Assignment Info */}
												{entry.assigned_editor_id && entry.action === 'STATUS_CHANGE' && entry.status === 'under_review' && (
													<div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
														<p className="text-sm font-medium text-purple-900 flex items-center gap-2">
															<UserCheck className="h-4 w-4" />
															Editör Atandı
														</p>
														<p className="text-xs text-purple-700 mt-1">
															Makaleniz bir editör tarafından incelemeye alındı
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
