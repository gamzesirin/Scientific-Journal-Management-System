import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ArticleUploadForm from '@/features/articles/components/ArticleUploadForm'

export default async function ArticleUploadPage() {
	const supabase = await createServerSupabaseClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Get user data with role
	const { data: userData } = await supabase
		.from('users')
		.select('*')
		.eq('id', user.id)
		.single()

	// Only authors can upload articles
	if (userData?.role !== 'author' && userData?.role !== 'admin') {
		redirect('/dashboard')
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation */}
				<div className="mb-6">
					<Link href="/dashboard">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Dashboard'a Dön
						</Button>
					</Link>
				</div>

				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">Yeni Makale Yükle</h1>
					<p className="text-gray-600 mt-2">
						Makalenizi yüklemek için aşağıdaki formu doldurun
					</p>
				</div>

				{/* Upload Form */}
				<ArticleUploadForm />
			</div>
		</div>
	)
}