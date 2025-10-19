'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Loader2 } from 'lucide-react'

interface PDFActionsProps {
	fileUrl: string
	fileName?: string
	variant?: 'default' | 'outline' | 'ghost'
	size?: 'default' | 'sm' | 'lg' | 'icon'
	showLabel?: boolean
	iconOnly?: boolean
}

// Extract file path from Supabase URL
function extractFilePath(fileUrl: string): string {
	try {
		const url = new URL(fileUrl)
		const pathParts = url.pathname.split('/').filter(Boolean)

		// Find 'articles' bucket in path and get everything after it
		const bucketIndex = pathParts.findIndex((part) => part === 'articles')

		if (bucketIndex === -1) {
			throw new Error('Invalid file URL format')
		}

		return pathParts.slice(bucketIndex + 1).join('/')
	} catch (error) {
		console.error('Error extracting file path:', error)
		throw new Error('Geçersiz dosya URL formatı')
	}
}

export function PDFDownloadButton({
	fileUrl,
	fileName = 'makale.pdf',
	variant = 'outline',
	size = 'sm',
	showLabel = true,
	iconOnly = false
}: PDFActionsProps) {
	const [loading, setLoading] = useState(false)

	const handleDownload = async () => {
		try {
			setLoading(true)

			// Extract file path from URL
			console.log('Original fileUrl:', fileUrl)
			const filePath = extractFilePath(fileUrl)
			console.log('Extracted file path:', filePath)

			// Use API route for authenticated download
			const apiUrl = `/api/storage/download?path=${encodeURIComponent(filePath)}`
			console.log('API URL:', apiUrl)

			const response = await fetch(apiUrl)
			console.log('Fetch response:', response.status, response.statusText)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
				console.error('Response error:', errorData)
				throw new Error(errorData.error || `Dosya indirilemedi: ${response.status}`)
			}

			const blob = await response.blob()
			console.log('Blob created:', blob.size, 'bytes')

			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = fileName
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)

			console.log('Download successful')
		} catch (error) {
			console.error('Download error:', error)
			alert(error instanceof Error ? error.message : 'Dosya indirilemedi')
		} finally {
			setLoading(false)
		}
	}

	if (iconOnly) {
		return (
			<Button variant={variant} size={size} onClick={handleDownload} disabled={loading}>
				{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
			</Button>
		)
	}

	return (
		<Button variant={variant} size={size} onClick={handleDownload} disabled={loading}>
			{loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
			{showLabel && 'İndir'}
		</Button>
	)
}

export function PDFViewButton({
	fileUrl,
	variant = 'outline',
	size = 'sm',
	showLabel = true,
	iconOnly = false
}: PDFActionsProps) {
	const [loading, setLoading] = useState(false)

	const handleView = async () => {
		try {
			setLoading(true)

			// Extract file path from URL
			console.log('Original fileUrl:', fileUrl)
			const filePath = extractFilePath(fileUrl)
			console.log('Extracted file path:', filePath)

			// Use API route for authenticated access
			const apiUrl = `/api/storage/download?path=${encodeURIComponent(filePath)}`
			console.log('API URL:', apiUrl)

			// Open in new tab
			window.open(apiUrl, '_blank', 'noopener,noreferrer')
		} catch (error) {
			console.error('View error:', error)
			alert(error instanceof Error ? error.message : 'Dosya görüntülenemedi')
		} finally {
			setLoading(false)
		}
	}

	if (iconOnly) {
		return (
			<Button variant={variant} size={size} onClick={handleView} disabled={loading}>
				{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
			</Button>
		)
	}

	return (
		<Button variant={variant} size={size} onClick={handleView} disabled={loading}>
			{loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
			{showLabel && 'Görüntüle'}
		</Button>
	)
}

export function PDFCombinedActions({ fileUrl, fileName = 'makale.pdf', size = 'sm' }: PDFActionsProps) {
	return (
		<div className="flex gap-2">
			<PDFViewButton fileUrl={fileUrl} size={size} showLabel={false} iconOnly={true} />
			<PDFDownloadButton fileUrl={fileUrl} fileName={fileName} size={size} showLabel={false} iconOnly={true} />
		</div>
	)
}
