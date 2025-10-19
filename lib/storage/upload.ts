import { createClient } from '@/lib/supabase/client'

export async function uploadPaperFile(
	file: File,
	userId: string,
	paperId: string,
	versionNumber?: number
): Promise<{ url: string | null; error: string | null }> {
	const supabase = createClient()

	// Validate
	if (file.size > 10 * 1024 * 1024) {
		return { url: null, error: 'Dosya çok büyük (maksimum 10MB)' }
	}

	const allowedTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	]
	if (!allowedTypes.includes(file.type)) {
		return { url: null, error: 'Sadece PDF ve Word dosyaları yüklenebilir' }
	}

	// Upload
	const fileExt = file.name.split('.').pop()
	// Revizyon versiyonu varsa dosya adına ekle
	const fileName = versionNumber ? `${paperId}_v${versionNumber}.${fileExt}` : `${paperId}.${fileExt}`
	const filePath = `${userId}/${fileName}`

	const { data, error } = await supabase.storage.from('articles').upload(filePath, file, {
		cacheControl: '3600',
		upsert: true // Revizyon yüklemelerinde aynı dosya adını kullanmak için
	})

	if (error) {
		return { url: null, error: error.message }
	}

	// Get public URL
	const {
		data: { publicUrl }
	} = supabase.storage.from('articles').getPublicUrl(data.path)

	return { url: publicUrl, error: null }
}

export async function deletePaperFile(paperId: string, userId: string) {
	const supabase = createClient()

	// Try to delete both PDF and Word versions
	const filePaths = [`${userId}/${paperId}.pdf`, `${userId}/${paperId}.doc`, `${userId}/${paperId}.docx`]

	const { error } = await supabase.storage.from('articles').remove(filePaths)

	return { error: error?.message || null }
}

export async function downloadPaperFile(fileUrl: string) {
	const supabase = createClient()

	// Extract path from URL
	const urlObj = new URL(fileUrl)
	const pathParts = urlObj.pathname.split('/')
	const bucketIndex = pathParts.indexOf('articles')
	const path = pathParts.slice(bucketIndex + 1).join('/')

	const { data, error } = await supabase.storage.from('articles').download(path)

	if (error) {
		return { data: null, error: error.message }
	}

	return { data, error: null }
}

export async function getSignedUrl(filePath: string, expiresIn: number = 3600) {
	const supabase = createClient()

	const { data, error } = await supabase.storage.from('articles').createSignedUrl(filePath, expiresIn)

	if (error) {
		return { url: null, error: error.message }
	}

	return { url: data.signedUrl, error: null }
}
