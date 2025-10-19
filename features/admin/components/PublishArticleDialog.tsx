'use client'

import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Article, ArticleType } from '@/features/articles/types/article.types'
import { Sparkles, BookOpen, FileText, Calendar, Hash } from 'lucide-react'

interface PublishArticleDialogProps {
	article: Article
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

interface PublicationForm {
	volume: string
	issue: string
	start_page: string
	end_page: string
	article_type: ArticleType
	published_date: string
}

export default function PublishArticleDialog({ article, open, onOpenChange, onSuccess }: PublishArticleDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [generatedDOI, setGeneratedDOI] = useState<string>('')
	const [form, setForm] = useState<PublicationForm>({
		volume: '',
		issue: '',
		start_page: '',
		end_page: '',
		article_type: 'research',
		published_date: new Date().toISOString().split('T')[0] // Today's date
	})

	const supabase = createClient()

	// Generate DOI when volume and issue are entered
	useEffect(() => {
		if (form.volume && form.issue && parseInt(form.volume) > 0 && parseInt(form.issue) > 0) {
			fetchNextArticleNumber()
		}
	}, [form.volume, form.issue])

	const fetchNextArticleNumber = async () => {
		try {
			const { data, error } = await supabase.rpc('get_next_article_number', {
				p_volume: parseInt(form.volume),
				p_issue: parseInt(form.issue)
			})

			if (error) throw error

			const nextNumber = data || 1
			const doi = `10.1234/journal.v${form.volume}.i${form.issue}.a${nextNumber}`
			setGeneratedDOI(doi)
		} catch (error) {
			console.error('Error generating DOI:', error)
			setGeneratedDOI(`10.1234/journal.v${form.volume}.i${form.issue}.a1`)
		}
	}

	const handleInputChange = (field: keyof PublicationForm, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	const validateForm = (): boolean => {
		if (!form.volume || parseInt(form.volume) <= 0) {
			toast.error('Geçersiz Cilt', 'Lütfen geçerli bir cilt numarası girin')
			return false
		}
		if (!form.issue || parseInt(form.issue) <= 0) {
			toast.error('Geçersiz Sayı', 'Lütfen geçerli bir sayı numarası girin')
			return false
		}
		if (!form.start_page || parseInt(form.start_page) <= 0) {
			toast.error('Geçersiz Sayfa', 'Lütfen başlangıç sayfası girin')
			return false
		}
		if (!form.end_page || parseInt(form.end_page) <= 0) {
			toast.error('Geçersiz Sayfa', 'Lütfen bitiş sayfası girin')
			return false
		}
		if (parseInt(form.end_page) < parseInt(form.start_page)) {
			toast.error('Sayfa Hatası', 'Bitiş sayfası başlangıç sayfasından küçük olamaz')
			return false
		}
		if (!form.published_date) {
			toast.error('Tarih Eksik', 'Lütfen yayın tarihini seçin')
			return false
		}
		return true
	}

	const handlePublish = async () => {
		if (!validateForm()) return

		setIsSubmitting(true)
		const toastId = toast.loading('Makale yayınlanıyor...')

		try {
			// Update article with publication metadata
			const { error: updateError } = await supabase
				.from('articles')
				.update({
					status: 'published',
					doi: generatedDOI,
					volume: parseInt(form.volume),
					issue: parseInt(form.issue),
					start_page: parseInt(form.start_page),
					end_page: parseInt(form.end_page),
					article_type: form.article_type,
					published_date: form.published_date,
					updated_at: new Date().toISOString()
				})
				.eq('id', article.id)

			if (updateError) throw updateError

			toast.success('Makale Yayınlandı! 🎉', {
				description: `DOI: ${generatedDOI}`,
				id: toastId
			})

			onSuccess()
			onOpenChange(false)

			// Reset form
			setForm({
				volume: '',
				issue: '',
				start_page: '',
				end_page: '',
				article_type: 'research',
				published_date: new Date().toISOString().split('T')[0]
			})
			setGeneratedDOI('')
		} catch (error: any) {
			console.error('Publish error:', error)
			toast.error('Yayınlama Başarısız', {
				description: error.message || 'Makale yayınlanırken bir hata oluştu',
				id: toastId
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<Sparkles className="h-6 w-6 text-green-600" />
						Makaleyi Yayınla
					</DialogTitle>
					<DialogDescription className="text-base">
						Bu makaleyi yayınlamak için gerekli bilgileri girin. DOI otomatik olarak oluşturulacaktır.
					</DialogDescription>
				</DialogHeader>

				{/* Article Info */}
				<div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-4 space-y-2">
					<h3 className="font-semibold text-blue-900 flex items-center gap-2">
						<BookOpen className="h-4 w-4" />
						{article.title}
					</h3>
					<p className="text-sm text-blue-700">
						<span className="font-medium">Yazar:</span> {article.author?.name || article.users?.name || 'Bilinmiyor'}
					</p>
					<p className="text-sm text-blue-700">
						<span className="font-medium">Mevcut Durum:</span>{' '}
						<span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs">{article.status}</span>
					</p>
				</div>

				<div className="space-y-6 py-4">
					{/* Volume and Issue */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="volume" className="text-sm font-semibold flex items-center gap-2">
								<FileText className="h-4 w-4" />
								Cilt (Volume) *
							</Label>
							<Input
								id="volume"
								type="number"
								min="1"
								placeholder="örn: 5"
								value={form.volume}
								onChange={(e) => handleInputChange('volume', e.target.value)}
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="issue" className="text-sm font-semibold flex items-center gap-2">
								<Hash className="h-4 w-4" />
								Sayı (Issue) *
							</Label>
							<Input
								id="issue"
								type="number"
								min="1"
								placeholder="örn: 2"
								value={form.issue}
								onChange={(e) => handleInputChange('issue', e.target.value)}
								disabled={isSubmitting}
							/>
						</div>
					</div>

					{/* Generated DOI Preview */}
					{generatedDOI && (
						<div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
							<Label className="text-sm font-semibold text-green-900">Oluşturulan DOI:</Label>
							<p className="text-green-700 font-mono font-medium mt-1">{generatedDOI}</p>
						</div>
					)}

					{/* Page Numbers */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start_page" className="text-sm font-semibold">
								Başlangıç Sayfası *
							</Label>
							<Input
								id="start_page"
								type="number"
								min="1"
								placeholder="örn: 45"
								value={form.start_page}
								onChange={(e) => handleInputChange('start_page', e.target.value)}
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="end_page" className="text-sm font-semibold">
								Bitiş Sayfası *
							</Label>
							<Input
								id="end_page"
								type="number"
								min="1"
								placeholder="örn: 58"
								value={form.end_page}
								onChange={(e) => handleInputChange('end_page', e.target.value)}
								disabled={isSubmitting}
							/>
						</div>
					</div>

					{/* Article Type */}
					<div className="space-y-2">
						<Label htmlFor="article_type" className="text-sm font-semibold">
							Makale Türü *
						</Label>
						<Select
							value={form.article_type}
							onValueChange={(value) => handleInputChange('article_type', value as ArticleType)}
							disabled={isSubmitting}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="research">Araştırma Makalesi (Research Article)</SelectItem>
								<SelectItem value="review">Derleme (Review)</SelectItem>
								<SelectItem value="case_study">Vaka Çalışması (Case Study)</SelectItem>
								<SelectItem value="technical_note">Teknik Not (Technical Note)</SelectItem>
								<SelectItem value="editorial">Editörden (Editorial)</SelectItem>
								<SelectItem value="letter">Mektup (Letter)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Publication Date */}
					<div className="space-y-2">
						<Label htmlFor="published_date" className="text-sm font-semibold flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							Yayın Tarihi *
						</Label>
						<Input
							id="published_date"
							type="date"
							value={form.published_date}
							onChange={(e) => handleInputChange('published_date', e.target.value)}
							disabled={isSubmitting}
							max={new Date().toISOString().split('T')[0]}
						/>
					</div>

					{/* Info Alert */}
					<div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-900">
							<span className="font-semibold">⚠️ Uyarı:</span> Yayınlandıktan sonra makale herkes tarafından görülebilir
							hale gelecektir. Bu işlem geri alınamaz.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
						İptal
					</Button>
					<Button
						onClick={handlePublish}
						disabled={isSubmitting || !generatedDOI}
						className="bg-green-600 hover:bg-green-700"
					>
						{isSubmitting ? 'Yayınlanıyor...' : 'Yayınla'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
