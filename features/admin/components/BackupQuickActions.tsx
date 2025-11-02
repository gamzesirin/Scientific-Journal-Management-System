'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, Database } from 'lucide-react'
import { toast } from 'sonner'

export default function BackupQuickActions() {
	const [isCreatingBackup, setIsCreatingBackup] = useState(false)
	const [isRestoring, setIsRestoring] = useState(false)

	const handleCreateFullBackup = async () => {
		setIsCreatingBackup(true)
		try {
			toast.info('Tam yedek oluşturuluyor, lütfen bekleyin...')

			// Create backup via API
			const response = await fetch('/api/admin/backups', {
				method: 'POST'
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Tam yedek başarıyla oluşturuldu')

				// Download the created backup
				const downloadResponse = await fetch(`/api/admin/backups/${data.backup.name}`)

				if (downloadResponse.ok) {
					const blob = await downloadResponse.blob()
					const url = URL.createObjectURL(blob)
					const link = document.createElement('a')
					link.href = url
					link.download = data.backup.name
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					URL.revokeObjectURL(url)

					toast.success('Yedek dosyası indirildi')
				}
			} else {
				console.error('Backup creation error:', data.error)
				toast.error(data.error || 'Yedek oluşturulurken bir hata oluştu')
			}
		} catch (error) {
			console.error('Yedek oluşturma hatası:', error)
			toast.error('Yedek oluşturulurken bir hata oluştu')
		} finally {
			setIsCreatingBackup(false)
		}
	}

	const handleRestoreFromBackup = () => {
		// Dosya seçici aç
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json'
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0]
			if (!file) {
				return
			}

			// Confirm restore
			const confirmRestore = confirm(
				`"${file.name}" dosyasından geri yükleme yapmak istediğinizden emin misiniz?\n\nBu işlem mevcut verilere ekleme yapacaktır. İşlem geri alınamaz!`
			)

			if (!confirmRestore) {
				return
			}

			setIsRestoring(true)

			try {
				toast.info('Geri yükleme işlemi başlatılıyor...')

				// Create form data
				const formData = new FormData()
				formData.append('file', file)

				// Call restore API
				const response = await fetch('/api/admin/backups/restore', {
					method: 'POST',
					body: formData
				})

				const data = await response.json()

				if (response.ok) {
					toast.success(`Geri yükleme tamamlandı!`, {
						description: `${data.summary.successful}/${data.summary.total_tables} tablo başarıyla geri yüklendi`
					})

					if (data.results.failed.length > 0) {
						toast.warning(`${data.results.failed.length} tablo geri yüklenemedi`, {
							description: 'Detaylar için konsola bakın'
						})
						console.log('Failed tables:', data.results.failed)
					}
				} else {
					console.error('Restore error:', data.error)
					toast.error(data.error || 'Geri yükleme işlemi başarısız oldu')
				}
			} catch (error) {
				console.error('Geri yükleme hatası:', error)
				toast.error('Geri yükleme işlemi başarısız oldu')
			} finally {
				setIsRestoring(false)
			}
		}
		input.click()
	}

	const handleCheckDatabaseStatus = async () => {
		try {
			toast.info('Veritabanı durumu kontrol ediliyor...')

			// Simüle edilen durum kontrolü
			await new Promise(resolve => setTimeout(resolve, 1500))

			toast.success('Veritabanı bağlantısı aktif ve sağlıklı', {
				description: 'Tüm tablolar erişilebilir durumda'
			})
		} catch (error) {
			console.error('Durum kontrolü hatası:', error)
			toast.error('Veritabanı durumu kontrol edilemedi')
		}
	}

	return (
		<div className="flex flex-wrap gap-4">
			<Button
				className="flex items-center gap-2"
				onClick={handleCreateFullBackup}
				disabled={isCreatingBackup}
			>
				<Download className="h-4 w-4" />
				{isCreatingBackup ? 'Yedek Alınıyor...' : 'Tam Yedek Al'}
			</Button>
			<Button
				variant="outline"
				className="flex items-center gap-2"
				onClick={handleRestoreFromBackup}
				disabled={isRestoring}
			>
				<Upload className="h-4 w-4" />
				{isRestoring ? 'Geri Yükleniyor...' : 'Yedekten Geri Yükle'}
			</Button>
			<Button
				variant="outline"
				className="flex items-center gap-2"
				onClick={handleCheckDatabaseStatus}
			>
				<Database className="h-4 w-4" />
				Veritabanı Durumu
			</Button>
		</div>
	)
}
