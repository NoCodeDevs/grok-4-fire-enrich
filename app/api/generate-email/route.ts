import { NextRequest, NextResponse } from 'next/server';
import { AIEmailGeneratorService } from '@/lib/services/email-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrichedData, leadScore, email, senderName, senderCompany, tone } = body;

    if (!enrichedData || !leadScore || !email) {
      return NextResponse.json(
        { error: 'enrichedData, leadScore, and email are required' },
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

    const emailService = new AIEmailGeneratorService(openaiApiKey);
    const personalizedEmail = await emailService.generatePersonalizedEmail({
      enrichedData,
      leadScore,
      email,
      senderName,
      senderCompany,
      tone
    });

    return NextResponse.json({ email: personalizedEmail });
  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate personalized email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 