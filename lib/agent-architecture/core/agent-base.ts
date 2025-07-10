import { z } from 'zod';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface AgentContext<T = unknown> {
  input: T;
  history: Message[];
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface HandoffConfig<T = unknown> {
  agent: BaseAgent<unknown, unknown>;
  when?: (context: AgentContext<T>) => boolean;
  inputTransform?: (input: T) => unknown;
  onHandoff?: (context: AgentContext<T>, targetAgent: BaseAgent<unknown, unknown>) => void;
}

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  // Add apiKey declaration
  protected apiKey: string;
  // Add base URL for xAI API
  protected baseURL: string = 'https://api.x.ai/v1';
  
  constructor(
    public name: string,
    public description: string,
    public inputSchema?: z.ZodSchema<TInput>,
    public outputSchema?: z.ZodSchema<TOutput>
  ) {
    // Set apiKey from environment
    this.apiKey = process.env.GROK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY not found in environment');
    }
    // Removed OpenAI initialization
  }
  
  abstract instructions(context: AgentContext<TInput>): string;
  
  abstract tools(): ChatCompletionTool[];
  
  handoffs(): HandoffConfig<TInput>[] {
    return [];
  }
  
  async execute(context: AgentContext<TInput>): Promise<TOutput> {
    console.log(`[BaseAgent] Executing ${this.name} using grok 4 model`);
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.instructions(context),
      },
      ...context.history,
      {
        role: 'user',
        content: JSON.stringify(context.input),
      },
    ];
    
    const tools = this.tools();
    const handoffs = this.handoffs();
    
    // Add handoff tools
    const handoffTools: ChatCompletionTool[] = handoffs.map((handoff) => ({
      type: 'function' as const,
      function: {
        name: `handoff_to_${handoff.agent.name.toLowerCase().replace(/\s+/g, '_')}`,
        description: `Hand off to ${handoff.agent.name}: ${handoff.agent.description}`,
        parameters: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Data to pass to the next agent'
            }
          },
          required: ['data']
        },
      },
    }));
    
    const allTools = [...tools, ...handoffTools];
    
    // Use fetch to call xAI API
    const apiResponse = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4',
        messages,
        tools: allTools.length > 0 ? allTools : null,
        response_format: this.outputSchema ? { type: 'json_object' } : undefined,
        reasoning_effort: 'low',
      }),
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error?.message || 'xAI API error');
    }
    
    const response = await apiResponse.json();
    
    const message = response.choices[0].message;
    
    // Check for handoffs
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const handoffIndex = handoffTools.findIndex(
          t => t.function.name === toolCall.function.name
        );
        
        if (handoffIndex >= 0) {
          const handoff = handoffs[handoffIndex];
          const handoffInput = JSON.parse(toolCall.function.arguments);
          
          // Execute handoff
          if (handoff.onHandoff) {
            handoff.onHandoff(context, handoff.agent);
          }
          
          const transformedInput = handoff.inputTransform 
            ? handoff.inputTransform(handoffInput)
            : handoffInput;
          
          const handoffContext: AgentContext<unknown> = {
            input: transformedInput,
            history: [...context.history, {
              role: message.role,
              content: message.content || ''
            }],
            metadata: { ...context.metadata, previousAgent: this.name },
          };
          
          return await handoff.agent.execute(handoffContext) as TOutput;
        }
      }
      
      // Handle regular tool calls
      // ... implement tool execution
    }
    
    // Parse output
    if (this.outputSchema && message.content) {
      try {
        const parsed = JSON.parse(message.content);
        return this.outputSchema.parse(parsed);
      } catch (error) {
        console.error('Failed to parse agent output:', error instanceof Error ? error.message : String(error));
        throw error;
      }
    }
    
    return message.content as TOutput;
  }
}