import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasFirecrawl: !!process.env.FIRECRAWL_API_KEY,
    openAIKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : null,
    firecrawlKeyPrefix: process.env.FIRECRAWL_API_KEY ? process.env.FIRECRAWL_API_KEY.substring(0, 10) + '...' : null,
  });
}