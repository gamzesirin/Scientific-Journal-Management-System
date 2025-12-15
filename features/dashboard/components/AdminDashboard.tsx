import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Users,
	FileText,
	UserCheck,
	Shield,
	UserCog,
	ArrowRight,
	ClipboardCheck,
	UserPlus,
	GitBranch,
	Sparkles,
	Brain
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { AdminStats } from '@/features/dashboard/types/dashboard.types'
import Link from 'next/link'

interface UserData {
	id: string
	email: string
	name: string
	role: string
}

interface AdminDashboardProps {
	user: User
	userData: UserData | null
	stats: AdminStats
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
	return (
		<>
			<h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Paneli</h1>

			{/* Overview Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Users className="h-4 w-4" />
							Toplam Kullanıcı
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{stats.totalUsers}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Toplam Makale
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{stats.totalPapers}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<UserCheck className="h-4 w-4" />
							Toplam Değerlendirme
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{stats.totalReviews}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Shield className="h-4 w-4" />
							Sistem Durumu
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="success">Aktif</Badge>
					</CardContent>
				</Card>
			</div>

			{/* Users by Role */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Kullanıcılar (Role Göre)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-red-600">{stats.usersByRole.admin}</p>
							<p className="text-sm text-gray-600 mt-1">Admin</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-blue-600">{stats.usersByRole.editor}</p>
							<p className="text-sm text-gray-600 mt-1">Editör</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-green-600">{stats.usersByRole.reviewer}</p>
							<p className="text-sm text-gray-600 mt-1">Hakem</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-purple-600">{stats.usersByRole.author}</p>
							<p className="text-sm text-gray-600 mt-1">Yazar</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Papers by Status */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Makaleler (Duruma Göre)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-gray-600">{stats.papersByStatus.submitted}</p>
							<p className="text-sm text-gray-600 mt-1">Gönderildi</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-yellow-600">{stats.papersByStatus.under_review}</p>
							<p className="text-sm text-gray-600 mt-1">İncelemede</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-orange-600">{stats.papersByStatus.revision_requested}</p>
							<p className="text-sm text-gray-600 mt-1">Revizyon İstendi</p>
						</div>
						<div className="text-center p-4 bg-purple-50 rounded-lg border-purple-200 border-2">
							<p className="text-2xl font-bold text-purple-600">{stats.papersByStatus.resubmitted}</p>
							<p className="text-sm text-gray-600 mt-1">Yeniden Gönderildi</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-green-600">{stats.papersByStatus.accepted}</p>
							<p className="text-sm text-gray-600 mt-1">Kabul</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-red-600">{stats.papersByStatus.rejected}</p>
							<p className="text-sm text-gray-600 mt-1">Red</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-indigo-600">{stats.papersByStatus.published}</p>
							<p className="text-sm text-gray-600 mt-1">Yayınlandı</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Yeni Özellikler: Desk Evaluation, Ortak Yazarlar, Revizyonlar */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				{/* Desk Evaluation Stats */}
				<Card className="border-2 border-blue-200 bg-blue-50/30">
					<CardHeader>
						<div className="flex items-center gap-2">
							<ClipboardCheck className="h-5 w-5 text-blue-600" />
							<CardTitle className="text-blue-900">Editör Ön Değerlendirme</CardTitle>
						</div>
						<CardDescription>Desk Evaluation İstatistikleri</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Toplam:</span>
								<span className="text-lg font-bold">{stats.deskEvaluations.total}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Onaylanan:</span>
								<Badge variant="success">{stats.deskEvaluations.approved}</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Reddedilen:</span>
								<Badge variant="destructive">{stats.deskEvaluations.rejected}</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Bekleyen:</span>
								<Badge variant="secondary">{stats.deskEvaluations.pending}</Badge>
							</div>
							{stats.deskEvaluations.total > 0 && (
								<div className="pt-2 mt-2 border-t">
									<p className="text-xs text-gray-500">
										Onay Oranı: {Math.round((stats.deskEvaluations.approved / stats.deskEvaluations.total) * 100)}%
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Coauthors Stats */}
				<Card className="border-2 border-green-200 bg-green-50/30">
					<CardHeader>
						<div className="flex items-center gap-2">
							<UserPlus className="h-5 w-5 text-green-600" />
							<CardTitle className="text-green-900">Ortak Yazarlar</CardTitle>
						</div>
						<CardDescription>Ortak Yazar İstatistikleri</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Toplam Ortak Yazar:</span>
								<span className="text-lg font-bold">{stats.coauthors.totalCoauthors}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Ortak Yazarlı Makale:</span>
								<Badge className="bg-green-600">{stats.coauthors.totalPapersWithCoauthors}</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Makale Başına Ort.:</span>
								<Badge variant="outline">{stats.coauthors.averageCoauthorsPerPaper}</Badge>
							</div>
							{stats.totalPapers > 0 && (
								<div className="pt-2 mt-2 border-t">
									<p className="text-xs text-gray-500">
										Ortak Yazarlı Makale Oranı:{' '}
										{Math.round((stats.coauthors.totalPapersWithCoauthors / stats.totalPapers) * 100)}%
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Revisions Stats */}
				<Card className="border-2 border-purple-200 bg-purple-50/30">
					<CardHeader>
						<div className="flex items-center gap-2">
							<GitBranch className="h-5 w-5 text-purple-600" />
							<CardTitle className="text-purple-900">Revizyonlar</CardTitle>
						</div>
						<CardDescription>Revizyon İstatistikleri</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Toplam Revizyon:</span>
								<span className="text-lg font-bold">{stats.revisions.totalRevisions}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Revizyonlu Makale:</span>
								<Badge className="bg-purple-600">{stats.revisions.papersWithRevisions}</Badge>
							</div>
							{stats.revisions.papersWithRevisions > 0 && (
								<>
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-600">Makale Başına Ort.:</span>
										<Badge variant="outline">
											{(stats.revisions.totalRevisions / stats.revisions.papersWithRevisions).toFixed(1)}
										</Badge>
									</div>
									<div className="pt-2 mt-2 border-t">
										<p className="text-xs text-gray-500">
											Revizyonlu Makale Oranı:{' '}
											{Math.round((stats.revisions.papersWithRevisions / stats.totalPapers) * 100)}%
										</p>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* AI Features */}
			<Card className="mb-6 border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Brain className="h-6 w-6 text-indigo-600" />
						<CardTitle className="text-indigo-900 text-xl">AI Hakem Eşleştirme Sistemi</CardTitle>
						<Badge className="ml-2 bg-indigo-600">
							<Sparkles className="h-3 w-3 mr-1" />
							YENİ
						</Badge>
					</div>
					<CardDescription className="text-base">
						Yapay zeka destekli akıllı hakem eşleştirmesi
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-700 mb-4">
						Google Gemini AI modellerini kullanarak hakem CV&apos;lerini ve makale içeriklerini analiz edin.
						Sistem, en uygun hakemleri otomatik olarak belirler ve editörlere %0-100 arası eşleşme skorları
						ile önerir.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
						<div className="bg-white/60 p-3 rounded-lg border border-indigo-200">
							<p className="text-xs text-gray-600 mb-1">Özellikler:</p>
							<ul className="text-xs text-gray-700 space-y-1">
								<li>✓ Otomatik CV analizi</li>
								<li>✓ Makale-hakem eşleştirme</li>
								<li>✓ Çok boyutlu skorlama</li>
							</ul>
						</div>
						<div className="bg-white/60 p-3 rounded-lg border border-indigo-200">
							<p className="text-xs text-gray-600 mb-1">Skorlar:</p>
							<ul className="text-xs text-gray-700 space-y-1">
								<li>• Konu benzerliği</li>
								<li>• Anahtar kelime örtüşmesi</li>
								<li>• Metodoloji uyumu</li>
							</ul>
						</div>
						<div className="bg-white/60 p-3 rounded-lg border border-indigo-200">
							<p className="text-xs text-gray-600 mb-1">Yönetim:</p>
							<ul className="text-xs text-gray-700 space-y-1">
								<li>• CV işleme durumu</li>
								<li>• Toplu işlemler</li>
								<li>• Profil güncellemeleri</li>
							</ul>
						</div>
					</div>
					<Link href="/admin/ai-reviewers">
						<Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
							<Brain className="h-4 w-4 mr-2" />
							AI Hakem Yönetimi
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Priority Actions - Editör Atama */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<Card className="border-2 border-blue-200 bg-blue-50/50">
					<CardHeader>
						<div className="flex items-center gap-2">
							<UserCog className="h-5 w-5 text-blue-600" />
							<CardTitle className="text-blue-900">Editör Atama</CardTitle>
						</div>
						<CardDescription>Makalelere editör atayın ve yönetin</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Gönderilen makaleleri editörlere atayarak inceleme sürecini başlatın. Her makale için uygun editörü
							seçebilir ve iş yükünü dengeleyebilirsiniz.
						</p>
						<Link href="/admin/articles">
							<Button className="w-full" size="lg">
								<UserCog className="h-4 w-4 mr-2" />
								Editör Atama Sayfasına Git
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="border-2 border-purple-200 bg-purple-50/50">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-purple-600" />
							<CardTitle className="text-purple-900">Kullanıcı Yönetimi</CardTitle>
						</div>
						<CardDescription>Sistemdeki kullanıcıları yönetin</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Editörler, hakemler ve yazarları yönetin. Kullanıcı rollerini değiştirin ve hesap durumlarını kontrol
							edin.
						</p>
						<Link href="/admin/users">
							<Button className="w-full" variant="outline" size="lg">
								<Users className="h-4 w-4 mr-2" />
								Kullanıcı Yönetimi
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>

		</>
	)
}
