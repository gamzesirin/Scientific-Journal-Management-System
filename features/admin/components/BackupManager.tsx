'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Backup {
	id: string
	name: string
	size: string
	created_at: string
	status: 'completed' | 'pending' | 'failed'
}

export default function BackupManager() {
	const [backups, setBackups] = useState<Backup[]>([])
	const [loading, setLoading] = useState(false)
	const [fetching, setFetching] = useState(true)

	// Fetch backups on mount
	useEffect(() => {
		fetchBackups()
	}, [])

	const fetchBackups = async () => {
		try {
			setFetching(true)
			const response = await fetch('/api/admin/backups')
			const data = await response.json()

			if (response.ok) {
				setBackups(data.backups || [])
			} else {
				console.error('Failed to fetch backups:', data.error)
				toast.error('Yedekler yüklenirken bir hata oluştu')
			}
		} catch (error) {
			console.error('Fetch backups error:', error)
			toast.error('Yedekler yüklenirken bir hata oluştu')
		} finally {
			setFetching(false)
		}
	}

	const handleCreateBackup = async () => {
		setLoading(true)
		try {
			const response = await fetch('/api/admin/backups', {
				method: 'POST'
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Yedek başarıyla oluşturuldu')
				// Refresh backup list
				await fetchBackups()
			} else {
				console.error('Create backup error:', data.error)
				toast.error(data.error || 'Yedek oluşturulurken bir hata oluştu')
			}
		} catch (error) {
			console.error('Create backup error:', error)
			toast.error('Yedek oluşturulurken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const handleDownload = async (backup: Backup) => {
		try {
			toast.info(`${backup.name} indiriliyor...`)

			const response = await fetch(`/api/admin/backups/${backup.name}`)

			if (response.ok) {
				const blob = await response.blob()
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = backup.name
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				URL.revokeObjectURL(url)

				toast.success('Yedek başarıyla indirildi')
			} else {
				const data = await response.json()
				console.error('Download backup error:', data.error)
				toast.error(data.error || 'Yedek indirilirken bir hata oluştu')
			}
		} catch (error) {
			console.error('Download backup error:', error)
			toast.error('Yedek indirilirken bir hata oluştu')
		}
	}

	const handleDelete = async (backup: Backup) => {
		if (!confirm(`"${backup.name}" yedek dosyasını silmek istediğinizden emin misiniz?`)) {
			return
		}

		try {
			const response = await fetch(`/api/admin/backups/${backup.name}`, {
				method: 'DELETE'
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Yedek başarıyla silindi')
				// Remove from local state
				setBackups(backups.filter((b) => b.id !== backup.id))
			} else {
				console.error('Delete backup error:', data.error)
				toast.error(data.error || 'Yedek silinirken bir hata oluştu')
			}
		} catch (error) {
			console.error('Delete backup error:', error)
			toast.error('Yedek silinirken bir hata oluştu')
		}
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'completed':
				return <Badge variant="default">Tamamlandı</Badge>
			case 'pending':
				return <Badge variant="secondary">Beklemede</Badge>
			case 'failed':
				return <Badge variant="destructive">Başarısız</Badge>
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	if (fetching) {
		return (
			<div className="flex items-center justify-center py-8">
				<RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
				<span className="ml-2 text-gray-500">Yedekler yükleniyor...</span>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<p className="text-sm text-gray-500">Toplam {backups.length} yedek bulundu</p>
				<Button onClick={handleCreateBackup} disabled={loading}>
					{loading ? (
						<>
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							Oluşturuluyor...
						</>
					) : (
						'Yeni Yedek Oluştur'
					)}
				</Button>
			</div>

			{backups.length > 0 ? (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Dosya Adı</TableHead>
								<TableHead>Boyut</TableHead>
								<TableHead>Tarih</TableHead>
								<TableHead>Durum</TableHead>
								<TableHead className="text-right">İşlemler</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{backups.map(backup => (
								<TableRow key={backup.id}>
									<TableCell className="font-medium">{backup.name}</TableCell>
									<TableCell>{backup.size}</TableCell>
									<TableCell>
										{new Date(backup.created_at).toLocaleString('tr-TR')}
									</TableCell>
									<TableCell>{getStatusBadge(backup.status)}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDownload(backup)}
											>
												<Download className="h-4 w-4" />
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleDelete(backup)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<p className="text-center text-gray-500 py-8">Henüz yedek bulunmuyor.</p>
			)}
		</div>
	)
}
