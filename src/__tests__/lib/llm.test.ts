import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { queryLLM } from '@/lib/llm';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn();
  return {
    Anthropic: jest.fn(() => ({
      messages: { create },
    })),
  };
});

// Import the mocked module
import { Anthropic } from '@anthropic-ai/sdk';

type MockAnthropicInstance = {
  messages: {
    create: jest.Mock;
  };
};

describe('LLM Integration', () => {
  // Using any type for test mock
  let anthropicInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    anthropicInstance = new Anthropic({});
  });

  it('should successfully query Anthropic', async () => {
    const mockResponse = {
      content: [{ text: 'Test response' }],
      usage: { output_tokens: 10 },
    };

    anthropicInstance.messages.create.mockResolvedValue(mockResponse);

    const result = await queryLLM(
      'Test query',
      'ANTHROPIC',
      'claude-3-opus-20240229'
    );

    expect(result.content).toBe('Test response');
    expect(result.provider).toBe('ANTHROPIC');
    expect(result.model).toBe('claude-3-opus-20240229');
    expect(result.tokens).toBe(10);
    expect(result.latency).toBeGreaterThan(0);
  });

  it('should handle provider errors', async () => {
    anthropicInstance.messages.create.mockRejectedValue(new Error('API Error'));

    await expect(
      queryLLM('Test query', 'ANTHROPIC', 'claude-3-opus-20240229')
    ).rejects.toThrow('API Error');
  });

  it('should handle invalid providers', async () => {
    await expect(
      queryLLM('Test query', 'INVALID' as any, 'model')
    ).rejects.toThrow('Unknown provider');
  });

  it('should use default model if none specified', async () => {
    const mockResponse = {
      content: [{ text: 'Test response' }],
      usage: { output_tokens: 10 },
    };

    anthropicInstance.messages.create.mockResolvedValue(mockResponse);

    const result = await queryLLM('Test query', 'ANTHROPIC');

    expect(result.model).toBe('claude-3-opus-20240229'); // Default model
  });
}); 