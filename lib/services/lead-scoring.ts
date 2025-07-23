import { LeadScore, LeadScoringRequest } from '../types/lead-scoring';

export class AILeadScoringService {
  private openaiApiKey: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  async calculateLeadScore(request: LeadScoringRequest): Promise<LeadScore> {
    const { enrichedData, email, companyDomain } = request;

    // Extract key data points for scoring
    const dataPoints = this.extractDataPoints(enrichedData);
    
    // Use AI to analyze and score the lead
    const aiAnalysis = await this.getAIAnalysis(dataPoints, email, companyDomain);
    
    // Calculate component scores
    const factors = {
      companySize: this.scoreCompanySize(dataPoints),
      fundingStage: this.scoreFundingStage(dataPoints),
      growthSignals: this.scoreGrowthSignals(dataPoints),
      contactability: this.scoreContactability(dataPoints, email),
      marketTiming: this.scoreMarketTiming(dataPoints)
    };

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore(factors);
    
    // Determine priority level
    const priority = this.determinePriority(overallScore);

    return {
      overallScore,
      priority,
      factors,
      reasoning: aiAnalysis.reasoning,
      confidence: aiAnalysis.confidence,
      lastUpdated: new Date()
    };
  }

  private extractDataPoints(enrichedData: Record<string, any>) {
    const dataPoints: Record<string, any> = {};
    
    // Extract common enrichment fields
    Object.entries(enrichedData).forEach(([key, value]) => {
      if (typeof value === 'object' && value?.value) {
        const fieldName = key.toLowerCase();
        
        // Company size indicators
        if (fieldName.includes('employee') || fieldName.includes('size')) {
          dataPoints.employeeCount = value.value;
        }
        
        // Funding information
        if (fieldName.includes('funding') || fieldName.includes('investment') || fieldName.includes('raised')) {
          dataPoints.funding = value.value;
        }
        
        // Revenue indicators
        if (fieldName.includes('revenue') || fieldName.includes(' arr') || fieldName.includes('mrr')) {
          dataPoints.revenue = value.value;
        }
        
        // Industry/sector
        if (fieldName.includes('industry') || fieldName.includes('sector') || fieldName.includes('category')) {
          dataPoints.industry = value.value;
        }
        
        // Company stage
        if (fieldName.includes('stage') || fieldName.includes('series')) {
          dataPoints.stage = value.value;
        }
        
        // Executive information
        if (fieldName.includes('ceo') || fieldName.includes('founder') || fieldName.includes('executive')) {
          dataPoints.leadership = value.value;
        }
        
        // Technology stack
        if (fieldName.includes('tech') || fieldName.includes('stack') || fieldName.includes('technology')) {
          dataPoints.technology = value.value;
        }
        
        // Location
        if (fieldName.includes('location') || fieldName.includes('headquarters') || fieldName.includes('based')) {
          dataPoints.location = value.value;
        }

        // Company name
        if (fieldName.includes('company') && fieldName.includes('name')) {
          dataPoints.companyName = value.value;
        }
      }
    });

    return dataPoints;
  }

  private async getAIAnalysis(dataPoints: Record<string, any>, email: string, companyDomain?: string): Promise<{ reasoning: string; confidence: number }> {
    const prompt = `Analyze this lead for sales potential and provide reasoning:

Email: ${email}
Company Domain: ${companyDomain || 'Unknown'}
Available Data: ${JSON.stringify(dataPoints, null, 2)}

Consider:
1. Company growth stage and funding status
2. Market position and competitive landscape
3. Technology adoption and innovation
4. Decision-maker accessibility
5. Timing and market conditions

Provide a brief analysis explaining why this lead should be prioritized (or not) and rate your confidence in the assessment (0-1).

Response format:
{
  "reasoning": "Brief explanation of lead quality and potential",
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
            { role: 'system', content: 'You are an expert sales analyst specializing in B2B lead qualification and prioritization.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      return {
        reasoning: analysis.reasoning || 'AI analysis completed.',
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1)
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        reasoning: 'Lead scoring completed using available data points.',
        confidence: 0.6
      };
    }
  }

  private scoreCompanySize(dataPoints: Record<string, any>) {
    let score = 50; // Default middle score
    let reasoning = 'Company size not available';
    
    if (dataPoints.employeeCount) {
      const employees = this.parseEmployeeCount(dataPoints.employeeCount);
      if (employees > 1000) {
        score = 90;
        reasoning = 'Large enterprise (1000+ employees)';
      } else if (employees > 200) {
        score = 80;
        reasoning = 'Mid-market company (200-1000 employees)';
      } else if (employees > 50) {
        score = 70;
        reasoning = 'Growing company (50-200 employees)';
      } else if (employees > 10) {
        score = 60;
        reasoning = 'Small business (10-50 employees)';
      } else {
        score = 40;
        reasoning = 'Very small team (<10 employees)';
      }
    }

    return { score, reasoning, weight: 0.25 };
  }

  private scoreFundingStage(dataPoints: Record<string, any>) {
    let score = 50;
    let reasoning = 'Funding information not available';
    
    if (dataPoints.funding || dataPoints.stage) {
      const fundingInfo = (dataPoints.funding || dataPoints.stage || '').toLowerCase();
      
      if (fundingInfo.includes('series c') || fundingInfo.includes('series d') || fundingInfo.includes('ipo')) {
        score = 95;
        reasoning = 'Late-stage funded company with proven model';
      } else if (fundingInfo.includes('series b')) {
        score = 85;
        reasoning = 'Series B company with strong growth';
      } else if (fundingInfo.includes('series a')) {
        score = 75;
        reasoning = 'Series A company with market validation';
      } else if (fundingInfo.includes('seed')) {
        score = 65;
        reasoning = 'Seed-stage company with early traction';
      } else if (fundingInfo.includes('bootstrap')) {
        score = 70;
        reasoning = 'Bootstrapped company with sustainable model';
      }
    }

    return { score, reasoning, weight: 0.2 };
  }

  private scoreGrowthSignals(dataPoints: Record<string, any>) {
    let score = 50;
    let reasoning = 'Limited growth signals available';
    
    // Look for growth indicators in various fields
    const signals: string[] = [];
    
    if (dataPoints.revenue) {
      signals.push('Revenue data available');
      score += 15;
    }
    
    if (dataPoints.technology) {
      signals.push('Modern technology stack');
      score += 10;
    }
    
    if (dataPoints.leadership) {
      signals.push('Executive team identified');
      score += 10;
    }

    if (signals.length > 0) {
      reasoning = `Growth signals: ${signals.join(', ')}`;
    }

    return { score: Math.min(score, 100), reasoning, weight: 0.2 };
  }

  private scoreContactability(dataPoints: Record<string, any>, email: string) {
    let score = 60; // Base score for having an email
    let reasoning = 'Email address available';
    
    // Check email domain quality
    const domain = email.split('@')[1]?.toLowerCase() || '';
    
    if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail')) {
      score = 40;
      reasoning = 'Personal email domain - lower contactability';
    } else if (dataPoints.companyName && domain.includes(dataPoints.companyName.toLowerCase().replace(/\s+/g, ''))) {
      score = 80;
      reasoning = 'Corporate email matching company domain';
    } else {
      score = 70;
      reasoning = 'Corporate email domain';
    }

    if (dataPoints.leadership) {
      score += 10;
      reasoning += ' + executive contact identified';
    }

    return { score: Math.min(score, 100), reasoning, weight: 0.15 };
  }

  private scoreMarketTiming(dataPoints: Record<string, any>) {
    let score = 60; // Neutral timing score
    let reasoning = 'Standard market timing';
    
    // Industry-specific timing factors
    if (dataPoints.industry) {
      const industry = dataPoints.industry.toLowerCase();
      
      if (industry.includes('ai') || industry.includes('saas') || industry.includes('fintech')) {
        score = 80;
        reasoning = 'High-growth industry with strong market demand';
      } else if (industry.includes('healthcare') || industry.includes('cybersecurity')) {
        score = 75;
        reasoning = 'Essential industry with consistent demand';
      }
    }

    return { score, reasoning, weight: 0.2 };
  }

  private calculateWeightedScore(factors: any): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.values(factors).forEach((factor: any) => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  private determinePriority(score: number): 'Hot' | 'Warm' | 'Cold' {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    return 'Cold';
  }

  private parseEmployeeCount(employeeStr: string): number {
    const str = employeeStr.toString().toLowerCase();
    
    // Extract numbers from strings like "100-500 employees" or "1000+"
    const matches = str.match(/(\d+)/g);
    if (!matches) return 0;
    
    const numbers = matches.map(Number);
    
    // If range like "100-500", take the average
    if (numbers.length === 2) {
      return Math.round((numbers[0] + numbers[1]) / 2);
    }
    
    // Single number
    return numbers[0] || 0;
  }
} 