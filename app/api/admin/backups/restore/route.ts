import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Restore from backup
export async function POST(request: Request) {
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

		// Get backup file from request
		const formData = await request.formData()
		const file = formData.get('file') as File

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 })
		}

		// Read file content
		const content = await file.text()
		let backupData: any

		try {
			backupData = JSON.parse(content)
		} catch (parseError) {
			console.error('Parse backup file error:', parseError)
			return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 })
		}

		// Validate backup structure
		if (!backupData.tables || typeof backupData.tables !== 'object') {
			return NextResponse.json({ error: 'Invalid backup structure' }, { status: 400 })
		}

		// Restore tables (CAUTION: This will overwrite existing data)
		const results: any = {
			success: [],
			failed: []
		}

		// WARNING: This is a simple restore that ADDS data, doesn't replace
		// For production, you might want to:
		// 1. Backup current data first
		// 2. Delete existing data
		// 3. Insert backup data
		// 4. Handle foreign key constraints properly

		for (const [tableName, tableData] of Object.entries(backupData.tables)) {
			try {
				if (!Array.isArray(tableData) || tableData.length === 0) {
					results.success.push({ table: tableName, action: 'skipped', reason: 'no data' })
					continue
				}

				// For simplicity, we'll use upsert to avoid duplicate key errors
				// Note: This requires unique constraints on tables
				const { error } = await supabase.from(tableName).upsert(tableData as any[], {
					onConflict: 'id',
					ignoreDuplicates: false
				})

				if (error) {
					console.error(`Failed to restore ${tableName}:`, error)
					results.failed.push({ table: tableName, error: error.message })
				} else {
					results.success.push({ table: tableName, records: tableData.length })
				}
			} catch (tableError: any) {
				console.error(`Error restoring ${tableName}:`, tableError)
				results.failed.push({ table: tableName, error: tableError.message })
			}
		}

		return NextResponse.json({
			message: 'Restore process completed',
			results,
			summary: {
				total_tables: Object.keys(backupData.tables).length,
				successful: results.success.length,
				failed: results.failed.length
			}
		})
	} catch (error: any) {
		console.error('POST /api/admin/backups/restore error:', error)
		return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
	}
}
