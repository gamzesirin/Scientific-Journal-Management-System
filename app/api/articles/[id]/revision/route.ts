import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Makale versiyonlarını listele
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params

		// Auth check
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get article to check ownership
		const { data: article, error: articleError } = await supabase
			.from('articles')
			.select('author_id')
			.eq('id', resolvedParams.id)
			.single()

		if (articleError || !article) {
			return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
		}

		// Get user role
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		// Check permission
		const isAuthor = article.author_id === user.id
		const isEditor = userData?.role === 'editor'
		const isAdmin = userData?.role === 'admin'

		if (!isAuthor && !isEditor && !isAdmin) {
			return NextResponse.json({ error: 'Bu makaleye erişim yetkiniz yok' }, { status: 403 })
		}

		// Get versions
		const { data: versions, error: versionsError } = await supabase
			.from('article_versions')
			.select(
				`
        *,
        uploaded_by_user:users!article_versions_uploaded_by_fkey(name, email)
      `
			)
			.eq('article_id', resolvedParams.id)
			.order('version_number', { ascending: false })

		if (versionsError) {
			console.error('Error fetching versions:', versionsError)
			return NextResponse.json({ error: 'Versiyonlar yüklenemedi' }, { status: 500 })
		}

		return NextResponse.json({ versions: versions || [] })
	} catch (error) {
		console.error('Error in GET /api/articles/[id]/revision:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}

// POST: Yeni revizyon yükle
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params

		// Auth check
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get article
		const { data: article, error: articleError } = await supabase
			.from('articles')
			.select('author_id, status')
			.eq('id', resolvedParams.id)
			.single()

		if (articleError || !article) {
			return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
		}

		// Check if user is the author
		if (article.author_id !== user.id) {
			return NextResponse.json({ error: 'Sadece makale sahibi revizyon yükleyebilir' }, { status: 403 })
		}

		// Parse request body
		const body = await request.json()
		const { file_url, upload_reason, file_size, file_type } = body

		if (!file_url) {
			return NextResponse.json({ error: "Dosya URL'si gerekli" }, { status: 400 })
		}

		// Get next version number
		const { data: versionData } = await supabase.rpc('get_next_version_number', {
			p_article_id: resolvedParams.id
		})

		const nextVersionNumber = versionData || 1

		// Insert new version
		const { data: newVersion, error: insertError } = await supabase
			.from('article_versions')
			.insert({
				article_id: resolvedParams.id,
				version_number: nextVersionNumber,
				file_url,
				uploaded_by: user.id,
				upload_reason,
				file_size,
				file_type,
				status: 'current'
			})
			.select()
			.single()

		if (insertError) {
			console.error('Error inserting version:', insertError)
			return NextResponse.json({ error: 'Revizyon kaydedilemedi: ' + insertError.message }, { status: 500 })
		}

		// Update article's file_url to the latest version
		const { error: updateArticleError } = await supabase
			.from('articles')
			.update({
				file_url,
				updated_at: new Date().toISOString()
			})
			.eq('id', resolvedParams.id)

		if (updateArticleError) {
			console.error('Error updating article:', updateArticleError)
		}

		// If article status is revision_requested, change it to resubmitted
		// Editör bu durumda revize edilmiş makaleyi görecek ve karar verecek
		if (article.status === 'revision_requested') {
			await supabase.from('articles').update({ status: 'resubmitted' }).eq('id', resolvedParams.id)
		}

		return NextResponse.json({
			message: 'Revizyon başarıyla yüklendi',
			version: newVersion
		})
	} catch (error) {
		console.error('Error in POST /api/articles/[id]/revision:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}
