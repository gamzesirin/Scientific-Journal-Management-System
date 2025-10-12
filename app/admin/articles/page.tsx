import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AdminArticlesTable from '@/features/admin/components/AdminArticlesTable'

export default async function AdminArticlesPage() {
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

	// Tüm makaleleri al
	let allArticles: any[] = []

	const { data: articlesWithAuthor, error: joinError } = await supabase
		.from('articles')
		.select(
			`
			*,
			author:users!articles_author_id_fkey(name, email, affiliation)
		`
		)
		.order('created_at', { ascending: false })

	// Editör bilgilerini ayrı çek
	const { data: editors } = await supabase.from('users').select('id, name, email').eq('role', 'editor')

	// Eğer join'li query başarılı olduysa
	if (!joinError && articlesWithAuthor) {
		allArticles = articlesWithAuthor
	} else {
		// Join başarısız olduysa, makaleleri ve yazarları ayrı çek
		console.log('Join failed, trying separate queries...', joinError)

		const { data: articles } = await supabase.from('articles').select('*').order('created_at', { ascending: false })

		if (articles && articles.length > 0) {
			// Yazar bilgilerini ayrı çek
			const authorIds = [...new Set(articles.map((a) => a.author_id).filter(Boolean))]
			const { data: authors } = await supabase.from('users').select('id, name, email, affiliation').in('id', authorIds)

			const authorsMap = new Map(authors?.map((a) => [a.id, a]) || [])

			// Yazar bilgilerini makalelere ekle
			allArticles = articles.map((article) => ({
				...article,
				author: authorsMap.get(article.author_id)
			}))
		}
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
							<CardTitle className="text-2xl">Makale Yönetimi</CardTitle>
							<CardDescription>Sistemdeki tüm makaleleri görüntüleyin ve yönetin</CardDescription>
						</CardHeader>
					</Card>
				</div>

				{/* Articles Table */}
				<Card>
					<CardHeader>
						<CardTitle>Tüm Makaleler ({allArticles?.length || 0})</CardTitle>
					</CardHeader>
					<CardContent>
						{allArticles && allArticles.length > 0 ? (
							<AdminArticlesTable articles={allArticles} />
						) : (
							<p className="text-gray-500 text-center py-8">Henüz makale bulunmuyor.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
