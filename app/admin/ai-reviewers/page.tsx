import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewerAIManagement from '@/features/admin/components/ReviewerAIManagement'

export default async function AIReviewersPage() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/login')
	}

	// Check if user is admin
	const { data: userData } = await supabase
		.from('users')
		.select('role')
		.eq('id', user.id)
		.single()

	if (!userData || userData.role !== 'admin') {
		redirect('/dashboard')
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">AI Hakem Yönetimi</h1>
				<p className="text-gray-600">
					Hakem özgeçmişlerini AI ile işleyerek akıllı makale-hakem eşleştirmesi yapın
				</p>
			</div>

			<ReviewerAIManagement />
		</div>
	)
}
