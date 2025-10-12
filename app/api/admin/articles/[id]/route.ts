import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Makale durumu güncelleme
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params
		const articleId = resolvedParams.id

		console.log('PUT request for article ID:', articleId)

		// Admin kontrolü
		const {
			data: { user }
		} = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userData?.role !== 'admin' && userData?.role !== 'editor') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Request body'yi al
		const body = await request.json()
		const { status, assigned_editor_id } = body

		console.log('Update article with:', { status, assigned_editor_id })

		// Güncellenecek alanları hazırla
		const updateData: any = {
			updated_at: new Date().toISOString()
		}

		if (status !== undefined) {
			updateData.status = status
		}

		if (assigned_editor_id !== undefined) {
			updateData.assigned_editor_id = assigned_editor_id
		}

		// Makaleyi güncelle
		const { error: updateError } = await supabase.from('articles').update(updateData).eq('id', articleId)

		console.log('Update result:', { updateError })

		if (updateError) {
			console.error('Error updating article:', updateError)
			return NextResponse.json({ error: updateError.message }, { status: 500 })
		}

		// Güncellenmiş makaleyi getir
		const { data: updatedArticle, error: fetchError } = await supabase
			.from('articles')
			.select('*')
			.eq('id', articleId)
			.single()

		if (fetchError) {
			console.error('Error fetching updated article:', fetchError)
			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ data: updatedArticle })
	} catch (error) {
		console.error('Error in PUT /api/admin/articles/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE - Makale silme
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params
		const articleId = resolvedParams.id

		console.log('DELETE request for article ID:', articleId)

		// Admin kontrolü
		const {
			data: { user }
		} = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden - Only admins can delete articles' }, { status: 403 })
		}

		// İlk önce ilişkili kayıtları sil
		// Assignments
		const { error: assignError } = await supabase.from('assignments').delete().eq('article_id', articleId)
		console.log('Delete assignments result:', { assignError })

		// Reviews
		const { error: reviewError } = await supabase.from('reviews').delete().eq('article_id', articleId)
		console.log('Delete reviews result:', { reviewError })

		// Decisions
		const { error: decisionError } = await supabase.from('decisions').delete().eq('article_id', articleId)
		console.log('Delete decisions result:', { decisionError })

		// Makaleyi sil
		const { error: deleteError } = await supabase.from('articles').delete().eq('id', articleId)

		console.log('Delete article result:', { deleteError })

		if (deleteError) {
			console.error('Error deleting article:', deleteError)
			return NextResponse.json({ error: deleteError.message }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in DELETE /api/admin/articles/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
