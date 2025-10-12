import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, FileText, UserCheck, Shield } from 'lucide-react'
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
	userData: UserData
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
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-green-600">{stats.papersByStatus.accepted}</p>
							<p className="text-sm text-gray-600 mt-1">Kabul</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-red-600">{stats.papersByStatus.rejected}</p>
							<p className="text-sm text-gray-600 mt-1">Red</p>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-2xl font-bold text-purple-600">{stats.papersByStatus.published}</p>
							<p className="text-sm text-gray-600 mt-1">Yayınlandı</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Hızlı İşlemler</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						<Link href="/admin/users">
							<Button>Kullanıcı Yönetimi</Button>
						</Link>
						<Link href="/admin/articles">
							<Button variant="outline">Makale Yönetimi</Button>
						</Link>
						<Link href="/admin/settings">
							<Button variant="outline">Sistem Ayarları</Button>
						</Link>
						<Link href="/admin/reports">
							<Button variant="outline">Raporlar</Button>
						</Link>
						<Link href="/admin/backup">
							<Button variant="outline">Yedekleme</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</>
	)
}