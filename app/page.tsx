import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileText, Users, BarChart3, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

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
		<div className="min-h-screen bg-white">
			{/* Hero Section */}
			<div className="relative overflow-hidden">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />

				{/* Decorative blobs */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10" />
				<div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -z-10" />

				<div className="container mx-auto px-6 pt-20 pb-32 sm:pt-32 sm:pb-40">
					<div className="max-w-4xl mx-auto text-center">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
							<Sparkles className="h-4 w-4 text-blue-600" />
							<span className="text-sm font-medium text-blue-700">Modern Akademik Yayın Platformu</span>
						</div>

						{/* Main heading */}
						<h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
							Bilimsel Dergi
							<span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
								Yönetim Sistemi
							</span>
						</h1>

						{/* Subheading */}
						<p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
							Akademik yayın sürecinizi dijitalleştirin. Makale gönderiminden yayına kadar tüm süreçleri tek platformda yönetin.
						</p>

						{/* CTA Buttons */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
							<Button asChild size="lg" className="text-base px-8 h-12 w-full sm:w-auto">
								<Link href="/auth/register" className="group">
									Ücretsiz Başlayın
									<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>
							<Button asChild variant="outline" size="lg" className="text-base px-8 h-12 w-full sm:w-auto">
								<Link href="/auth/login">
									Giriş Yap
								</Link>
							</Button>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-gray-200">
							<div>
								<div className="text-3xl font-bold text-gray-900">100+</div>
								<div className="text-sm text-gray-600 mt-1">Aktif Kullanıcı</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-gray-900">50+</div>
								<div className="text-sm text-gray-600 mt-1">Yayınlanan Makale</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-gray-900">24/7</div>
								<div className="text-sm text-gray-600 mt-1">Destek</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="py-24 bg-gray-50">
				<div className="container mx-auto px-6">
					<div className="max-w-3xl mx-auto text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
							Her Şey Bir Arada
						</h2>
						<p className="text-lg text-gray-600">
							Akademik yayın sürecinizi hızlandıracak güçlü özellikler
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
						{/* Feature 1 */}
						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
							<div className="p-6">
								<div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
									<FileText className="h-6 w-6 text-blue-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Kolay Makale Gönderimi
								</h3>
								<p className="text-gray-600 text-sm">
									Sürükle-bırak ile hızlıca makale yükleyin. Otomatik format kontrolü ve metadata yönetimi.
								</p>
							</div>
						</Card>

						{/* Feature 2 */}
						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
							<div className="p-6">
								<div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
									<Users className="h-6 w-6 text-purple-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Akıllı Hakem Eşleştirme
								</h3>
								<p className="text-gray-600 text-sm">
									AI destekli hakem önerileri ile en uygun uzmanları bulun. Hızlı atama ve takip.
								</p>
							</div>
						</Card>

						{/* Feature 3 */}
						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
							<div className="p-6">
								<div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
									<BarChart3 className="h-6 w-6 text-green-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Detaylı Analitikler
								</h3>
								<p className="text-gray-600 text-sm">
									Gerçek zamanlı raporlar ve istatistikler. Süreç takibi ve performans metrikleri.
								</p>
							</div>
						</Card>

						{/* Feature 4 */}
						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
							<div className="p-6">
								<div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
									<Shield className="h-6 w-6 text-orange-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Güvenlik ve Gizlilik
								</h3>
								<p className="text-gray-600 text-sm">
									End-to-end şifreleme. Rol bazlı erişim kontrolü. GDPR uyumlu veri koruma.
								</p>
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Process Section */}
			<div className="py-24 bg-white">
				<div className="container mx-auto px-6">
					<div className="max-w-3xl mx-auto text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
							Basit ve Etkili Süreç
						</h2>
						<p className="text-lg text-gray-600">
							3 adımda makalenizi yayınlayın
						</p>
					</div>

					<div className="max-w-5xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Step 1 */}
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
									1
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Makale Gönder</h3>
								<p className="text-gray-600">
									Makalenizi ve gerekli dökümanları sisteme yükleyin
								</p>
							</div>

							{/* Step 2 */}
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4">
									2
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Değerlendirme</h3>
								<p className="text-gray-600">
									Editör ve hakemler makalenizi inceler
								</p>
							</div>

							{/* Step 3 */}
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 font-bold text-xl mb-4">
									3
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Yayınla</h3>
								<p className="text-gray-600">
									Onaylanan makaleniz yayına hazır
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
				<div className="container mx-auto px-6">
					<div className="max-w-3xl mx-auto text-center text-white">
						<h2 className="text-3xl sm:text-4xl font-bold mb-4">
							Akademik Yolculuğunuza Başlayın
						</h2>
						<p className="text-xl text-blue-100 mb-8">
							Binlerce araştırmacı ve editör güveniyor. Siz de aramıza katılın.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Button asChild size="lg" variant="secondary" className="text-base px-8 h-12 w-full sm:w-auto">
								<Link href="/auth/register">
									Ücretsiz Hesap Oluştur
								</Link>
							</Button>
						</div>

						{/* Trust indicators */}
						<div className="mt-12 pt-8 border-t border-white/20">
							<div className="flex flex-wrap justify-center items-center gap-8 text-sm text-blue-100">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									<span>Kredi kartı gerektirmez</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									<span>Anında kurulum</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									<span>7/24 destek</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
