import { PersonalizedEmail, EmailGenerationRequest, LeadScore } from '../types/lead-scoring';

export class AIEmailGeneratorService {
  private openaiApiKey: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  async generatePersonalizedEmail(request: EmailGenerationRequest): Promise<PersonalizedEmail> {
    const { enrichedData, leadScore, email, senderName = 'Your Name', senderCompany = 'Your Company', tone = 'professional' } = request;

    // Extract personalization data
    const personalizations = this.extractPersonalizations(enrichedData, email);
    
    // Generate email using AI
    const aiEmail = await this.generateEmailWithAI(personalizations, leadScore, tone, senderName, senderCompany);
    
    return {
      subject: aiEmail.subject,
      body: aiEmail.body,
      reasoning: aiEmail.reasoning,
      personalizations,
      tone,
      confidence: aiEmail.confidence
    };
  }

  private extractPersonalizations(enrichedData: Record<string, any>, email: string) {
    const personalizations = {
      companyMention: '',
      executiveMention: '',
      industryRelevance: '',
      valueProposition: ''
    };

    // Extract company name
    const companyField = Object.entries(enrichedData).find(([key]) => 
      key.toLowerCase().includes('company') && key.toLowerCase().includes('name')
    );
    if (companyField && companyField[1]?.value) {
      personalizations.companyMention = companyField[1].value;
    } else {
      // Fallback to domain
      const domain = email.split('@')[1]?.replace('.com', '').replace('.io', '').replace('.co', '');
      personalizations.companyMention = domain ? this.capitalize(domain) : 'your company';
    }

    // Extract executive information
    const execFields = Object.entries(enrichedData).filter(([key]) => 
      key.toLowerCase().includes('ceo') || 
      key.toLowerCase().includes('founder') || 
      key.toLowerCase().includes('executive')
    );
    if (execFields.length > 0 && execFields[0][1]?.value) {
      personalizations.executiveMention = execFields[0][1].value;
    }

    // Extract industry
    const industryField = Object.entries(enrichedData).find(([key]) => 
      key.toLowerCase().includes('industry') || 
      key.toLowerCase().includes('sector') ||
      key.toLowerCase().includes('category')
    );
    if (industryField && industryField[1]?.value) {
      personalizations.industryRelevance = industryField[1].value;
    }

    // Build value proposition based on available data
    personalizations.valueProposition = this.buildValueProposition(enrichedData);

    return personalizations;
  }

  private buildValueProposition(enrichedData: Record<string, any>): string {
    const dataTypes = Object.keys(enrichedData).map(key => key.toLowerCase());
    
    if (dataTypes.some(key => key.includes('fund') || key.includes('investment'))) {
      return 'accelerate your growth trajectory';
    } else if (dataTypes.some(key => key.includes('tech') || key.includes('product'))) {
      return 'optimize your technology stack and product development';
    } else if (dataTypes.some(key => key.includes('employee') || key.includes('size'))) {
      return 'scale your operations efficiently';
    } else {
      return 'drive your business forward';
    }
  }

  private async generateEmailWithAI(
    personalizations: any, 
    leadScore: LeadScore, 
    tone: string, 
    senderName: string, 
    senderCompany: string
  ): Promise<{ subject: string; body: string; reasoning: string; confidence: number }> {
    
    const prompt = `Generate a personalized cold outreach email with the following information:

RECIPIENT DETAILS:
- Company: ${personalizations.companyMention}
- Executive: ${personalizations.executiveMention || 'Not available'}
- Industry: ${personalizations.industryRelevance || 'Not specified'}

LEAD SCORE: ${leadScore.overallScore}/100 (${leadScore.priority})
LEAD INSIGHTS: ${leadScore.reasoning}

SENDER DETAILS:
- Name: ${senderName}
- Company: ${senderCompany}

EMAIL TONE: ${tone}
VALUE PROPOSITION: Help them ${personalizations.valueProposition}

REQUIREMENTS:
1. Subject line should be compelling and personalized
2. Email should be 3-4 short paragraphs maximum
3. Include specific mentions of their company/executive when available
4. Reference their industry or business context
5. Clear, specific call-to-action
6. Match the requested tone (${tone})
7. Don't be overly salesy - focus on value and relevance

Based on the lead score (${leadScore.priority} priority), adjust the approach:
- Hot leads: More direct, executive-level messaging
- Warm leads: Balanced approach with clear value prop
- Cold leads: Softer approach, focus on education/insights

Response format:
{
  "subject": "Compelling subject line",
  "body": "Email body with proper line breaks",
  "reasoning": "Brief explanation of the personalization strategy used",
  "confidence": 0.85
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert sales copywriter specializing in personalized B2B cold outreach. You write compelling emails that get responses by focusing on value, relevance, and authentic personalization.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const emailData = JSON.parse(data.choices[0].message.content);
      
      return {
        subject: emailData.subject || `Quick question about ${personalizations.companyMention}`,
        body: emailData.body || this.generateFallbackEmail(personalizations, senderName, senderCompany),
        reasoning: emailData.reasoning || 'Email generated using available company data and lead insights.',
        confidence: Math.min(Math.max(emailData.confidence || 0.7, 0), 1)
      };
    } catch (error) {
      console.error('AI email generation failed:', error);
      return {
        subject: `Quick question about ${personalizations.companyMention}`,
        body: this.generateFallbackEmail(personalizations, senderName, senderCompany),
        reasoning: 'Fallback email template used due to AI service unavailability.',
        confidence: 0.6
      };
    }
  }

  private generateFallbackEmail(personalizations: any, senderName: string, senderCompany: string): string {
    return `Hi there,

I came across ${personalizations.companyMention} and was impressed by ${personalizations.industryRelevance ? `your work in ${personalizations.industryRelevance}` : 'what you\'re building'}.

${personalizations.executiveMention ? `I noticed ${personalizations.executiveMention} is leading the team` : 'Your team seems to be doing great work'}, and I thought you might be interested in how we help companies like yours ${personalizations.valueProposition}.

Would you be open to a brief 15-minute conversation this week to explore if there's a potential fit?

Best regards,
${senderName}
${senderCompany}`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 