'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadPaperFile } from '@/lib/storage/upload'
import { AlertCircle, Upload, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface RevisionUploadFormProps {
	articleId: string
	userId: string
	currentStatus: string
}

export default function RevisionUploadForm({ articleId, userId, currentStatus }: RevisionUploadFormProps) {
	const router = useRouter()
	const [file, setFile] = useState<File | null>(null)
	const [uploadReason, setUploadReason] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setError(null)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!file) {
			setError('Lütfen bir dosya seçin')
			return
		}

		if (!uploadReason.trim()) {
			setError('Lütfen revizyon sebebini açıklayın')
			return
		}

		setLoading(true)

		try {
			// First, get the next version number
			const versionsResponse = await fetch(`/api/articles/${articleId}/revision`)
			const versionsData = await versionsResponse.json()
			const nextVersionNumber = versionsData.versions?.length ? versionsData.versions.length + 1 : 1

			// Upload file to storage
			const { url, error: uploadError } = await uploadPaperFile(file, userId, articleId, nextVersionNumber)

			if (uploadError || !url) {
				throw new Error(uploadError || 'Dosya yüklenemedi')
			}

			// Save version to database
			const response = await fetch(`/api/articles/${articleId}/revision`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					file_url: url,
					upload_reason: uploadReason,
					file_size: file.size,
					file_type: file.type
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Revizyon kaydedilemedi')
			}

			// Success toast
			toast.success('Revizyon başarıyla yüklendi!')

			// Reset form
			setFile(null)
			setUploadReason('')
			const fileInput = document.getElementById('revision-file') as HTMLInputElement
			if (fileInput) {
				fileInput.value = ''
			}

			// Refresh page
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Bir hata oluştu')
			toast.error(err instanceof Error ? err.message : 'Bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-5 w-5" />
					Revizyon Yükle
				</CardTitle>
				<CardDescription>
					{currentStatus === 'revision_requested'
						? 'Editör veya hakemlerden gelen öneriler doğrultusunda düzeltilmiş makale versiyonunu yükleyin.'
						: 'Makalenizin güncellenmiş bir versiyonunu yükleyebilirsiniz.'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* File Input */}
					<div className="space-y-2">
						<Label htmlFor="revision-file">Revize Edilmiş Dosya</Label>
						<div className="flex items-center gap-2">
							<Input
								id="revision-file"
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={handleFileChange}
								disabled={loading}
								className="cursor-pointer"
							/>
						</div>
						{file && (
							<div className="flex items-center gap-2 text-sm text-green-600">
								<FileText className="h-4 w-4" />
								<span>{file.name}</span>
								<span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
							</div>
						)}
						<p className="text-xs text-gray-500">Maksimum dosya boyutu: 10MB (PDF, DOC, DOCX)</p>
					</div>

					{/* Upload Reason */}
					<div className="space-y-2">
						<Label htmlFor="upload-reason">Revizyon Açıklaması</Label>
						<Textarea
							id="upload-reason"
							placeholder="Yapılan değişiklikleri kısaca açıklayın... (örn: Hakem önerilerine göre Metodoloji bölümü genişletildi)"
							value={uploadReason}
							onChange={(e) => setUploadReason(e.target.value)}
							disabled={loading}
							rows={4}
						/>
					</div>

					{/* Error Alert */}
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Submit Button */}
					<Button type="submit" disabled={loading || !file || !uploadReason.trim()} className="w-full">
						{loading ? 'Yükleniyor...' : 'Revizyon Yükle'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
