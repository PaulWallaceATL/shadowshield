import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { checkDLPRules } from '@/lib/dlp';

type DLPType = 'REGEX' | 'KEYWORD' | 'ENTITY';
type DLPAction = 'ALERT' | 'BLOCK' | 'REDACT';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Mock the entire prisma module
jest.mock('@/lib/prisma', () => {
  const findMany = jest.fn();
  const create = jest.fn();
  return {
    prisma: {
      dLPRule: { findMany },
      alert: { create },
    },
  };
});

// Import the mocked module
import { prisma } from '@/lib/prisma';

describe('DLP Rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect credit card numbers', async () => {
    const mockRule = {
      id: '1',
      name: 'Credit Card Numbers',
      pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
      description: 'Detects credit card numbers',
      type: 'REGEX' as DLPType,
      severity: 'HIGH' as Severity,
      action: 'BLOCK' as DLPAction,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.mocked(prisma.dLPRule.findMany).mockResolvedValue([mockRule]);

    const result = await checkDLPRules('My credit card is 4111-1111-1111-1111');
    
    expect(result.blocked).toBe(true);
    expect(result.flagged).toBe(true);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].name).toBe('Credit Card Numbers');
  });

  it('should detect sensitive keywords', async () => {
    const mockRule = {
      id: '2',
      name: 'Sensitive Keywords',
      pattern: 'confidential|secret|internal|proprietary',
      description: 'Detects sensitive keywords',
      type: 'KEYWORD' as DLPType,
      severity: 'MEDIUM' as Severity,
      action: 'ALERT' as DLPAction,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.mocked(prisma.dLPRule.findMany).mockResolvedValue([mockRule]);

    const result = await checkDLPRules('This document is confidential');
    
    expect(result.blocked).toBe(false);
    expect(result.flagged).toBe(true);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].name).toBe('Sensitive Keywords');
  });

  it('should allow safe content', async () => {
    jest.mocked(prisma.dLPRule.findMany).mockResolvedValue([]);

    const result = await checkDLPRules('Tell me about machine learning');
    
    expect(result.blocked).toBe(false);
    expect(result.flagged).toBe(false);
    expect(result.rules).toHaveLength(0);
  });
}); 