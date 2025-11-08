import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMatchingScore } from '@/lib/gemini';
import { analyzeArticleWithAI } from '@/lib/gemini';

interface RouteParams {
  params: Promise<{
    articleId: string;
  }>;
}

/**
 * GET /api/editor/reviewer-matches/[articleId]
 * Gets AI-calculated matching scores for all reviewers for a specific article
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { articleId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or editor
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'editor'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and editors can view matches' },
        { status: 403 }
      );
    }

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, abstract, file_url, author_id')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if article has been analyzed, if not analyze it
    let { data: articleAnalysis } = await supabase
      .from('article_analyses')
      .select('*')
      .eq('article_id', articleId)
      .single();

    // Store extracted PDF text for response (function scope)
    let extractedPdfText = '';

    // Check if we need to re-analyze (analysis is older than 30 days)
    const shouldReanalyze = !articleAnalysis ||
      new Date(articleAnalysis.created_at).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;

    if (shouldReanalyze) {
      console.log(articleAnalysis ? 'Re-analyzing article...' : 'Article not analyzed yet, analyzing now...');

      try {
        // Extract text from PDF if available
        let fullTextExcerpt = '';
        if (article.file_url && article.file_url.toLowerCase().endsWith('.pdf')) {
          try {
            console.log('[Reviewer Matches] Extracting text from PDF:', article.file_url);
            const { extractAndCleanPDFText } = await import('@/lib/simple-pdf-extract');

            const pdfText = await extractAndCleanPDFText(article.file_url);
            extractedPdfText = pdfText;

            // Use much more text for better AI matching (up to 10000 chars instead of 4000)
            // This improves matching accuracy by providing more context to the AI
            fullTextExcerpt = pdfText.substring(0, 10000);

            console.log('[Reviewer Matches] PDF text extracted, length:', pdfText.length);
            console.log('[Reviewer Matches] Using excerpt length for AI matching:', fullTextExcerpt.length);

            // Log extracted PDF text to console
            console.log('==================================================');
            console.log('[Reviewer Matches] EXTRACTED PDF TEXT:');
            console.log('==================================================');
            console.log(pdfText.substring(0, 2000)); // First 2000 characters
            if (pdfText.length > 2000) {
              console.log('...');
              console.log('[MIDDLE SECTION]');
              console.log(pdfText.substring(Math.floor(pdfText.length / 2), Math.floor(pdfText.length / 2) + 1000));
              console.log('...');
              console.log('[END SECTION]');
              console.log(pdfText.substring(pdfText.length - 1000));
              console.log('... (total length:', pdfText.length, 'chars)');
            }
            console.log('==================================================');
          } catch (pdfError) {
            console.warn('[Reviewer Matches] Failed to extract PDF text:', pdfError);
            console.log('[Reviewer Matches] Continuing with title and abstract only');
            // Continue without PDF text - not critical
          }
        }

        // Analyze the article using title, abstract, and optionally PDF excerpt
        const analysis = await analyzeArticleWithAI(
          article.title,
          article.abstract,
          fullTextExcerpt
        );

        const { data: newAnalysis, error: upsertError } = await supabase
          .from('article_analyses')
          .upsert({
            article_id: articleId,
            main_topics: analysis.main_topics,
            keywords: analysis.keywords,
            methodology: analysis.methodology,
            research_domain: analysis.research_domain,
            complexity_level: analysis.complexity_level,
            analysis_summary: analysis.analysis_summary,
            gemini_model_version: analysis.gemini_model_version,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'article_id'
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error saving article analysis:', upsertError);
          throw new Error(`Failed to save analysis: ${upsertError.message}`);
        }

        articleAnalysis = newAnalysis;
      } catch (analysisError) {
        console.error('Error during article analysis:', analysisError);
        return NextResponse.json(
          {
            error: 'Failed to analyze article',
            details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    if (!articleAnalysis) {
      return NextResponse.json(
        { error: 'Article analysis not found and could not be created' },
        { status: 500 }
      );
    }

    // Get all reviewers with profiles, excluding article author and already assigned reviewers
    const { data: existingAssignments } = await supabase
      .from('assignments')
      .select('reviewer_id')
      .eq('article_id', articleId);

    const excludedReviewerIds = [
      article.author_id,
      ...(existingAssignments?.map((a) => a.reviewer_id) || []),
    ].filter(id => id !== null && id !== undefined);

    // First get all eligible reviewers
    let query = supabase
      .from('users')
      .select('id, name, email, role, is_active, expertise_areas, affiliation')
      .eq('role', 'reviewer')
      .eq('is_active', true);

    // Only add exclusion if there are IDs to exclude
    if (excludedReviewerIds.length > 0) {
      query = query.not('id', 'in', `(${excludedReviewerIds.join(',')})`);
    }

    const { data: reviewers, error: reviewersError } = await query;

    if (reviewersError) {
      console.error('Error fetching reviewers:', reviewersError);
      return NextResponse.json(
        { error: 'Failed to fetch reviewers' },
        { status: 500 }
      );
    }

    // Now get reviewer profiles for these reviewers
    const reviewerIds = reviewers?.map(r => r.id) || [];

    let reviewerProfiles = null;
    let profilesError = null;

    if (reviewerIds.length > 0) {
      const result = await supabase
        .from('reviewer_profiles')
        .select('*')
        .in('user_id', reviewerIds);

      reviewerProfiles = result.data;
      profilesError = result.error;
    }

    if (profilesError) {
      console.error('Error fetching reviewer profiles:', profilesError);
      // Continue without profiles, we'll use basic matching
    }

    if (!reviewers || reviewers.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No eligible reviewers found',
      });
    }

    // Create a map of reviewer profiles for easy lookup
    const profileMap = new Map();
    if (reviewerProfiles) {
      reviewerProfiles.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
    }

    // Calculate matching scores for each reviewer
    const matches = await Promise.all(
      reviewers.map(async (reviewer: any) => {
        const profile = profileMap.get(reviewer.id);
        try {
          // Check if we have a cached match score and profile exists
          // Use 7 days cache for match scores
          const cacheHours = 7 * 24;
          const cacheTime = Date.now() - cacheHours * 60 * 60 * 1000;

          if (profile) {
            const { data: cachedMatch } = await supabase
              .from('reviewer_article_matches')
              .select('*')
              .eq('article_id', articleId)
              .eq('reviewer_id', reviewer.id)
              .gte('calculated_at', new Date(cacheTime).toISOString())
              .single();

            if (cachedMatch) {
              console.log(`Using cached match for reviewer ${reviewer.name}`);
              return {
                reviewer_id: reviewer.id,
                reviewer_name: reviewer.name,
                reviewer_email: reviewer.email,
                reviewer_affiliation: reviewer.affiliation,
                expertise_areas: reviewer.expertise_areas,
                ...cachedMatch,
              };
            }
          }

          // Calculate new match score if profile exists
          if (profile) {
            console.log(`Calculating match score for reviewer ${reviewer.name}...`);
            console.log('Reviewer profile keywords:', profile.keywords?.slice(0, 10));
            console.log('Article keywords:', articleAnalysis.keywords?.slice(0, 10));

            const matchScore = await calculateMatchingScore(
              { ...profile, users: reviewer }, // Combine profile with user data
              articleAnalysis
            );

            // Store the match score
            const { data: storedMatch } = await supabase
              .from('reviewer_article_matches')
              .upsert(
                {
                  article_id: articleId,
                  reviewer_id: reviewer.id,
                overall_match_score: matchScore.overall_match_score,
                topic_similarity_score: matchScore.topic_similarity_score,
                keyword_overlap_score: matchScore.keyword_overlap_score,
                methodology_match_score: matchScore.methodology_match_score,
                domain_expertise_score: matchScore.domain_expertise_score,
                matching_keywords: matchScore.matching_keywords,
                matching_topics: matchScore.matching_topics,
                mismatch_reasons: matchScore.mismatch_reasons,
                recommendation_level: matchScore.recommendation_level,
                confidence_score: matchScore.confidence_score,
                gemini_model_version: matchScore.gemini_model_version,
                calculated_at: new Date().toISOString(),
              },
              {
                onConflict: 'article_id,reviewer_id',
              }
            )
            .select()
            .single();

            return {
              reviewer_id: reviewer.id,
              reviewer_name: reviewer.name,
              reviewer_email: reviewer.email,
              reviewer_affiliation: reviewer.affiliation,
              expertise_areas: reviewer.expertise_areas,
              ...(storedMatch || matchScore),
            };
          } else {
            // No profile, return basic info with low score
            console.log(`No AI profile for reviewer ${reviewer.name}, using basic info`);
            return {
              reviewer_id: reviewer.id,
              reviewer_name: reviewer.name,
              reviewer_email: reviewer.email,
              reviewer_affiliation: reviewer.affiliation,
              expertise_areas: reviewer.expertise_areas,
              overall_match_score: 0,
              recommendation_level: 'low',
              message: 'No AI profile available',
            };
          }
        } catch (error) {
          console.error(`Error calculating match for reviewer ${reviewer.id}:`, error);
          // Return a default low score if calculation fails
          return {
            reviewer_id: reviewer.id,
            reviewer_name: reviewer.name,
            reviewer_email: reviewer.email,
            reviewer_affiliation: reviewer.affiliation,
            expertise_areas: reviewer.expertise_areas,
            overall_match_score: 0,
            recommendation_level: 'low',
            error: 'Failed to calculate match score',
          };
        }
      })
    );

    // Sort all matches by overall match score descending
    const sortedMatches = matches.sort(
      (a, b) => (b.overall_match_score || 0) - (a.overall_match_score || 0)
    );

    // Filter matches: only include reviewers with good or excellent recommendation
    // Minimum score threshold: 60% (good matches and above)
    const MINIMUM_MATCH_SCORE = 60;

    const filteredMatches = sortedMatches.filter((match) => {
      // Include only if:
      // 1. Has AI match score AND score is >= 60
      // 2. Recommendation level is 'good' or 'excellent' (supports both Turkish and English)
      const hasGoodScore = match.overall_match_score >= MINIMUM_MATCH_SCORE;

      // Support both Turkish and English recommendation levels
      const goodRecommendations = ['good', 'excellent', 'iyi', 'mükemmel'];
      const hasGoodRecommendation = goodRecommendations.includes(match.recommendation_level?.toLowerCase());

      return hasGoodScore && hasGoodRecommendation;
    });

    // Debug: Log all scores
    console.log('=== REVIEWER MATCHING DEBUG ===');
    console.log(`Article: ${article.title}`);
    console.log(`Total reviewers checked: ${matches.length}`);
    console.log('All scores:');
    sortedMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.reviewer_name}: ${match.overall_match_score}% (${match.recommendation_level})`);
      if (match.message || match.error) {
        console.log(`   → ${match.message || match.error}`);
      }
    });
    console.log(`Filtered (60%+ with good/excellent): ${filteredMatches.length}`);
    console.log('===============================');

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
      },
      article_analysis: {
        main_topics: articleAnalysis.main_topics,
        keywords: articleAnalysis.keywords,
        methodology: articleAnalysis.methodology,
        domain: articleAnalysis.research_domain,
      },
      extracted_pdf_text: extractedPdfText ? {
        full_length: extractedPdfText.length,
        excerpt_used_for_analysis: extractedPdfText.substring(0, 4000),
        full_text: extractedPdfText
      } : null,
      matches: filteredMatches,
      total_reviewers: filteredMatches.length,
      filtered_from: matches.length, // Total reviewers checked
      all_matches_debug: sortedMatches, // Return all matches for debugging
      filter_criteria: {
        minimum_score: MINIMUM_MATCH_SCORE,
        recommendation_levels: ['good', 'excellent']
      }
    });
  } catch (error) {
    console.error('Error getting reviewer matches:', error);
    return NextResponse.json(
      {
        error: 'Failed to get reviewer matches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
