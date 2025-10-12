'use client'

import { useState } from 'react'
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
	const [backups, setBackups] = useState<Backup[]>([
		{
			id: '1',
			name: 'backup_2025_01_15_10_30.sql',
			size: '24.5 MB',
			created_at: '2025-01-15T10:30:00',
			status: 'completed'
		},
		{
			id: '2',
			name: 'backup_2025_01_10_08_15.sql',
			size: '22.1 MB',
			created_at: '2025-01-10T08:15:00',
			status: 'completed'
		}
	])
	const [loading, setLoading] = useState(false)

	const handleCreateBackup = async () => {
		setLoading(true)
		// TODO: API çağrısı ile yedek oluştur
		setTimeout(() => {
			const newBackup: Backup = {
				id: Date.now().toString(),
				name: `backup_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '_')}.sql`,
				size: '25.0 MB',
				created_at: new Date().toISOString(),
				status: 'completed'
			}
			setBackups([newBackup, ...backups])
			setLoading(false)
			toast.success('Yedek başarıyla oluşturuldu')
		}, 2000)
	}

	const handleDownload = (backup: Backup) => {
		// TODO: Yedek dosyasını indir
		toast.success(`${backup.name} indiriliyor...`)
	}

	const handleDelete = (backupId: string) => {
		// TODO: API çağrısı ile yedek sil
		setBackups(backups.filter(b => b.id !== backupId))
		toast.success('Yedek başarıyla silindi')
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
												onClick={() => handleDelete(backup.id)}
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
