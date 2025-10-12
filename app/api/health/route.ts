import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

		// Test basic connection
		const supabase = createClient(supabaseUrl, supabaseKey)

		// Try to query a simple table
		const { data, error } = await supabase.from('users').select('count').limit(1)

		if (error) {
			return NextResponse.json(
				{
					status: 'error',
					message: 'Supabase connection failed',
					error: error.message,
					hint: 'Check if your Supabase project is active and credentials are correct'
				},
				{ status: 500 }
			)
		}

		return NextResponse.json({
			status: 'ok',
			message: 'Supabase connection successful',
			timestamp: new Date().toISOString()
		})
	} catch (error: any) {
		return NextResponse.json(
			{
				status: 'error',
				message: 'Failed to connect to Supabase',
				error: error.message,
				hint: 'Your Supabase project might be paused. Visit https://supabase.com/dashboard to resume it.'
			},
			{ status: 500 }
		)
	}
}
