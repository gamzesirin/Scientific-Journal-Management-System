import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Ortak yazarları listele
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

		// Get coauthors
		const { data: coauthors, error: coauthorsError } = await supabase
			.from('article_coauthors')
			.select('*')
			.eq('article_id', resolvedParams.id)
			.order('order_index', { ascending: true })

		if (coauthorsError) {
			console.error('Error fetching coauthors:', coauthorsError)
			return NextResponse.json({ error: 'Ortak yazarlar yüklenemedi' }, { status: 500 })
		}

		return NextResponse.json({ coauthors: coauthors || [] })
	} catch (error) {
		console.error('Error in GET /api/articles/[id]/coauthors:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}

// POST: Yeni ortak yazar ekle
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
			.select('author_id')
			.eq('id', resolvedParams.id)
			.single()

		if (articleError || !article) {
			return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
		}

		// Check if user is the author
		if (article.author_id !== user.id) {
			return NextResponse.json({ error: 'Sadece makale sahibi ortak yazar ekleyebilir' }, { status: 403 })
		}

		// Parse request body
		const body = await request.json()
		const { name, email, affiliation, order_index } = body

		if (!name || !email) {
			return NextResponse.json({ error: 'İsim ve email gerekli' }, { status: 400 })
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Geçerli bir email adresi girin' }, { status: 400 })
		}

		// Check if email already exists for this article
		const { data: existingCoauthor } = await supabase
			.from('article_coauthors')
			.select('id')
			.eq('article_id', resolvedParams.id)
			.eq('email', email)
			.single()

		if (existingCoauthor) {
			return NextResponse.json({ error: 'Bu email adresi zaten ortak yazar olarak eklenmiş' }, { status: 400 })
		}

		// Check if the email belongs to a registered user
		const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single()

		// Get max order_index if not provided
		let finalOrderIndex = order_index
		if (!finalOrderIndex) {
			const { data: maxOrderData } = await supabase
				.from('article_coauthors')
				.select('order_index')
				.eq('article_id', resolvedParams.id)
				.order('order_index', { ascending: false })
				.limit(1)
				.single()

			finalOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 1
		}

		// Insert new coauthor
		const { data: newCoauthor, error: insertError } = await supabase
			.from('article_coauthors')
			.insert({
				article_id: resolvedParams.id,
				name,
				email,
				affiliation,
				order_index: finalOrderIndex,
				user_id: existingUser?.id || null,
				added_by: user.id,
				is_confirmed: true,
				confirmed_at: new Date().toISOString()
			})
			.select()
			.single()

		if (insertError) {
			console.error('Error inserting coauthor:', insertError)
			return NextResponse.json({ error: 'Ortak yazar eklenemedi: ' + insertError.message }, { status: 500 })
		}

		return NextResponse.json({
			message: 'Ortak yazar başarıyla eklendi',
			coauthor: newCoauthor
		})
	} catch (error) {
		console.error('Error in POST /api/articles/[id]/coauthors:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}

// DELETE: Ortak yazar sil
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

		// Get coauthor_id from query params
		const searchParams = request.nextUrl.searchParams
		const coauthorId = searchParams.get('coauthorId')

		if (!coauthorId) {
			return NextResponse.json({ error: "Ortak yazar ID'si gerekli" }, { status: 400 })
		}

		// Get article
		const { data: article, error: articleError } = await supabase
			.from('articles')
			.select('author_id')
			.eq('id', resolvedParams.id)
			.single()

		if (articleError || !article) {
			return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
		}

		// Check if user is the author
		if (article.author_id !== user.id) {
			return NextResponse.json({ error: 'Sadece makale sahibi ortak yazar silebilir' }, { status: 403 })
		}

		// Delete coauthor
		const { error: deleteError } = await supabase
			.from('article_coauthors')
			.delete()
			.eq('id', coauthorId)
			.eq('article_id', resolvedParams.id)

		if (deleteError) {
			console.error('Error deleting coauthor:', deleteError)
			return NextResponse.json({ error: 'Ortak yazar silinemedi' }, { status: 500 })
		}

		return NextResponse.json({ message: 'Ortak yazar başarıyla silindi' })
	} catch (error) {
		console.error('Error in DELETE /api/articles/[id]/coauthors:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}
