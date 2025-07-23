import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { FieldGenerationResponse } from '@/lib/types/field-generation';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OpenAI API key in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error: Missing required API keys. Please contact the administrator.',
          code: 'MISSING_API_KEYS',
          details: {
            missingOpenAI: true
          }
        },
        { status: 500 }
      );
    }

    // Configure OpenAI client with proper options for project API keys
    const apiKey = process.env.OPENAI_API_KEY as string;
    const options: { apiKey: string; organization?: string; projectId?: string } = { apiKey };
    
    // Handle project API keys (sk-proj-*)
    if (apiKey.startsWith('sk-proj-')) {
      console.log('Using OpenAI project API key format in generate-fields');
      // Extract project ID from the key if needed
      // const projectId = apiKey.split('_')[1]; // Example extraction if needed
      // options.projectId = projectId;
    }
    
    const openai = new OpenAI(options);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at understanding data enrichment needs and converting natural language requests into structured field definitions.
          
          When the user describes what data they want to collect about companies, extract each distinct piece of information as a separate field.
          
          Guidelines:
          - Use clear, professional field names (e.g., "Company Size" not "size")
          - Provide helpful descriptions that explain what data should be found
          - Choose appropriate data types:
            - string: for text, URLs, descriptions
            - number: for counts, amounts, years
            - boolean: for yes/no questions
            - array: for lists of items
          - Include example values when helpful
          - Common fields include: Company Name, Description, Industry, Employee Count, Founded Year, Headquarters Location, Website, Funding Amount, etc.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'field_generation',
          strict: true,
          schema: zodResponseFormat(FieldGenerationResponse, 'field_generation').json_schema.schema
        }
      }
    });

    const message = completion.choices[0].message;
    
    if (!message.content) {
      throw new Error('No response content');
    }
    
    const parsed = JSON.parse(message.content) as z.infer<typeof FieldGenerationResponse>;

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error('Field generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate fields',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}