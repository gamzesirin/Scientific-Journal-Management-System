import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

type Props = {
	params: Promise<{
		id: string
	}>
}

const statusColors: Record<string, string> = {
	submitted: 'bg-blue-500',
	under_review: 'bg-yellow-500',
	accepted: 'bg-green-500',
	rejected: 'bg-red-500',
	published: 'bg-purple-500'
}

const statusLabels: Record<string, string> = {
	submitted: 'Gönderildi',
	under_review: 'İnceleme Altında',
	accepted: 'Kabul Edildi',
	rejected: 'Reddedildi',
	published: 'Yayınlandı'
}

export default async function ArticleDetailPage({ params }: Props) {
	const resolvedParams = await params
	const supabase = await createServerSupabaseClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Makale bilgilerini al
	const { data: article, error } = await supabase.from('articles').select('*').eq('id', resolvedParams.id).single()

	if (error || !article) {
		return (
			<div className="container mx-auto py-8 px-4">
				<Card>
					<CardHeader>
						<CardTitle>Makale Bulunamadı</CardTitle>
						<CardDescription>Aradığınız makale bulunamadı veya erişim yetkiniz yok.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href="/dashboard">Dashboard&apos;a Dön</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Kullanıcı rolünü al
	const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

	// Makale yazarının bilgilerini al
	const { data: authorData } = await supabase.from('users').select('name, email').eq('id', article.author_id).single()

	const userRole = userData?.role || 'author'

	return (
		<div className="container mx-auto py-8 px-4 max-w-5xl">
			<div className="mb-6">
				<Button asChild variant="outline">
					<Link href="/dashboard">← Geri Dön</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-3xl mb-2">{article.title}</CardTitle>
							<CardDescription className="text-base">
								Yazar: {authorData?.name || 'Bilinmiyor'} ({authorData?.email || ''})
							</CardDescription>
						</div>
						<Badge className={`${statusColors[article.status]} text-white`}>
							{statusLabels[article.status] || article.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-2">Özet</h3>
						<p className="text-muted-foreground leading-relaxed">{article.abstract}</p>
					</div>

					<Separator />

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h3 className="text-sm font-semibold mb-2">Kategori</h3>
							<Badge variant="outline">{article.category}</Badge>
						</div>
						<div>
							<h3 className="text-sm font-semibold mb-2">Anahtar Kelimeler</h3>
							<div className="flex flex-wrap gap-2">
								{Array.isArray(article.keywords) ? (
									article.keywords.map((keyword: string, index: number) => (
										<Badge key={index} variant="secondary">
											{keyword}
										</Badge>
									))
								) : (
									<span className="text-sm text-muted-foreground">Anahtar kelime bulunamadı</span>
								)}
							</div>
						</div>
					</div>

					<Separator />

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h3 className="text-sm font-semibold mb-2">Gönderim Tarihi</h3>
							<p className="text-muted-foreground">{new Date(article.created_at).toLocaleDateString('tr-TR')}</p>
						</div>
						<div>
							<h3 className="text-sm font-semibold mb-2">Son Güncelleme</h3>
							<p className="text-muted-foreground">{new Date(article.updated_at).toLocaleDateString('tr-TR')}</p>
						</div>
					</div>

					{article.file_url && (
						<>
							<Separator />
							<div>
								<h3 className="text-sm font-semibold mb-2">Makale Dosyası</h3>
								<Button asChild>
									<a href={article.file_url} target="_blank" rel="noopener noreferrer">
										Dosyayı İndir
									</a>
								</Button>
							</div>
						</>
					)}

					{(userRole === 'editor' || userRole === 'admin') && (
						<>
							<Separator />
							<div className="flex gap-3">
								<Button variant="outline">Hakem Ata</Button>
								<Button variant="outline">Durumu Güncelle</Button>
								<Button variant="destructive">Reddet</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
