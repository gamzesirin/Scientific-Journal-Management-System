import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Bir makale için desk evaluation getir
export async function GET(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
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

		// Check user role
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (!userData || !['editor', 'admin'].includes(userData.role)) {
			return NextResponse.json({ error: 'Sadece editör ve admin erişebilir' }, { status: 403 })
		}

		// Get desk evaluation
		const { data: deskEval, error: deskEvalError } = await supabase
			.from('editor_desk_evaluations')
			.select('*')
			.eq('article_id', resolvedParams.articleId)
			.maybeSingle()

		if (deskEvalError) {
			console.error('Error fetching desk evaluation:', deskEvalError)
			return NextResponse.json({ error: 'Desk evaluation yüklenemedi' }, { status: 500 })
		}

		return NextResponse.json({ deskEvaluation: deskEval })
	} catch (error) {
		console.error('Error in GET /api/editor-desk-evaluations/[articleId]:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}

// POST: Yeni desk evaluation oluştur veya güncelle (upsert)
export async function POST(request: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
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

		// Check user role
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (!userData || !['editor', 'admin'].includes(userData.role)) {
			return NextResponse.json({ error: 'Sadece editör desk evaluation yapabilir' }, { status: 403 })
		}

		// Get article
		const { data: article, error: articleError } = await supabase
			.from('articles')
			.select('*')
			.eq('id', resolvedParams.articleId)
			.single()

		if (articleError || !article) {
			return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
		}

		// Parse request body
		const body = await request.json()
		const { decision, rejection_reason, notes, scope_fit_score, originality_score, methodology_quality_score } = body

		if (!decision) {
			return NextResponse.json({ error: 'Karar gerekli' }, { status: 400 })
		}

		if (decision === 'reject' && !rejection_reason?.trim()) {
			return NextResponse.json({ error: 'Ret kararı için gerekçe zorunludur' }, { status: 400 })
		}

		// Check if desk evaluation already exists
		const { data: existingDeskEval } = await supabase
			.from('editor_desk_evaluations')
			.select('*')
			.eq('article_id', resolvedParams.articleId)
			.maybeSingle()

		// Determine if this is a final submission
		const isSubmitted = decision !== 'pending'

		if (existingDeskEval) {
			// UPDATE existing
			// Only allow update if it's still pending
			if (existingDeskEval.decision !== 'pending') {
				return NextResponse.json({ error: 'Gönderilmiş desk evaluation güncellenemez' }, { status: 400 })
			}

			const { data: updatedDeskEval, error: updateError } = await supabase
				.from('editor_desk_evaluations')
				.update({
					decision,
					rejection_reason: rejection_reason?.trim() || null,
					notes: notes?.trim() || null,
					scope_fit_score,
					originality_score,
					methodology_quality_score,
					submitted_at: isSubmitted ? new Date().toISOString() : null
				})
				.eq('id', existingDeskEval.id)
				.select()
				.single()

			if (updateError) {
				console.error('Error updating desk evaluation:', updateError)
				return NextResponse.json({ error: 'Desk evaluation güncellenemedi' }, { status: 500 })
			}

			return NextResponse.json({
				message: 'Desk evaluation başarıyla güncellendi',
				deskEvaluation: updatedDeskEval
			})
		} else {
			// INSERT new
			const { data: newDeskEval, error: insertError } = await supabase
				.from('editor_desk_evaluations')
				.insert({
					article_id: resolvedParams.articleId,
					editor_id: user.id,
					decision,
					rejection_reason: rejection_reason?.trim() || null,
					notes: notes?.trim() || null,
					scope_fit_score,
					originality_score,
					methodology_quality_score,
					submitted_at: isSubmitted ? new Date().toISOString() : null
				})
				.select()
				.single()

			if (insertError) {
				console.error('Error creating desk evaluation:', insertError)
				return NextResponse.json({ error: 'Desk evaluation oluşturulamadı: ' + insertError.message }, { status: 500 })
			}

			return NextResponse.json({
				message: 'Desk evaluation başarıyla oluşturuldu',
				deskEvaluation: newDeskEval
			})
		}
	} catch (error) {
		console.error('Error in POST /api/editor-desk-evaluations/[articleId]:', error)
		return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
	}
}
