'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'

export default function ArticleUploadForm() {
	const [loading, setLoading] = useState(false)
	const formRef = useRef<HTMLFormElement>(null)
	const router = useRouter()
	const supabase = createClient()

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		try {
			setLoading(true)

			const formData = new FormData(e.currentTarget)
			const title = formData.get('title') as string
			const abstract = formData.get('abstract') as string
			const keywords = formData.get('keywords') as string
			const category = formData.get('category') as string
			const file = formData.get('file') as File

			// Kullanıcı bilgisini al
			const {
				data: { user }
			} = await supabase.auth.getUser()

			if (!user) {
				toast.error('Oturum bulunamadı', 'Lütfen tekrar giriş yapın.')
				return
			}

			// Dosyayı Supabase Storage'a yükle
			let fileUrl = null
			if (file && file.size > 0) {
				const fileExt = file.name.split('.').pop()
				const fileName = `${user.id}/${Date.now()}.${fileExt}`
				const { error: uploadError } = await supabase.storage
					.from('articles')
					.upload(fileName, file)

				if (uploadError) {
					throw uploadError
				}

				// Dosya URL'sini al
				const {
					data: { publicUrl }
				} = supabase.storage.from('articles').getPublicUrl(fileName)
				fileUrl = publicUrl
			}

			// Makaleyi veritabanına kaydet
			const { error: insertError } = await supabase
				.from('articles')
				.insert({
					title,
					abstract,
					keywords: keywords.split(',').map((k) => k.trim()),
					category,
					file_url: fileUrl,
					author_id: user.id,
					status: 'submitted'
				})
				.select()
				.single()

			if (insertError) {
				throw insertError
			}

			// Formu temizle
			formRef.current?.reset()

			toast.success('Başarılı!', 'Makaleniz başarıyla yüklendi.')
			setTimeout(() => {
				router.push('/dashboard')
				router.refresh()
			}, 1500)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Makale yüklenirken bir hata oluştu'
			toast.error('Hata!', message)
			console.error('Upload error:', err)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Yeni Makale Yükle</CardTitle>
				<CardDescription>Makalenizi sisteme yüklemek için aşağıdaki formu doldurun</CardDescription>
			</CardHeader>
			<CardContent>
				<form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="title">Makale Başlığı *</Label>
						<Input id="title" name="title" placeholder="Makale başlığını girin" required />
					</div>

					<div className="space-y-2">
						<Label htmlFor="abstract">Özet *</Label>
						<Textarea
							id="abstract"
							name="abstract"
							placeholder="Makalenizin özetini girin (minimum 100 karakter)"
							rows={6}
							required
							minLength={100}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="keywords">Anahtar Kelimeler *</Label>
						<Input
							id="keywords"
							name="keywords"
							placeholder="Anahtar kelimeleri virgülle ayırarak girin (örn: makine öğrenmesi, yapay zeka, derin öğrenme)"
							required
						/>
						<p className="text-sm text-muted-foreground">Virgülle ayırarak en az 3, en fazla 6 anahtar kelime girin</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">Kategori *</Label>
						<Select name="category" required>
							<SelectTrigger>
								<SelectValue placeholder="Kategori seçin" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="computer-science">Bilgisayar Bilimleri</SelectItem>
								<SelectItem value="engineering">Mühendislik</SelectItem>
								<SelectItem value="mathematics">Matematik</SelectItem>
								<SelectItem value="physics">Fizik</SelectItem>
								<SelectItem value="chemistry">Kimya</SelectItem>
								<SelectItem value="biology">Biyoloji</SelectItem>
								<SelectItem value="medicine">Tıp</SelectItem>
								<SelectItem value="social-sciences">Sosyal Bilimler</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="file">Makale Dosyası *</Label>
						<Input id="file" name="file" type="file" accept=".pdf,.doc,.docx" required />
						<p className="text-sm text-muted-foreground">PDF veya Word formatında yükleyebilirsiniz (Max: 10MB)</p>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Yükleniyor...' : 'Makaleyi Yükle'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
