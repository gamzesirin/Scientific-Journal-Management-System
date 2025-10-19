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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/lib/toast'
import { X, UserPlus } from 'lucide-react'

export default function ArticleUploadForm() {
	const [loading, setLoading] = useState(false)
	const [coauthors, setCoauthors] = useState<Array<{ email: string; name: string; affiliation?: string }>>([])
	const [coauthorEmail, setCoauthorEmail] = useState('')
	const [coauthorName, setCoauthorName] = useState('')
	const [coauthorAffiliation, setCoauthorAffiliation] = useState('')
	const formRef = useRef<HTMLFormElement>(null)
	const router = useRouter()
	const supabase = createClient()

	// Ortak yazar ekle
	const handleAddCoauthor = () => {
		if (!coauthorEmail.trim() || !coauthorName.trim()) {
			toast.error('E-posta ve isim gerekli')
			return
		}

		// Email format kontrolü
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(coauthorEmail)) {
			toast.error('Geçerli bir e-posta adresi girin')
			return
		}

		// Aynı email zaten eklenmişse
		if (coauthors.some((c) => c.email === coauthorEmail)) {
			toast.error('Bu e-posta zaten eklenmiş')
			return
		}

		setCoauthors([...coauthors, { email: coauthorEmail, name: coauthorName, affiliation: coauthorAffiliation }])
		setCoauthorEmail('')
		setCoauthorName('')
		setCoauthorAffiliation('')
		toast.success('Ortak yazar eklendi')
	}

	// Ortak yazar çıkar
	const handleRemoveCoauthor = (email: string) => {
		setCoauthors(coauthors.filter((c) => c.email !== email))
		toast.success('Ortak yazar kaldırıldı')
	}

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
				const { error: uploadError } = await supabase.storage.from('articles').upload(fileName, file)

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
			const { data: newArticle, error: insertError } = await supabase
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

			// Ortak yazarları ekle (varsa)
			if (coauthors.length > 0 && newArticle?.id) {
				for (const coauthor of coauthors) {
					try {
						const response = await fetch(`/api/articles/${newArticle.id}/coauthors`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(coauthor)
						})

						if (!response.ok) {
							const error = await response.json()
							console.error('Ortak yazar eklenirken hata:', coauthor.email, error)
							// Hata olsa bile devam et, diğer ortak yazarları eklemeyi dene
						}
					} catch (err) {
						console.error('Ortak yazar eklenirken hata:', err)
						// Hata olsa bile devam et
					}
				}
			}

			// Formu temizle
			formRef.current?.reset()
			setCoauthors([])

			toast.success('Başarılı!', 'Makaleniz ve ortak yazarlar başarıyla yüklendi.')
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

					<Separator className="my-6" />

					{/* Ortak Yazar Ekleme */}
					<div className="space-y-4">
						<div>
							<Label className="text-base font-semibold flex items-center gap-2">
								<UserPlus className="h-4 w-4" />
								Ortak Yazarlar (Opsiyonel)
							</Label>
							<p className="text-sm text-muted-foreground mt-1">
								Makaleye katkıda bulunan diğer yazarları ekleyebilirsiniz
							</p>
						</div>

						{/* Ortak Yazar Formu */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label htmlFor="coauthor-email" className="text-xs">
									E-posta
								</Label>
								<Input
									id="coauthor-email"
									type="email"
									placeholder="ornek@email.com"
									value={coauthorEmail}
									onChange={(e) => setCoauthorEmail(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleAddCoauthor()
										}
									}}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="coauthor-name" className="text-xs">
									İsim Soyisim
								</Label>
								<Input
									id="coauthor-name"
									placeholder="Ad Soyad"
									value={coauthorName}
									onChange={(e) => setCoauthorName(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleAddCoauthor()
										}
									}}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="coauthor-affiliation" className="text-xs">
									Kurum (Opsiyonel)
								</Label>
								<Input
									id="coauthor-affiliation"
									placeholder="Üniversite/Kurum"
									value={coauthorAffiliation}
									onChange={(e) => setCoauthorAffiliation(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleAddCoauthor()
										}
									}}
								/>
							</div>
						</div>
						<Button type="button" variant="outline" onClick={handleAddCoauthor} className="w-full md:w-auto">
							<UserPlus className="h-4 w-4 mr-2" />
							Ortak Yazar Ekle
						</Button>

						{/* Eklenen Ortak Yazarlar Listesi */}
						{coauthors.length > 0 && (
							<div className="space-y-2">
								<Label className="text-sm font-medium">Eklenen Ortak Yazarlar ({coauthors.length})</Label>
								<div className="space-y-2">
									{coauthors.map((coauthor, index) => (
										<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
											<div className="flex-1">
												<p className="font-medium text-sm">{coauthor.name}</p>
												<p className="text-xs text-gray-600">{coauthor.email}</p>
												{coauthor.affiliation && <p className="text-xs text-gray-500">{coauthor.affiliation}</p>}
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleRemoveCoauthor(coauthor.email)}
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<Separator className="my-6" />

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Yükleniyor...' : 'Makaleyi Yükle'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
