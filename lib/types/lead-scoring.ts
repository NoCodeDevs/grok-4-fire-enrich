export interface LeadScore {
  overallScore: number; // 0-100
  priority: 'Hot' | 'Warm' | 'Cold';
  factors: {
    companySize: {
      score: number;
      reasoning: string;
      weight: number;
    };
    fundingStage: {
      score: number;
      reasoning: string;
      weight: number;
    };
    growthSignals: {
      score: number;
      reasoning: string;
      weight: number;
    };
    contactability: {
      score: number;
      reasoning: string;
      weight: number;
    };
    marketTiming: {
      score: number;
      reasoning: string;
      weight: number;
    };
  };
  reasoning: string;
  confidence: number; // 0-1
  lastUpdated: Date;
}

export interface PersonalizedEmail {
  subject: string;
  body: string;
  reasoning: string;
  personalizations: {
    companyMention: string;
    executiveMention: string;
    industryRelevance: string;
    valueProposition: string;
  };
  tone: 'professional' | 'casual' | 'executive';
  confidence: number;
}

export interface LeadScoringRequest {
  enrichedData: Record<string, any>;
  email: string;
  companyDomain?: string;
}

export interface EmailGenerationRequest {
  enrichedData: Record<string, any>;
  leadScore: LeadScore;
  email: string;
  senderName?: string;
  senderCompany?: string;
  tone?: 'professional' | 'casual' | 'executive';
} 