import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SystemSettingsForm from '@/features/admin/components/SystemSettingsForm'

export default async function AdminSettingsPage() {
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
							Dashboard'a Dön
						</Button>
					</Link>
					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">Sistem Ayarları</CardTitle>
							<CardDescription>
								Sistem genelindeki ayarları yapılandırın
							</CardDescription>
						</CardHeader>
					</Card>
				</div>

				{/* Settings Sections */}
				<div className="space-y-6">
					{/* General Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Genel Ayarlar</CardTitle>
							<CardDescription>
								Platform adı, logo ve diğer genel ayarlar
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SystemSettingsForm />
						</CardContent>
					</Card>

					{/* Email Settings */}
					<Card>
						<CardHeader>
							<CardTitle>E-posta Ayarları</CardTitle>
							<CardDescription>
								Bildirim e-postalarının yapılandırması
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-500">
								E-posta ayarları yakında eklenecektir.
							</p>
						</CardContent>
					</Card>

					{/* Security Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Güvenlik Ayarları</CardTitle>
							<CardDescription>
								Şifre politikası ve güvenlik yapılandırması
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-500">
								Güvenlik ayarları yakında eklenecektir.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
