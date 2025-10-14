'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { Upload, Download, FileText, Trash2, FileCheck, Sparkles } from 'lucide-react'

interface CVUploadSectionProps {
	userId: string
	currentCvUrl?: string | null
}

export default function CVUploadSection({ userId, currentCvUrl }: CVUploadSectionProps) {
	const [file, setFile] = useState<File | null>(null)
	const [cvUrl, setCvUrl] = useState<string | null>(currentCvUrl || null)
	const [isUploading, setIsUploading] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const supabase = createClient()

	// CV URL'sini Supabase'den çek (tab değişimi sorununu çözer)
	useEffect(() => {
		const fetchCvUrl = async () => {
			setIsLoading(true)
			try {
				const { data, error } = await supabase.from('users').select('cv_file_url').eq('id', userId).single()

				if (!error && data) {
					setCvUrl(data.cv_file_url)
				}
			} catch (error) {
				console.error('Error fetching CV URL:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchCvUrl()
	}, [userId, supabase])

	// Prop değişimlerini de dinle
	useEffect(() => {
		if (currentCvUrl !== undefined) {
			setCvUrl(currentCvUrl)
		}
	}, [currentCvUrl])

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			// Validate file type
			const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
			if (!validTypes.includes(selectedFile.type)) {
				toast.error('Geçersiz dosya formatı', 'Sadece PDF veya DOCX formatında dosya yükleyebilirsiniz.')
				e.target.value = ''
				return
			}

			// Validate file size (max 5MB)
			if (selectedFile.size > 5 * 1024 * 1024) {
				toast.error('Dosya çok büyük', 'Dosya boyutu en fazla 5MB olabilir.')
				e.target.value = ''
				return
			}

			setFile(selectedFile)
			toast.info('Dosya seçildi', `${selectedFile.name} yüklenmeye hazır`)
		}
	}

	const handleUpload = async () => {
		if (!file) {
			toast.error('Dosya seçilmedi', 'Lütfen önce bir dosya seçin.')
			return
		}

		setIsUploading(true)
		const toastId = toast.loading('Özgeçmiş yükleniyor...')

		try {
			// Eski dosyayı sil
			if (cvUrl) {
				const oldFileName = cvUrl.split('/').pop()?.split('?')[0]
				if (oldFileName) {
					const oldPath = `${userId}/${oldFileName}`
					await supabase.storage.from('cvs').remove([oldPath])
				}
			}

			// Yeni dosyayı yükle
			const fileExt = file.name.split('.').pop()
			const fileName = `cv_${Date.now()}.${fileExt}`
			const filePath = `${userId}/${fileName}`

			const { error: uploadError } = await supabase.storage.from('cvs').upload(filePath, file, {
				cacheControl: '3600',
				upsert: true
			})

			if (uploadError) throw uploadError

			// Public URL al
			const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(filePath)

			// Kullanıcı tablosunu güncelle
			const { error: updateError } = await supabase
				.from('users')
				.update({ cv_file_url: urlData.publicUrl })
				.eq('id', userId)

			if (updateError) throw updateError

			setCvUrl(urlData.publicUrl)
			setFile(null)

			// Input'u temizle
			const fileInput = document.getElementById('cv-upload') as HTMLInputElement
			if (fileInput) fileInput.value = ''

			// Başarı mesajı
			toast.update(toastId, 'Özgeçmiş başarıyla yüklendi!', 'success')
		} catch (error: any) {
			console.error('CV upload error:', error)
			toast.update(toastId, 'Yükleme başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'Dosya yüklenirken bir hata oluştu.')
		} finally {
			setIsUploading(false)
		}
	}

	const handleDelete = async () => {
		if (!cvUrl) return

		setIsDeleting(true)
		const toastId = toast.loading('Özgeçmiş siliniyor...')

		try {
			// Storage'dan sil
			const fileName = cvUrl.split('/').pop()?.split('?')[0]
			if (fileName) {
				const filePath = `${userId}/${fileName}`
				const { error: deleteError } = await supabase.storage.from('cvs').remove([filePath])
				if (deleteError) throw deleteError
			}

			// Kullanıcı tablosunu güncelle
			const { error: updateError } = await supabase.from('users').update({ cv_file_url: null }).eq('id', userId)

			if (updateError) throw updateError

			setCvUrl(null)
			toast.update(toastId, 'Özgeçmiş başarıyla silindi!', 'success')
		} catch (error: any) {
			console.error('CV delete error:', error)
			toast.update(toastId, 'Silme başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'Dosya silinirken bir hata oluştu.')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleDownload = async () => {
		if (!cvUrl) return

		const toastId = toast.loading('Özgeçmiş indiriliyor...')

		try {
			const fileName = cvUrl.split('/').pop()?.split('?')[0] || 'cv'
			const filePath = `${userId}/${fileName}`

			const { data, error } = await supabase.storage.from('cvs').download(filePath)

			if (error) throw error

			// Create blob URL and trigger download
			const url = window.URL.createObjectURL(data)
			const a = document.createElement('a')
			a.href = url
			a.download = fileName
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)

			toast.update(toastId, 'Özgeçmiş indirildi!', 'success')
		} catch (error: any) {
			console.error('CV download error:', error)
			toast.update(toastId, 'İndirme başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'Dosya indirilirken bir hata oluştu.')
		}
	}

	return (
		<Card className="border-2 border-blue-100">
			<CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
				<CardTitle className="flex items-center gap-2 text-blue-900">
					<Sparkles className="h-5 w-5 text-blue-600" />
					Özgeçmiş (CV)
				</CardTitle>
				<CardDescription className="text-blue-700">
					Özgeçmişinizi yükleyin. Bu, AI tabanlı hakem-makale eşleştirmesi için kullanılacaktır. (PDF veya DOCX,
					maksimum 5MB)
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6 pt-6">
				{isLoading ? (
					<div className="space-y-4">
						<div className="animate-pulse">
							<div className="h-32 bg-gray-200 rounded-xl"></div>
						</div>
						<div className="animate-pulse">
							<div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
						</div>
					</div>
				) : cvUrl ? (
					<div className="space-y-6">
						{/* Modern Success Card */}
						<div className="relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-sm">
							<div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16"></div>
							<div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/20 rounded-full -ml-12 -mb-12"></div>

							<div className="relative flex items-start justify-between">
								<div className="flex items-start gap-4">
									<div className="p-3 bg-green-600 rounded-xl shadow-lg">
										<FileCheck className="h-7 w-7 text-white" />
									</div>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<p className="font-bold text-green-900 text-lg">Özgeçmiş Yüklendi</p>
											<span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
												Aktif
											</span>
										</div>
										<p className="text-sm text-green-700 font-medium">
											{cvUrl.split('/').pop()?.split('?')[0] || 'cv'}
										</p>
										<p className="text-xs text-green-600 flex items-center gap-1 mt-2">
											<Sparkles className="h-3 w-3" />
											AI eşleştirme için hazır
										</p>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Button
										onClick={handleDownload}
										variant="outline"
										size="sm"
										className="bg-white hover:bg-green-50 border-green-300"
									>
										<Download className="h-4 w-4 mr-2" />
										İndir
									</Button>
									<Button onClick={handleDelete} variant="destructive" size="sm" disabled={isDeleting}>
										<Trash2 className="h-4 w-4 mr-2" />
										{isDeleting ? 'Siliniyor...' : 'Sil'}
									</Button>
								</div>
							</div>
						</div>

						{/* Update Section */}
						<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
							<p className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
								<Upload className="h-4 w-4" />
								Yeni bir özgeçmiş yüklemek için:
							</p>
							<div className="space-y-4">
								<div>
									<Label htmlFor="cv-upload" className="text-gray-700 font-medium">
										Yeni Dosya Seç
									</Label>
									<Input
										id="cv-upload"
										type="file"
										accept=".pdf,.docx"
										onChange={handleFileChange}
										disabled={isUploading}
										className="mt-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
									/>
								</div>
								{file && (
									<div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
										<FileText className="h-5 w-5 text-blue-600" />
										<div className="flex-1">
											<p className="text-sm font-medium text-blue-900">{file.name}</p>
											<p className="text-xs text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
										</div>
									</div>
								)}
								<Button
									onClick={handleUpload}
									disabled={!file || isUploading}
									className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
								>
									<Upload className="h-4 w-4 mr-2" />
									{isUploading ? 'Yükleniyor...' : 'Güncelle'}
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						{/* Empty State - Modern Upload Area */}
						<div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all">
							<div className="flex flex-col items-center gap-4">
								<div className="p-4 bg-blue-100 rounded-full">
									<Upload className="h-8 w-8 text-blue-600" />
								</div>
								<div>
									<Label htmlFor="cv-upload" className="text-lg font-semibold text-gray-900 cursor-pointer">
										Özgeçmiş Dosyası Seç
									</Label>
									<p className="text-sm text-gray-600 mt-1">PDF veya DOCX formatında, maksimum 5MB</p>
								</div>
								<Input
									id="cv-upload"
									type="file"
									accept=".pdf,.docx"
									onChange={handleFileChange}
									disabled={isUploading}
									className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
								/>
							</div>
						</div>

						{file && (
							<div className="space-y-4">
								<div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
									<div className="p-2 bg-blue-600 rounded-lg">
										<FileText className="h-5 w-5 text-white" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-blue-900">{file.name}</p>
										<p className="text-sm text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
									</div>
								</div>
								<Button
									onClick={handleUpload}
									disabled={!file || isUploading}
									className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6"
									size="lg"
								>
									<Upload className="h-5 w-5 mr-2" />
									{isUploading ? 'Yükleniyor...' : 'Özgeçmişi Yükle'}
								</Button>
							</div>
						)}
					</div>
				)}

				{/* Info Box */}
				<div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
					<div className="flex items-start gap-3">
						<Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
						<div className="space-y-1">
							<p className="text-sm font-semibold text-blue-900">AI Destekli Eşleştirme</p>
							<p className="text-xs text-blue-700">
								Özgeçmişiniz, yapay zeka tarafından uzmanlık alanlarınızı belirlemek ve size uygun makaleleri atamak
								için kullanılacaktır.
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
