import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { PDFDownloadSection } from '@/components/common/pdf-download-section'

type Props = {
	params: Promise<{
		id: string
	}>
}

const statusColors: Record<string, string> = {
	submitted: 'bg-blue-500',
	under_review: 'bg-yellow-500',
	revision_requested: 'bg-orange-500',
	accepted: 'bg-green-500',
	rejected: 'bg-red-500',
	published: 'bg-purple-500'
}

const statusLabels: Record<string, string> = {
	submitted: 'Gönderildi',
	under_review: 'İnceleme Altında',
	revision_requested: 'Revizyon İstendi',
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

	// Get decision to correct article status
	const { data: decision } = await supabase
		.from('decisions')
		.select('decision_type, status')
		.eq('article_id', resolvedParams.id)
		.eq('status', 'final')
		.single()

	// Correct article status based on decision
	let correctedArticle = { ...article }
	if (decision) {
		if (decision.decision_type === 'revision' && article.status === 'under_review') {
			correctedArticle.status = 'revision_requested'
		} else if (decision.decision_type === 'accept' && article.status !== 'accepted' && article.status !== 'published') {
			correctedArticle.status = 'accepted'
		} else if (decision.decision_type === 'reject' && article.status !== 'rejected') {
			correctedArticle.status = 'rejected'
		}
	}

	// Kullanıcı rolünü al
	const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

	// Makale yazarının bilgilerini al
	const { data: authorData } = await supabase.from('users').select('name, email').eq('id', article.author_id).single()

	const userRole = userData?.role || 'author'

	// Dosya URL'sinden gerçek dosya adını çıkar
	const getFileNameFromUrl = (url: string) => {
		try {
			const urlObj = new URL(url)
			const pathParts = urlObj.pathname.split('/')
			return decodeURIComponent(pathParts[pathParts.length - 1])
		} catch {
			return 'makale.pdf'
		}
	}

	const actualFileName = correctedArticle.file_url ? getFileNameFromUrl(correctedArticle.file_url) : 'makale.pdf'

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
							<CardTitle className="text-3xl mb-2">{correctedArticle.title}</CardTitle>
							<CardDescription className="text-base">
								Yazar: {authorData?.name || 'Bilinmiyor'} ({authorData?.email || ''})
							</CardDescription>
						</div>
						<Badge className={`${statusColors[correctedArticle.status]} text-white`}>
							{statusLabels[correctedArticle.status] || correctedArticle.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-2">Özet</h3>
						<p className="text-muted-foreground leading-relaxed">{correctedArticle.abstract}</p>
					</div>

					<Separator />

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h3 className="text-sm font-semibold mb-2">Kategori</h3>
							<Badge variant="outline">{correctedArticle.category}</Badge>
						</div>
						<div>
							<h3 className="text-sm font-semibold mb-2">Anahtar Kelimeler</h3>
							<div className="flex flex-wrap gap-2">
								{Array.isArray(correctedArticle.keywords) ? (
									correctedArticle.keywords.map((keyword: string, index: number) => (
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
							<p className="text-muted-foreground">{new Date(correctedArticle.created_at).toLocaleDateString('tr-TR')}</p>
						</div>
						<div>
							<h3 className="text-sm font-semibold mb-2">Son Güncelleme</h3>
							<p className="text-muted-foreground">{new Date(correctedArticle.updated_at).toLocaleDateString('tr-TR')}</p>
						</div>
					</div>

					{correctedArticle.file_url && (
						<>
							<Separator />
							<div>
								<h3 className="text-sm font-semibold mb-2">Makale Dosyası</h3>
								<PDFDownloadSection fileUrl={correctedArticle.file_url} fileName={actualFileName} />
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
