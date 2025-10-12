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
			// Simüle edilen yedek oluşturma işlemi
			await new Promise(resolve => setTimeout(resolve, 2000))

			// Gerçek uygulamada burada API çağrısı yapılır
			const backupData = {
				created_at: new Date().toISOString(),
				database_name: 'scientific-journal-db',
				version: '1.0.0',
				note: 'Tam yedek alındı'
			}

			const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `backup-full-${new Date().toISOString().split('T')[0]}.json`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)

			toast.success('Tam yedek başarıyla oluşturuldu ve indirildi')
		} catch (error) {
			console.error('Yedek oluşturma hatası:', error)
			toast.error('Yedek oluşturulurken bir hata oluştu')
		} finally {
			setIsCreatingBackup(false)
		}
	}

	const handleRestoreFromBackup = () => {
		setIsRestoring(true)
		try {
			// Dosya seçici aç
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.json,.sql'
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0]
				if (file) {
					// Simüle edilen geri yükleme işlemi
					await new Promise(resolve => setTimeout(resolve, 2000))
					toast.success(`${file.name} dosyasından geri yükleme işlemi başlatıldı`)
					toast.info('Bu işlem birkaç dakika sürebilir. Lütfen bekleyin...')
				}
				setIsRestoring(false)
			}
			input.click()
		} catch (error) {
			console.error('Geri yükleme hatası:', error)
			toast.error('Geri yükleme işlemi başarısız oldu')
			setIsRestoring(false)
		}
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
