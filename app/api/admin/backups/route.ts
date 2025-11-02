import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all backups
export async function GET() {
	try {
		const supabase = await createServerSupabaseClient()

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

		// List backup files from storage
		const { data: files, error: listError } = await supabase.storage.from('backups').list()

		if (listError) {
			console.error('List backups error:', listError)
			return NextResponse.json({ error: 'Failed to list backups', details: listError }, { status: 500 })
		}

		// Format backup data
		const backups = files
			?.filter((file) => file.name.endsWith('.json'))
			.map((file) => ({
				id: file.id,
				name: file.name,
				size: `${(file.metadata.size / (1024 * 1024)).toFixed(2)} MB`,
				created_at: file.created_at,
				status: 'completed'
			}))

		return NextResponse.json({ backups: backups || [] })
	} catch (error) {
		console.error('GET /api/admin/backups error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST - Create new backup
export async function POST() {
	try {
		const supabase = await createServerSupabaseClient()

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

		// Collect all data from all tables
		const backupData: any = {
			version: '1.0.0',
			created_at: new Date().toISOString(),
			created_by: user.id,
			tables: {}
		}

		// List of tables to backup
		const tables = [
			'users',
			'articles',
			'article_coauthors',
			'article_versions',
			'assignments',
			'reviews',
			'decisions',
			'editor_desk_evaluations',
			'reviewer_cv_profiles'
		]

		// Export each table
		for (const table of tables) {
			try {
				const { data, error } = await supabase.from(table).select('*')

				if (error) {
					console.warn(`Failed to export ${table}:`, error)
					backupData.tables[table] = []
				} else {
					backupData.tables[table] = data || []
				}
			} catch (tableError) {
				console.error(`Error exporting ${table}:`, tableError)
				backupData.tables[table] = []
			}
		}

		// Create filename
		const timestamp = new Date().toISOString().split('T')[0]
		const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
		const filename = `backup_${timestamp}_${timeString}.json`

		// Convert to JSON
		const jsonContent = JSON.stringify(backupData, null, 2)
		const blob = new Blob([jsonContent], { type: 'application/json' })

		// Upload to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('backups')
			.upload(filename, blob, {
				contentType: 'application/json',
				upsert: false
			})

		if (uploadError) {
			console.error('Upload backup error:', uploadError)
			return NextResponse.json({ error: 'Failed to upload backup', details: uploadError }, { status: 500 })
		}

		return NextResponse.json({
			message: 'Backup created successfully',
			backup: {
				id: uploadData.id,
				name: filename,
				size: `${(jsonContent.length / (1024 * 1024)).toFixed(2)} MB`,
				created_at: new Date().toISOString(),
				status: 'completed'
			}
		})
	} catch (error) {
		console.error('POST /api/admin/backups error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
