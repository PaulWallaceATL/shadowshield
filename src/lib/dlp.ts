import { prisma } from './prisma';
import { classifyContent, isSensitiveContent, ClassificationResult } from './ml-classification';
import { checkExternalDLP, convertExternalResults, ExternalDLPConfig } from './external-dlp';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DLPResult = {
  blocked: boolean;
  flagged: boolean;
  reason?: string;
  rules: any[];
  entities?: Record<string, string[]>;
  confidence?: number;
  mlClassification?: ClassificationResult[];
  isSensitive?: boolean;
  externalResults?: any[];
};

type DLPPattern = {
  type: 'REGEX' | 'KEYWORD' | 'ENTITY';
  pattern: string;
  severity: Severity;
};

// Enhanced patterns for sensitive data
const commonPatterns: Record<string, DLPPattern> = {
  // Financial Information
  creditCard: {
    type: 'REGEX',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})\\b',
    severity: 'HIGH'
  },
  bankAccount: {
    type: 'REGEX',
    pattern: '\\b\\d{8,17}\\b',
    severity: 'HIGH'
  },
  routingNumber: {
    type: 'REGEX',
    pattern: '\\b[0-9]{9}\\b',
    severity: 'HIGH'
  },

  // Personal Identification
  ssn: {
    type: 'REGEX',
    pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b',
    severity: 'CRITICAL'
  },
  ein: {
    type: 'REGEX',
    pattern: '\\b[0-9]{2}-[0-9]{7}\\b',
    severity: 'HIGH'
  },
  passport: {
    type: 'REGEX',
    pattern: '\\b[A-Z][0-9]{8}\\b',
    severity: 'HIGH'
  },
  driversLicense: {
    type: 'REGEX',
    pattern: '\\b[A-Z]\\d{7}\\b',
    severity: 'HIGH'
  },

  // Contact Information
  email: {
    type: 'REGEX',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    severity: 'MEDIUM'
  },
  phone: {
    type: 'REGEX',
    pattern: '\\b(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b',
    severity: 'MEDIUM'
  },
  address: {
    type: 'REGEX',
    pattern: '\\b\\d+\\s+[A-Za-z\\s,]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\\b',
    severity: 'MEDIUM'
  },

  // Network/System Information
  ipAddress: {
    type: 'REGEX',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    severity: 'LOW'
  },
  macAddress: {
    type: 'REGEX',
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b',
    severity: 'LOW'
  },
  apiKey: {
    type: 'REGEX',
    pattern: '\\b(?:sk|pk|api|key|token|secret)_[a-zA-Z0-9]{32,}\\b',
    severity: 'CRITICAL'
  },

  // Healthcare Information (HIPAA)
  medicalRecord: {
    type: 'REGEX',
    pattern: '\\b(?:MRN|Medical Record Number):\\s*\\d{6,10}\\b',
    severity: 'CRITICAL'
  },
  diagnosis: {
    type: 'KEYWORD',
    pattern: 'diagnosis|condition|treatment|prescription|patient|symptoms',
    severity: 'HIGH'
  },

  // Source Code
  sourceCode: {
    type: 'REGEX',
    pattern: '(?:function|class|def|public|private|protected|import|package)\\s+[a-zA-Z_][a-zA-Z0-9_]*',
    severity: 'MEDIUM'
  },

  // Sensitive Keywords
  confidential: {
    type: 'KEYWORD',
    pattern: 'confidential|classified|restricted|internal|proprietary|trade secret|nda|do not share',
    severity: 'HIGH'
  },
  financial: {
    type: 'KEYWORD',
    pattern: 'bank account|routing number|swift code|iban|financial|revenue|profit margin',
    severity: 'HIGH'
  },
  security: {
    type: 'KEYWORD',
    pattern: 'password|credential|authentication|authorization|private key|certificate|encryption',
    severity: 'HIGH'
  }
};

// Entity detection patterns
const entityPatterns = {
  person: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
  organization: /\b[A-Z][a-z]*(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|GmbH|AG|SA|NV|PLC|LLP))?\.?\b/g,
  date: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  money: /\b(?:\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP))\b/g
};

function detectEntities(content: string): Record<string, string[]> {
  const entities: Record<string, string[]> = {};
  
  for (const [type, pattern] of Object.entries(entityPatterns)) {
    const matches = content.match(pattern);
    if (matches) {
      entities[type] = Array.from(new Set(matches));
    }
  }
  
  return entities;
}

function calculateConfidence(matches: number, severity: Severity): number {
  const severityWeight = {
    CRITICAL: 1.0,
    HIGH: 0.8,
    MEDIUM: 0.6,
    LOW: 0.4
  };
  
  return Math.min(matches * severityWeight[severity], 1.0);
}

/**
 * Check content against DLP rules
 */
export async function checkDLPRules(content: string): Promise<DLPResult> {
  console.log('DLP: Starting content check');
  try {
    // Get active DLP rules from the database
    const rules = await prisma.dLPRule.findMany({
      where: { isActive: true }
    });
    console.log('DLP: Found rules:', rules.length);

    const matchedRules = [];
    let highestSeverity: Severity = 'LOW';
    let shouldBlock = false;
    let reason = '';

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(content)) {
          console.log('DLP: Rule matched:', { 
            ruleName: rule.name, 
            severity: rule.severity 
          });
          
          matchedRules.push(rule);
          
          // Update highest severity
          const severityLevels: Record<Severity, number> = {
            'LOW': 0,
            'MEDIUM': 1,
            'HIGH': 2,
            'CRITICAL': 3
          };
          
          if (rule.severity in severityLevels && highestSeverity in severityLevels && 
              severityLevels[rule.severity as Severity] > severityLevels[highestSeverity as Severity]) {
            highestSeverity = rule.severity;
          }

          // Check if content should be blocked
          if (rule.action === 'BLOCK') {
            shouldBlock = true;
            reason = `Content matches blocked pattern: ${rule.name}`;
            break;
          }
        }
      } catch (ruleError) {
        console.error('DLP: Error processing rule:', { 
          ruleId: rule.id, 
          error: ruleError 
        });
        // Continue with next rule
      }
    }

    const result: DLPResult = {
      blocked: shouldBlock,
      flagged: matchedRules.length > 0,
      reason: reason || (matchedRules.length > 0 ? `Content matches ${matchedRules.length} DLP rules` : undefined),
      rules: matchedRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        action: rule.action
      }))
    };

    console.log('DLP: Check completed:', { 
      blocked: result.blocked,
      flagged: result.flagged,
      matchedRules: matchedRules.length
    });

    return result;
  } catch (error) {
    console.error('DLP: Error checking content:', error);
    // Return safe default in case of error
    return {
      blocked: false,
      flagged: false,
      rules: [],
      reason: 'Error checking DLP rules'
    };
  }
}

// Separate pattern matching logic into its own function
async function checkPatternRules(content: string): Promise<DLPResult> {
  const rules = await prisma.dLPRule.findMany({
    where: { isActive: true }
  });

  const matchedRules = [];
  let highestSeverity = 0;
  let blockingReason: string | undefined;
  let totalMatches = 0;

  // Check custom rules from database
  for (const rule of rules) {
    try {
      let matches = false;
      let matchCount = 0;
      
      if (rule.type === 'REGEX') {
        const pattern = new RegExp(rule.pattern, 'gi');
        const matches = content.match(pattern);
        matchCount = matches ? matches.length : 0;
      } else if (rule.type === 'KEYWORD') {
        const keywords = rule.pattern.split('|');
        const keywordMatches = keywords.filter((keyword: string) => 
          content.toLowerCase().includes(keyword.toLowerCase().trim())
        );
        matchCount = keywordMatches.length;
      }

      if (matchCount > 0) {
        totalMatches += matchCount;
        matchedRules.push({
          ...rule,
          matchCount,
          confidence: calculateConfidence(matchCount, rule.severity as Severity)
        });

        const severityMap = {
          'LOW': 1,
          'MEDIUM': 2,
          'HIGH': 3,
          'CRITICAL': 4
        } as const;
        const severityValue = severityMap[rule.severity as Severity] || 0;

        if (severityValue > highestSeverity) {
          highestSeverity = severityValue;
          blockingReason = rule.description || rule.name;
        }
      }
    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
    }
  }

  // Check common patterns
  for (const [name, pattern] of Object.entries(commonPatterns)) {
    try {
      let matchCount = 0;

      if (pattern.type === 'REGEX') {
        const regex = new RegExp(pattern.pattern, 'gi');
        const matches = content.match(regex);
        matchCount = matches ? matches.length : 0;
      } else if (pattern.type === 'KEYWORD') {
        const keywords = pattern.pattern.split('|');
        const keywordMatches = keywords.filter(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase().trim())
        );
        matchCount = keywordMatches.length;
      }

      if (matchCount > 0) {
        totalMatches += matchCount;
        matchedRules.push({
          id: `common_${name}`,
          name: name,
          pattern: pattern.pattern,
          type: pattern.type,
          severity: pattern.severity,
          matchCount,
          confidence: calculateConfidence(matchCount, pattern.severity)
        });

        const severityMap = {
          'LOW': 1,
          'MEDIUM': 2,
          'HIGH': 3,
          'CRITICAL': 4
        } as const;
        const severityValue = severityMap[pattern.severity] || 0;

        if (severityValue > highestSeverity) {
          highestSeverity = severityValue;
          blockingReason = `Detected sensitive ${name} pattern`;
        }
      }
    } catch (error) {
      console.error(`Error checking common pattern ${name}:`, error);
    }
  }

  // Detect entities
  const entities = detectEntities(content);

  const blocked = highestSeverity >= 3;
  const flagged = matchedRules.length > 0;
  const confidence = totalMatches > 0 ? Math.min(totalMatches * 0.2, 1.0) : 0;

  return {
    blocked,
    flagged,
    reason: blocked || flagged ? blockingReason : undefined,
    rules: matchedRules,
    entities,
    confidence
  };
} 