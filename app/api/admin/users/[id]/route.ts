import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Kullanıcı güncelleme
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params
		const userId = resolvedParams.id

		console.log('PUT request for user ID:', userId)

		// Admin kontrolü
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: userData } = await supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Request body'yi al
		const body = await request.json()
		const { name, role, affiliation } = body

		console.log('Update data:', { name, role, affiliation })

		// Kullanıcının var olup olmadığını kontrol et
		const { data: existingUser, error: checkError } = await supabase
			.from('users')
			.select('id')
			.eq('id', userId)
			.single()

		console.log('Existing user check:', { existingUser, checkError })

		if (checkError || !existingUser) {
			return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
		}

		// Kullanıcıyı güncelle
		const { error: updateError } = await supabase
			.from('users')
			.update({
				name,
				role,
				affiliation,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)

		console.log('Update result:', { updateError })

		if (updateError) {
			console.error('Error updating user:', updateError)
			return NextResponse.json({ error: updateError.message }, { status: 500 })
		}

		// Güncellenmiş kullanıcıyı getir
		const { data: updatedUser, error: fetchError } = await supabase
			.from('users')
			.select('*')
			.eq('id', userId)
			.single()

		console.log('Fetch result:', { updatedUser, fetchError })

		if (fetchError) {
			console.error('Error fetching updated user:', fetchError)
			// Güncelleme başarılı oldu ama getirme başarısız, yine de success dön
			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ data: updatedUser })
	} catch (error) {
		console.error('Error in PUT /api/admin/users/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE - Kullanıcı silme
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await createServerSupabaseClient()
		const resolvedParams = await params
		const userId = resolvedParams.id

		console.log('DELETE request for user ID:', userId)

		// Admin kontrolü
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: userData } = await supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Kendi hesabını silmeyi engelle
		if (user.id === userId) {
			return NextResponse.json(
				{ error: 'Kendi hesabınızı silemezsiniz' },
				{ status: 400 }
			)
		}

		// Kullanıcının var olup olmadığını kontrol et
		const { data: existingUser, error: checkError } = await supabase
			.from('users')
			.select('id')
			.eq('id', userId)
			.single()

		console.log('Existing user check:', { existingUser, checkError })

		if (checkError || !existingUser) {
			return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
		}

		// İlişkili kayıtları sil
		// 1. Yazarı olduğu makalelerin atamalarını sil
		const { data: userArticles } = await supabase
			.from('articles')
			.select('id')
			.eq('author_id', userId)

		console.log('User articles:', userArticles)

		if (userArticles && userArticles.length > 0) {
			const articleIds = userArticles.map(a => a.id)

			// Makalelerin atamalarını sil
			await supabase.from('assignments').delete().in('article_id', articleIds)

			// Makalelerin değerlendirmelerini sil
			await supabase.from('reviews').delete().in('article_id', articleIds)

			// Makalelerin kararlarını sil
			await supabase.from('decisions').delete().in('article_id', articleIds)

			// Makaleleri sil
			await supabase.from('articles').delete().in('id', articleIds)
		}

		// 2. Hakem olarak atandığı görevleri sil
		const { error: assignError } = await supabase.from('assignments').delete().eq('reviewer_id', userId)
		console.log('Delete assignments result:', { assignError })

		// 3. Hakem olarak yaptığı değerlendirmeleri sil
		const { error: reviewError } = await supabase.from('reviews').delete().eq('reviewer_id', userId)
		console.log('Delete reviews result:', { reviewError })

		// 4. Editör olarak verdiği kararları sil
		const { error: decisionError } = await supabase.from('decisions').delete().eq('editor_id', userId)
		console.log('Delete decisions result:', { decisionError })

		// 5. Kullanıcıyı sil
		const { error: deleteError } = await supabase
			.from('users')
			.delete()
			.eq('id', userId)

		console.log('Delete user result:', { deleteError })

		if (deleteError) {
			console.error('Error deleting user:', deleteError)
			return NextResponse.json({ error: deleteError.message }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in DELETE /api/admin/users/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
