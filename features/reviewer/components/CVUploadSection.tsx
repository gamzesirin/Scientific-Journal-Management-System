'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { Upload, Download, FileText, Trash2, FileCheck, Sparkles, History, RotateCcw, Clock } from 'lucide-react'

interface CVRecord {
	id: string
	file_url: string
	file_name: string
	file_size: number
	uploaded_at: string
	is_active: boolean
}

interface CVUploadSectionProps {
	userId: string
}

export default function CVUploadSection({ userId }: CVUploadSectionProps) {
	const [file, setFile] = useState<File | null>(null)
	const [activeCv, setActiveCv] = useState<CVRecord | null>(null)
	const [cvHistory, setCvHistory] = useState<CVRecord[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const supabase = createClient()

	// CV kayıtlarını Supabase'den çek
	useEffect(() => {
		const fetchCvData = async () => {
			setIsLoading(true)
			try {
				// Aktif CV'yi çek
				const { data: activeData, error: activeError } = await supabase
					.from('reviewer_cvs')
					.select('*')
					.eq('user_id', userId)
					.eq('is_active', true)
					.order('uploaded_at', { ascending: false })
					.limit(1)
					.maybeSingle()

				if (!activeError && activeData) {
					setActiveCv(activeData)
				} else {
					setActiveCv(null)
				}

				// CV geçmişini çek (is_active=false olanlar)
				const { data: historyData, error: historyError } = await supabase
					.from('reviewer_cvs')
					.select('*')
					.eq('user_id', userId)
					.eq('is_active', false)
					.order('uploaded_at', { ascending: false })

				if (!historyError && historyData) {
					setCvHistory(historyData)
				}
			} catch (error) {
				console.error('Error fetching CV data:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchCvData()
	}, [userId, supabase])

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
			// Yeni dosyayı yükle
			const fileExt = file.name.split('.').pop()
			const fileName = `cv_${Date.now()}.${fileExt}`
			const filePath = `${userId}/${fileName}`

			const { error: uploadError } = await supabase.storage.from('cvs').upload(filePath, file, {
				cacheControl: '3600',
				upsert: false // Her zaman yeni dosya oluştur
			})

			if (uploadError) throw uploadError

			// Public URL al
			const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(filePath)

			// Önceki tüm CV'leri is_active=false yap
			const { error: deactivateError } = await supabase
				.from('reviewer_cvs')
				.update({ is_active: false })
				.eq('user_id', userId)
				.eq('is_active', true)

			if (deactivateError) throw deactivateError

			// Yeni CV kaydı oluştur
			const { data: newCvData, error: insertError } = await supabase
				.from('reviewer_cvs')
				.insert({
					user_id: userId,
					file_url: urlData.publicUrl,
					file_name: fileName,
					file_size: file.size,
					is_active: true
				})
				.select()
				.single()

			if (insertError) throw insertError

			// Geriye dönük uyumluluk için users tablosunu da güncelle
			await supabase.from('users').update({ cv_file_url: urlData.publicUrl }).eq('id', userId)

			// State'i güncelle
			if (activeCv) {
				setCvHistory([activeCv, ...cvHistory])
			}
			setActiveCv(newCvData)
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
		if (!activeCv) return

		setIsDeleting(true)
		const toastId = toast.loading('Özgeçmiş deaktive ediliyor...')

		try {
			// CV'yi deaktive et (silme, geçmişte tut)
			const { error: updateError } = await supabase
				.from('reviewer_cvs')
				.update({ is_active: false })
				.eq('id', activeCv.id)

			if (updateError) throw updateError

			// Geriye dönük uyumluluk için users tablosunu da güncelle
			await supabase.from('users').update({ cv_file_url: null }).eq('id', userId)

			// State'i güncelle
			setCvHistory([activeCv, ...cvHistory])
			setActiveCv(null)

			toast.update(toastId, 'Özgeçmiş kaldırıldı! Geçmişte saklandı.', 'success')
		} catch (error: any) {
			console.error('CV deactivate error:', error)
			toast.update(toastId, 'İşlem başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'CV kaldırılırken bir hata oluştu.')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleRestoreCv = async (cvRecord: CVRecord) => {
		const toastId = toast.loading('Özgeçmiş geri yükleniyor...')

		try {
			// Önceki aktif CV'yi deaktive et
			if (activeCv) {
				await supabase.from('reviewer_cvs').update({ is_active: false }).eq('id', activeCv.id)
			}

			// Seçilen CV'yi aktif yap
			const { error: updateError } = await supabase
				.from('reviewer_cvs')
				.update({ is_active: true })
				.eq('id', cvRecord.id)

			if (updateError) throw updateError

			// Geriye dönük uyumluluk için users tablosunu da güncelle
			await supabase.from('users').update({ cv_file_url: cvRecord.file_url }).eq('id', userId)

			// State'i güncelle
			if (activeCv) {
				setCvHistory([activeCv, ...cvHistory.filter((cv) => cv.id !== cvRecord.id)])
			} else {
				setCvHistory(cvHistory.filter((cv) => cv.id !== cvRecord.id))
			}
			setActiveCv(cvRecord)

			toast.update(toastId, 'Özgeçmiş geri yüklendi!', 'success')
		} catch (error: any) {
			console.error('CV restore error:', error)
			toast.update(toastId, 'Geri yükleme başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'CV geri yüklenirken bir hata oluştu.')
		}
	}

	const handleDownload = async (cvRecord: CVRecord) => {
		const toastId = toast.loading('Özgeçmiş indiriliyor...')

		try {
			const filePath = `${userId}/${cvRecord.file_name}`

			// Try to get a signed URL first for better compatibility
			const { data: signedUrlData, error: signedError } = await supabase.storage
				.from('cvs')
				.createSignedUrl(filePath, 60) // 60 seconds expiry

			if (signedError) {
				console.error('Signed URL error, trying direct download:', signedError)
				// Fallback to direct download
				const { data, error } = await supabase.storage.from('cvs').download(filePath)

				if (error) throw error

				// Create blob URL and trigger download
				const url = window.URL.createObjectURL(data)
				const a = document.createElement('a')
				a.href = url
				a.download = cvRecord.file_name
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			} else {
				// Use signed URL to download
				const response = await fetch(signedUrlData.signedUrl)
				if (!response.ok) throw new Error('Failed to fetch file')

				const blob = await response.blob()
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = cvRecord.file_name
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			}

			toast.update(toastId, 'Özgeçmiş indirildi!', 'success')
		} catch (error: any) {
			console.error('CV download error:', error)
			toast.update(toastId, 'İndirme başarısız', 'error')
			toast.error('Hata oluştu', error.message || 'Dosya indirilirken bir hata oluştu.')
		}
	}

	return (
		<div className="space-y-6">
			{/* Aktif CV Gösterimi - Üst Kısımda Ayrı */}
			{isLoading ? (
				<div className="animate-pulse">
					<div className="h-32 bg-gray-200 rounded-xl"></div>
				</div>
			) : (
				activeCv && (
					<div className="relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-md">
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
										<span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">Aktif</span>
									</div>
									<p className="text-sm text-green-700 font-medium">{activeCv.file_name}</p>
									<p className="text-xs text-green-600">
										{(activeCv.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
										{new Date(activeCv.uploaded_at).toLocaleDateString('tr-TR', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
									</p>
									<p className="text-xs text-green-600 flex items-center gap-1 mt-2">
										<Sparkles className="h-3 w-3" />
										AI eşleştirme için hazır
									</p>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Button
									onClick={() => handleDownload(activeCv)}
									variant="outline"
									size="sm"
									className="bg-white hover:bg-green-50 border-green-300"
								>
									<Download className="h-4 w-4 mr-2" />
									İndir
								</Button>
								<Button onClick={handleDelete} variant="destructive" size="sm" disabled={isDeleting}>
									<Trash2 className="h-4 w-4 mr-2" />
									{isDeleting ? 'Kaldır' : 'Kaldır'}
								</Button>
							</div>
						</div>
					</div>
				)
			)}

			{/* Yükleme Kartı - Alt Kısımda Ayrı */}
			<Card className="border-2 border-blue-100">
				<CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
					<CardTitle className="flex items-center gap-2 text-blue-900">
						<Sparkles className="h-5 w-5 text-blue-600" />
						{activeCv ? 'Özgeçmişi Güncelle' : 'Özgeçmiş (CV)'}
					</CardTitle>
					<CardDescription className="text-blue-700">
						{activeCv
							? 'Yeni bir özgeçmiş yükleyerek mevcut özgeçmişinizi güncelleyebilirsiniz.'
							: 'Özgeçmişinizi yükleyin. Bu, AI tabanlı hakem-makale eşleştirmesi için kullanılacaktır. (PDF veya DOCX, maksimum 5MB)'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 pt-6">
					{isLoading ? (
						<div className="animate-pulse">
							<div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
						</div>
					) : (
						<div className="space-y-6">
							{/* Yükleme Alanı */}
							<div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all">
								<div className="flex flex-col items-center gap-4">
									<div className="p-4 bg-blue-100 rounded-full">
										<Upload className="h-8 w-8 text-blue-600" />
									</div>
									<div>
										<Label htmlFor="cv-upload" className="text-lg font-semibold text-gray-900 cursor-pointer">
											{activeCv ? 'Yeni Dosya Seç' : 'Özgeçmiş Dosyası Seç'}
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
										{isUploading ? 'Yükleniyor...' : activeCv ? 'Güncelle' : 'Özgeçmişi Yükle'}
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

			{/* CV History Section - En Alta Ayrı Card */}
			{cvHistory.length > 0 && (
				<Card className="border-2 border-gray-200">
					<CardHeader>
						<Button
							onClick={() => setShowHistory(!showHistory)}
							variant="ghost"
							className="w-full justify-between hover:bg-gray-50 h-auto p-0"
						>
							<CardTitle className="flex items-center gap-2 text-gray-900">
								<History className="h-5 w-5 text-gray-600" />
								Özgeçmiş Geçmişi ({cvHistory.length})
							</CardTitle>
							<span className="text-sm text-gray-500">{showHistory ? 'Gizle' : 'Göster'}</span>
						</Button>
					</CardHeader>

					{showHistory && (
						<CardContent className="space-y-3 pt-0">
							{cvHistory.map((cv) => (
								<div
									key={cv.id}
									className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
								>
									<div className="flex items-start gap-3 flex-1">
										<div className="p-2 bg-gray-300 rounded-lg">
											<Clock className="h-5 w-5 text-gray-600" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-gray-900">{cv.file_name}</p>
											<p className="text-xs text-gray-600">
												{(cv.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
												{new Date(cv.uploaded_at).toLocaleDateString('tr-TR', {
													day: 'numeric',
													month: 'long',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												})}
											</p>
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={() => handleDownload(cv)}
											variant="outline"
											size="sm"
											className="bg-white hover:bg-gray-50"
										>
											<Download className="h-4 w-4" />
										</Button>
										<Button
											onClick={() => handleRestoreCv(cv)}
											variant="default"
											size="sm"
											className="bg-blue-600 hover:bg-blue-700"
										>
											<RotateCcw className="h-4 w-4 mr-1" />
											Geri Yükle
										</Button>
									</div>
								</div>
							))}
						</CardContent>
					)}
				</Card>
			)}
		</div>
	)
}
