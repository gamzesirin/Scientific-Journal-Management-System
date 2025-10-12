import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = await createServerSupabaseClient()

		// Kullanıcı kontrolü
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Kullanıcı rolünü kontrol et
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (!userData || userData.role !== 'editor') {
			return NextResponse.json({ error: 'Forbidden: Only editors can update article status' }, { status: 403 })
		}

		// Request body'den yeni durumu al
		const { status } = await request.json()

		console.log('Updating article status:', { articleId: params.id, newStatus: status, editor: user.id })

		// Geçerli durum kontrolü
		const validStatuses = ['submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'published']
		if (!status || !validStatuses.includes(status)) {
			console.error('Invalid status provided:', status)
			return NextResponse.json(
				{
					error: 'Invalid status',
					details: `Status must be one of: ${validStatuses.join(', ')}`
				},
				{ status: 400 }
			)
		}

		// Makale durumunu güncelle
		const { data, error } = await supabase
			.from('articles')
			.update({
				status,
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id)
			.select()
			.single()

		if (error) {
			console.error('Error updating article status:', {
				error,
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint
			})

			// Check constraint hatası için özel mesaj
			if (error.message.includes('valid_status') || error.message.includes('check constraint')) {
				return NextResponse.json(
					{
						error: 'Database constraint error',
						message:
							'Veritabanı "revision_requested" durumunu desteklemiyor. Lütfen check-and-fix-revision-status.sql dosyasını Supabase SQL Editor\'de çalıştırın.',
						details: error.message,
						requiredStatus: status
					},
					{ status: 500 }
				)
			}

			return NextResponse.json(
				{
					error: 'Database error',
					message: error.message,
					details: error.details
				},
				{ status: 500 }
			)
		}

		console.log('Article status updated successfully:', data)

		return NextResponse.json({ success: true, data }, { status: 200 })
	} catch (error: any) {
		console.error('Unexpected error:', error)
		return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
	}
}
