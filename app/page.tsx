import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	// Eğer kullanıcı giriş yapmışsa dashboard'a yönlendir
	if (user) {
		redirect('/dashboard')
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			{/* Hero Section */}
			<div className="relative isolate px-6 pt-14 lg:px-8">
				<div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
					<div className="text-center">
						<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
							Bilimsel Dergi Yönetim Sistemi
						</h1>
						<p className="mt-6 text-lg leading-8 text-gray-600">
							Makalelerinizi gönderin, hakem değerlendirmelerini takip edin ve akademik yayın sürecinizi kolayca
							yönetin.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<Button asChild size="lg">
								<Link href="/auth/register">Hesap Oluştur</Link>
							</Button>
							<Button asChild variant="outline" size="lg">
								<Link href="/auth/login">
									Giriş Yap <span aria-hidden="true" className="ml-2">→</span>
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="py-24 sm:py-32">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl lg:text-center">
						<h2 className="text-base font-semibold leading-7 text-primary">Hızlı ve Kolay</h2>
						<p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
							Akademik Yayın Sürecinizi Kolaylaştırın
						</p>
						<p className="mt-6 text-lg leading-8 text-muted-foreground">
							Modern ve kullanıcı dostu arayüzümüz ile makale gönderiminden hakem değerlendirmesine kadar tüm süreçleri
							kolayca yönetin.
						</p>
					</div>
					<div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mt-24 lg:max-w-4xl lg:grid-cols-2">
						<Card>
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl">📝</div>
								<CardTitle>Kolay Makale Gönderimi</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									Makalelerinizi birkaç tıklama ile sisteme yükleyin ve sürecin her aşamasını takip edin.
								</CardDescription>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl">👥</div>
								<CardTitle>Hakem Değerlendirmesi</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									Uzman hakemler tarafından yapılan değerlendirmeleri anlık olarak takip edin.
								</CardDescription>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl">📊</div>
								<CardTitle>Detaylı Raporlama</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									Makalenizin durumu, hakem değerlendirmeleri ve editör kararları hakkında detaylı raporlar alın.
								</CardDescription>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl">🔒</div>
								<CardTitle>Güvenli ve Özel</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									Makaleleriniz ve değerlendirmeler güvenli bir şekilde saklanır ve sadece yetkili kişiler tarafından
									görüntülenebilir.
								</CardDescription>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
