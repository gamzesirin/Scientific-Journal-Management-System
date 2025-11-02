import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Download backup
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const { filename } = await params

		// Auth check
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if user is admin
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Download file from storage
		const { data, error } = await supabase.storage.from('backups').download(filename)

		if (error) {
			console.error('Download backup error:', error)
			return NextResponse.json({ error: 'Failed to download backup', details: error }, { status: 500 })
		}

		// Return file as download
		return new NextResponse(data, {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		})
	} catch (error) {
		console.error('GET /api/admin/backups/[filename] error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE - Delete backup
export async function DELETE(request: Request, { params }: { params: Promise<{ filename: string }> }) {
	try {
		const supabase = await createServerSupabaseClient()
		const { filename } = await params

		// Auth check
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if user is admin
		const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userData?.role !== 'admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Delete file from storage
		const { error } = await supabase.storage.from('backups').remove([filename])

		if (error) {
			console.error('Delete backup error:', error)
			return NextResponse.json({ error: 'Failed to delete backup', details: error }, { status: 500 })
		}

		return NextResponse.json({ message: 'Backup deleted successfully' })
	} catch (error) {
		console.error('DELETE /api/admin/backups/[filename] error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
