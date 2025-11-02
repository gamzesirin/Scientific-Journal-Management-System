import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BackupManager from '@/features/admin/components/BackupManager'
import BackupQuickActions from '@/features/admin/components/BackupQuickActions'
import BackupSchedule from '@/features/admin/components/BackupSchedule'

export default async function AdminBackupPage() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Kullanıcı bilgilerini ve rolünü al
	const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()

	// Sadece admin erişebilir
	if (userData?.role !== 'admin') {
		redirect('/dashboard')
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				{/* Header */}
				<div className="mb-6">
					<Link href="/dashboard">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Dashboard&apos;a Dön
						</Button>
					</Link>
					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">Yedekleme ve Geri Yükleme</CardTitle>
							<CardDescription>
								Veritabanı yedeklerini yönetin
							</CardDescription>
						</CardHeader>
					</Card>
				</div>

				{/* Backup Options */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Hızlı İşlemler</CardTitle>
						</CardHeader>
						<CardContent>
							<BackupQuickActions />
						</CardContent>
					</Card>

					{/* Backup Manager */}
					<Card>
						<CardHeader>
							<CardTitle>Yedek Yönetimi</CardTitle>
							<CardDescription>
								Mevcut yedekleri görüntüleyin ve yönetin
							</CardDescription>
						</CardHeader>
						<CardContent>
							<BackupManager />
						</CardContent>
					</Card>

					{/* Backup Schedule */}
					<Card>
						<CardHeader>
							<CardTitle>Otomatik Yedekleme</CardTitle>
							<CardDescription>
								Otomatik yedekleme ayarları
							</CardDescription>
						</CardHeader>
						<CardContent>
							<BackupSchedule />
						</CardContent>
					</Card>

					{/* Database Info */}
					<Card>
						<CardHeader>
							<CardTitle>Veritabanı Bilgileri</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between py-2 border-b">
									<span className="text-gray-600">Veritabanı Tipi:</span>
									<span className="font-medium">PostgreSQL (Supabase)</span>
								</div>
								<div className="flex justify-between py-2 border-b">
									<span className="text-gray-600">Son Yedek:</span>
									<span className="font-medium">Henüz yedek alınmadı</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-gray-600">Toplam Boyut:</span>
									<span className="font-medium">Hesaplanıyor...</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
