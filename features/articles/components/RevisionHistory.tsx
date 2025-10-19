'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ArticleVersion {
	id: string
	version_number: number
	file_url: string
	upload_reason: string | null
	status: string
	file_size: number | null
	file_type: string | null
	created_at: string
	uploaded_by_user: {
		name: string
		email: string
	}
}

interface RevisionHistoryProps {
	articleId: string
}

export default function RevisionHistory({ articleId }: RevisionHistoryProps) {
	const [versions, setVersions] = useState<ArticleVersion[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchVersions()
	}, [articleId])

	const fetchVersions = async () => {
		try {
			const response = await fetch(`/api/articles/${articleId}/revision`)
			const data = await response.json()

			if (response.ok) {
				setVersions(data.versions || [])
			}
		} catch (error) {
			console.error('Error fetching versions:', error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Revizyon Geçmişi</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500">Yükleniyor...</p>
				</CardContent>
			</Card>
		)
	}

	if (versions.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Revizyon Geçmişi</CardTitle>
					<CardDescription>Bu makale için henüz revizyon yüklenmemiş</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Revizyon Geçmişi</CardTitle>
				<CardDescription>{versions.length} versiyon bulundu</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{versions.map((version) => (
						<div
							key={version.id}
							className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
						>
							{/* Version Icon */}
							<div className="flex-shrink-0">
								<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
									<FileText className="h-5 w-5 text-blue-600" />
								</div>
							</div>

							{/* Version Info */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-semibold">Versiyon {version.version_number}</h4>
									{version.status === 'current' && (
										<Badge variant="default" className="bg-green-500">
											Güncel
										</Badge>
									)}
									{version.status === 'superseded' && <Badge variant="secondary">Geçmiş</Badge>}
								</div>

								{/* Upload Reason */}
								{version.upload_reason && <p className="text-sm text-gray-700 mb-2">{version.upload_reason}</p>}

								{/* Metadata */}
								<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
									<div className="flex items-center gap-1">
										<User className="h-3 w-3" />
										<span>{version.uploaded_by_user.name}</span>
									</div>
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										<span>
											{formatDistanceToNow(new Date(version.created_at), {
												addSuffix: true,
												locale: tr
											})}
										</span>
									</div>
									{version.file_size && <span>{(version.file_size / 1024 / 1024).toFixed(2)} MB</span>}
								</div>
							</div>

							{/* Download Button */}
							<div className="flex-shrink-0">
								<Button asChild variant="outline" size="sm">
									<a href={version.file_url} target="_blank" rel="noopener noreferrer">
										<Download className="h-4 w-4 mr-2" />
										İndir
									</a>
								</Button>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
