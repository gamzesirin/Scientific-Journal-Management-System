import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	try {
		const supabase = await createServerSupabaseClient()

		// Check authentication
		const { data: { user }, error: authError } = await supabase.auth.getUser()
		if (authError || !user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Get file path from query params
		const searchParams = request.nextUrl.searchParams
		const filePath = searchParams.get('path')

		if (!filePath) {
			return NextResponse.json(
				{ error: 'File path is required' },
				{ status: 400 }
			)
		}

		console.log('Downloading file from path:', filePath)

		// Download file from Supabase storage with authentication
		const { data, error } = await supabase.storage
			.from('articles')
			.download(filePath)

		if (error) {
			console.error('Storage download error:', error)
			return NextResponse.json(
				{ error: error.message, details: error },
				{ status: 404 }
			)
		}

		if (!data) {
			return NextResponse.json(
				{ error: 'File not found' },
				{ status: 404 }
			)
		}

		// Convert blob to buffer
		const buffer = await data.arrayBuffer()

		// Return file with appropriate headers
		return new NextResponse(buffer, {
			headers: {
				'Content-Type': data.type || 'application/pdf',
				'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
				'Cache-Control': 'private, max-age=3600'
			}
		})
	} catch (error) {
		console.error('Download API error:', error)
		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
