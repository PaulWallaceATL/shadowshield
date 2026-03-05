import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export type ClassificationResult = {
  category: string;
  confidence: number;
};

// Categories for sensitive content
export const SENSITIVE_CATEGORIES = [
  'PERSONAL_INFO',
  'FINANCIAL',
  'MEDICAL',
  'SECURITY',
  'CONFIDENTIAL',
  'SOURCE_CODE',
  'GENERAL'
] as const;

export type SensitiveCategory = typeof SENSITIVE_CATEGORIES[number];

// Training data for each category
const trainingData: Record<SensitiveCategory, string[]> = {
  PERSONAL_INFO: [
    'social security number',
    'date of birth',
    'home address',
    'phone number',
    'driver license',
    'passport number',
    'personal identification',
    'identity document'
  ],
  FINANCIAL: [
    'credit card number',
    'bank account',
    'routing number',
    'financial statement',
    'tax return',
    'investment details',
    'payment information'
  ],
  MEDICAL: [
    'medical record',
    'health condition',
    'diagnosis',
    'prescription',
    'treatment plan',
    'healthcare provider',
    'insurance claim'
  ],
  SECURITY: [
    'password',
    'encryption key',
    'access token',
    'security credential',
    'authentication code',
    'private key',
    'certificate'
  ],
  CONFIDENTIAL: [
    'confidential document',
    'trade secret',
    'internal memo',
    'proprietary information',
    'non disclosure agreement',
    'classified information'
  ],
  SOURCE_CODE: [
    'source code',
    'api key',
    'database credentials',
    'configuration file',
    'environment variables',
    'deployment script'
  ],
  GENERAL: [
    'public information',
    'general content',
    'documentation',
    'product description',
    'user guide'
  ]
};

let model: use.UniversalSentenceEncoder | null = null;
let embeddings: Record<SensitiveCategory, tf.Tensor> | null = null;

/**
 * Initialize the ML model and prepare embeddings
 */
export async function initializeModel(): Promise<void> {
  if (!model) {
    model = await use.load();
    embeddings = {} as Record<SensitiveCategory, tf.Tensor>;

    for (const category of SENSITIVE_CATEGORIES) {
      const sentences = trainingData[category];
      const embedding = await model.embed(sentences);
      embeddings[category] = tf.mean(embedding as unknown as tf.Tensor, 0);
    }
  }
}

/**
 * Calculate cosine similarity between two tensors
 */
function cosineSimilarity(a: tf.Tensor, b: tf.Tensor): tf.Tensor {
  return tf.tidy(() => {
    const a1 = a.norm();
    const b1 = b.norm();
    const mul = a.dot(b);
    return mul.div(a1.mul(b1));
  });
}

/**
 * Classify text content using the ML model
 */
export async function classifyContent(content: string): Promise<ClassificationResult[]> {
  // For now, return a simple result
  return [{
    category: 'GENERAL',
    confidence: 0.5
  }];
}

/**
 * Get the most likely category for the content
 */
export async function getPrimaryCategory(content: string): Promise<ClassificationResult> {
  const classifications = await classifyContent(content);
  return classifications[0] || { category: 'GENERAL', confidence: 0 };
}

/**
 * Check if content is likely to be sensitive
 */
export async function isSensitiveContent(content: string): Promise<boolean> {
  const classifications = await classifyContent(content);
  const topResult = classifications[0] || { category: 'GENERAL', confidence: 0 };
  
  // Consider content sensitive if it matches any category other than GENERAL
  // with confidence > 0.6
  return topResult.category !== 'GENERAL' && topResult.confidence > 0.6;
} 