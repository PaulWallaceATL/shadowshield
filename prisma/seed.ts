import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

type SeedUserInput = {
  email: string;
  name: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  department?: string;
};

async function upsertSeedUser(input: SeedUserInput) {
  const hashedPassword = await hash(input.password, 12);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password: hashedPassword,
      role: input.role,
      isActive: true,
      emailVerified: new Date(),
      department: input.department ?? 'Security',
      mustChangePassword: true
    },
    create: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
      role: input.role,
      isActive: true,
      emailVerified: new Date(),
      department: input.department ?? 'Security',
      mustChangePassword: true
    }
  });
}

async function main() {
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!superAdminPassword) {
    throw new Error('SEED_SUPERADMIN_PASSWORD is required to run prisma seed');
  }

  const superAdmin = await upsertSeedUser({
    email: process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@example.com',
    name: process.env.SEED_SUPERADMIN_NAME ?? 'Platform Super Admin',
    password: superAdminPassword,
    role: 'SUPER_ADMIN',
    department: process.env.SEED_SUPERADMIN_DEPARTMENT ?? 'Security'
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminPassword) {
    await upsertSeedUser({
      email: process.env.SEED_ADMIN_EMAIL ?? 'org-admin@example.com',
      name: process.env.SEED_ADMIN_NAME ?? 'Organization Admin',
      password: adminPassword,
      role: 'ADMIN',
      department: process.env.SEED_ADMIN_DEPARTMENT ?? 'Operations'
    });
  }

  // Create system settings
  await prisma.systemSettings.upsert({
    where: { key: "llm_config" },
    data: {
      key: "llm_config",
      value: JSON.stringify({
        defaultProvider: "ANTHROPIC",
        defaultModel: "claude-3-opus-20240229",
        maxTokens: 4096,
        temperature: 0.7
      })
    },
    update: {
      value: JSON.stringify({
        defaultProvider: "ANTHROPIC",
        defaultModel: "claude-3-opus-20240229",
        maxTokens: 4096,
        temperature: 0.7
      })
    }
  });

  // Create initial DLP rules
  const existingRuleA = await prisma.dLPRule.findFirst({
    where: { name: "Credit Card Numbers" }
  });
  if (!existingRuleA) {
    await prisma.dLPRule.create({
      data: {
        name: "Credit Card Numbers",
        pattern: "\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b",
        description: "Detects credit card numbers",
        type: "REGEX",
        severity: "HIGH",
        action: "BLOCK",
        isActive: true
      }
    });
  }

  const existingRuleB = await prisma.dLPRule.findFirst({
    where: { name: 'Credit Card Detection' }
  });
  if (!existingRuleB) {
    await prisma.dLPRule.create({
      data: {
        name: 'Credit Card Detection',
        pattern: '\\b(?:\\d[ -]*?){13,16}\\b',
        description: 'Detects potential credit card numbers in messages',
        type: 'REGEX',
        severity: 'HIGH',
        action: 'BLOCK',
      },
    });
  }

  const existingTestChat = await prisma.chat.findFirst({
    where: {
      userId: superAdmin.id,
      title: 'OpenAI Test Chat'
    }
  });

  if (!existingTestChat) {
    const testChat = await prisma.chat.create({
      data: {
        title: 'OpenAI Test Chat',
        userId: superAdmin.id,
        provider: 'OPENAI',
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message for OpenAI.',
          },
          {
            role: 'assistant',
            content: 'This is a test response from the OpenAI assistant.',
          }
        ]
      }
    });

    await prisma.query.create({
      data: {
        userId: superAdmin.id,
        provider: 'OPENAI',
        model: 'gpt-4',
        response: 'This is a test response from the OpenAI assistant.',
        latency: 1200,
        tokens: 150,
        content: 'Hello, this is a test message for OpenAI.',
        chatId: testChat.id,
        status: 'PROCESSED',
      }
    });
  }

  console.log('Seeded super admin user:', superAdmin.email);
  console.log('Created/updated base system settings and DLP rules');
  if (adminPassword) {
    console.log('Seeded org admin user:', process.env.SEED_ADMIN_EMAIL ?? 'org-admin@example.com');
  }
  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 