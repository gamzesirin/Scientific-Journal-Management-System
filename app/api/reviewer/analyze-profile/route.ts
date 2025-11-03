import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/reviewer/analyze-profile
 * Analyzes reviewer profile data with AI to calculate expertise score
 */
export async function POST(request: NextRequest) {
  console.log('[Profile Analysis] Starting profile analysis request...');

  try {
    // Import AI function
    const { analyzeManualProfileWithAI } = await import('@/lib/gemini');

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[Profile Analysis] Auth error:', authError.message);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authError.message,
          hint: 'Please ensure you are logged in and try again'
        },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[Profile Analysis] No user found in session');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          hint: 'Please log in to continue. If you are already logged in, try refreshing the page.'
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { profileData } = body;

    console.log('[Profile Analysis] Analyzing profile for user:', user.id);

    if (!profileData) {
      return NextResponse.json(
        { error: 'Missing profileData in request' },
        { status: 400 }
      );
    }

    // Validate profile data
    if (!profileData.research_areas || profileData.research_areas.length === 0) {
      return NextResponse.json(
        { error: 'At least one research area is required' },
        { status: 400 }
      );
    }

    // Analyze profile with AI
    console.log('[Profile Analysis] ══════════════════════════════════════════════');
    console.log('[Profile Analysis] Sending profile data to AI...');
    console.log('[Profile Analysis] Profile data to analyze:', JSON.stringify(profileData, null, 2));
    console.log('[Profile Analysis] ──────────────────────────────────────────────');

    let analysis;
    try {
      analysis = await analyzeManualProfileWithAI(profileData);
      console.log('[Profile Analysis] ✓ AI analysis completed');
    } catch (aiError: any) {
      console.error('[Profile Analysis] ❌ AI Error:', aiError);
      console.error('[Profile Analysis] AI Error message:', aiError.message);
      console.error('[Profile Analysis] AI Error stack:', aiError.stack);
      throw aiError; // Re-throw to be caught by outer catch
    }

    console.log('[Profile Analysis] ══════════════════════════════════════════════');
    console.log('[Profile Analysis] AI ANALYSIS RESULT:');
    console.log('[Profile Analysis] Calculated expertise score:', analysis.expertise_score);
    console.log('[Profile Analysis] AI recommendations:', analysis.recommendations);
    console.log('[Profile Analysis] Analysis summary:', analysis.analysis_summary);
    console.log('[Profile Analysis] ══════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      expertise_score: analysis.expertise_score,
      recommendations: analysis.recommendations,
      analysis_summary: analysis.analysis_summary,
      suggested_improvements: analysis.suggested_improvements,
    });
  } catch (error) {
    console.error('[Profile Analysis] Error:', error);

    let errorMessage = 'Failed to analyze profile';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
