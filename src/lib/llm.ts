import Anthropic from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

type LLMResponse = {
  content: string;
  latency: number;
  tokens: number;
  provider: string;
  model: string;
};

export async function queryLLM(
  content: string,
  provider: string,
  model: string,
  isAdmin: boolean = false
): Promise<LLMResponse> {
  const startTime = Date.now();

  try {
    switch (provider) {
      case 'ANTHROPIC': {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          if (isAdmin) {
            console.warn('Anthropic API key not configured, but proceeding for admin with mock response');
            // Return a mock response for admin testing
            return {
              content: `[ADMIN TEST MODE] This is a mock response for admin testing. The Anthropic API key is not configured.\n\nYour query was: "${content}"`,
              latency: 0,
              tokens: 0,
              provider,
              model,
            };
          }
          throw new Error('Anthropic API key not configured');
        }

        const anthropic = new Anthropic({
          apiKey: apiKey,
        });

        try {
          console.log('Sending request to Anthropic:', { model, content });
          
          const response = await anthropic.messages.create({
            model: model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: content }],
            system: "You are a helpful AI assistant."
          });

          console.log('Received response from Anthropic:', JSON.stringify(response, null, 2));

          // Safely extract the response content
          let responseContent = '';
          if (response.content && Array.isArray(response.content)) {
            for (const block of response.content) {
              if ('type' in block && block.type === 'text') {
                responseContent += block.text;
              }
            }
          }
          
          if (!responseContent) {
            console.error('Empty response from Anthropic:', response);
            throw new Error('Empty response from Anthropic API');
          }

          return {
            content: responseContent,
            latency: Date.now() - startTime,
            tokens: response.usage?.output_tokens || 0,
            provider,
            model,
          };
        } catch (anthropicError) {
          console.error('Anthropic API error:', anthropicError);
          if (anthropicError instanceof Error) {
            console.error('Error details:', {
              message: anthropicError.message,
              stack: anthropicError.stack,
              name: anthropicError.name
            });
          }
          throw new Error(
            anthropicError instanceof Error 
              ? `Anthropic API error: ${anthropicError.message}`
              : 'Failed to query Anthropic API'
          );
        }
      }

      case 'OPENAI': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          if (isAdmin) {
            console.warn('OpenAI API key not configured, but proceeding for admin with mock response');
            // Return a mock response for admin testing
            return {
              content: `[ADMIN TEST MODE] This is a mock response for admin testing. The OpenAI API key is not configured.\n\nYour query was: "${content}"`,
              latency: 0,
              tokens: 0,
              provider,
              model,
            };
          }
          throw new Error('OpenAI API key not configured');
        }

        const openai = new OpenAI({
          apiKey: apiKey,
        });

        try {
          const response = await openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: content }],
          });

          return {
            content: response.choices[0]?.message?.content || '',
            latency: Date.now() - startTime,
            tokens: response.usage?.total_tokens || 0,
            provider,
            model,
          };
        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
          throw new Error(
            openaiError instanceof Error 
              ? `OpenAI API error: ${openaiError.message}`
              : 'Failed to query OpenAI API'
          );
        }
      }

      case 'GOOGLE': {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          if (isAdmin) {
            console.warn('Google API key not configured, but proceeding for admin with mock response');
            // Return a mock response for admin testing
            return {
              content: `[ADMIN TEST MODE] This is a mock response for admin testing. The Google API key is not configured.\n\nYour query was: "${content}"`,
              latency: 0,
              tokens: 0,
              provider,
              model,
            };
          }
          throw new Error('Google API key not configured');
        }

        console.log('Initializing Google AI with model:', model);
        console.log('Google API key format check:', {
          length: apiKey.length,
          prefix: apiKey.substring(0, 6) + '...',
          suffix: '...' + apiKey.substring(apiKey.length - 4),
          containsSpecialChars: /[^a-zA-Z0-9-_]/.test(apiKey)
        });
        
        try {
          // Use the Google Generative AI SDK instead of direct REST API calls
          const genAI = new GoogleGenerativeAI(apiKey);
          
          // Map UI model names to actual API model names
          // This ensures backward compatibility if model names change
          const modelMapping: Record<string, string> = {
            'gemini-pro': 'gemini-pro',
            'gemini-1.5-pro': 'gemini-1.5-pro',
            'gemini-2.0-flash': 'gemini-2.0-flash',
            // Add any future model mappings here
          };
          
          // Use the mapped model name or fallback to the original
          const apiModelName = modelMapping[model] || model;
          console.log('Using API model name:', apiModelName);
          
          // Use a try/catch to fallback to alternative model names if needed
          try {
            const geminiModel = genAI.getGenerativeModel({ 
              model: apiModelName,
              // Add safety settings to reduce likelihood of content being flagged
              safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                  category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                  category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                  category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                }
              ]
            });
            
            // Use a more balanced system prompt to help with content moderation
            const generationConfig = {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            };
            
            console.log('Sending request to Google AI with model:', apiModelName);
            
            const result = await geminiModel.generateContent(content);
            const response = await result.response;
            const text = response.text();

            return {
              content: text,
              latency: Date.now() - startTime,
              tokens: 0,
              provider,
              model,
            };
          } catch (modelError) {
            console.error('Error with model format, trying alternative format:', modelError);
            throw modelError; // Re-throw to be handled by outer catch
          }
        } catch (googleError) {
          console.error('Google API error:', {
            error: googleError,
            message: googleError instanceof Error ? googleError.message : 'Unknown error',
            stack: googleError instanceof Error ? googleError.stack : undefined,
            model: model,
            apiKeyLength: apiKey.length,
            apiKeyPrefix: apiKey.substring(0, 10) + '...'
          });
          
          const msg = googleError instanceof Error ? googleError.message : String(googleError);

          if (msg.includes('quota') || msg.includes('429') || msg.includes('Too Many Requests')) {
            throw new Error('Google Gemini API quota exceeded. Please check your billing at https://ai.google.dev or try another provider.');
          }

          if (msg.includes('content violates') || msg.includes('blocked') || msg.includes('safety')) {
            throw new Error(`Google Gemini content policy: ${msg}. Try rephrasing your query.`);
          }

          throw new Error(`Google API error: ${msg}`);
        }
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error querying ${provider} LLM:`, error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
} 