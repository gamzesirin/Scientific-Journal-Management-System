import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import UsersManagementTable from '@/features/admin/components/UsersManagementTable'

export default async function AdminUsersPage() {
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

	// Tüm kullanıcıları al
	const { data: allUsers, error } = await supabase
		.from('users')
		.select('*')
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching users:', error)
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
							<CardTitle className="text-2xl">Kullanıcı Yönetimi</CardTitle>
							<CardDescription>
								Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin
							</CardDescription>
						</CardHeader>
					</Card>
				</div>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<CardTitle>Tüm Kullanıcılar ({allUsers?.length || 0})</CardTitle>
					</CardHeader>
					<CardContent>
						{allUsers && allUsers.length > 0 ? (
							<UsersManagementTable users={allUsers} />
						) : (
							<p className="text-gray-500 text-center py-8">Henüz kullanıcı bulunmuyor.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
