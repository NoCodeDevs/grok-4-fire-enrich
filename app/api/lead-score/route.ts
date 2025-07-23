import { NextRequest, NextResponse } from 'next/server';
import { AILeadScoringService } from '@/lib/services/lead-scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrichedData, email, companyDomain } = body;

    if (!enrichedData || !email) {
      return NextResponse.json(
        { error: 'enrichedData and email are required' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const scoringService = new AILeadScoringService(openaiApiKey);
    const leadScore = await scoringService.calculateLeadScore({
      enrichedData,
      email,
      companyDomain
    });

    return NextResponse.json({ leadScore });
  } catch (error) {
    console.error('Lead scoring error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate lead score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 