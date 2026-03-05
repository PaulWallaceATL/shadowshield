import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (!adminUser) {
    console.error('No admin user found. Please run the main seed script first.');
    return;
  }

  // Find an existing chat for this user or create one
  const existingChat = await prisma.chat.findFirst({
    where: {
      userId: adminUser.id,
    },
  });

  const chatId = existingChat ? existingChat.id : (await prisma.chat.create({
    data: {
      title: 'DLP Test Chat',
      userId: adminUser.id,
      provider: 'ANTHROPIC',
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: 'Here is my credit card 1234 5678 9012 3456',
        },
        {
          role: 'assistant',
          content: 'I cannot process that credit card information for security reasons.',
        }
      ]
    }
  })).id;

  // Add flagged queries for each provider
  const providers = ['ANTHROPIC', 'OPENAI', 'GOOGLE'];
  
  for (const provider of providers) {
    // Create 3 flagged queries for each provider
    for (let i = 0; i < 3; i++) {
      await prisma.query.create({
        data: {
          userId: adminUser.id,
          provider,
          model: provider === 'ANTHROPIC' ? 'claude-3-opus-20240229' : 
                 provider === 'OPENAI' ? 'gpt-4' : 'gemini-1.5-pro',
          response: 'This query was flagged by DLP rules for containing sensitive information.',
          latency: 1000 + Math.floor(Math.random() * 2000),
          tokens: 100 + Math.floor(Math.random() * 200),
          content: `Here is my credit card 4${i}32 5678 9012 345${i}`,
          chatId: chatId,
          status: 'FLAGGED',
        }
      });
    }
    
    console.log(`Added 3 DLP violations for ${provider}`);
  }

  // Create an alert for the last query
  await prisma.alert.create({
    data: {
      message: 'Credit card information detected',
      metadata: { rule: 'Credit Card Detection', severity: 'HIGH' },
      userId: adminUser.id,
      type: 'DLP',
      severity: 'HIGH',
      status: 'PENDING',
      chatId: chatId,
      queryId: (await prisma.query.findFirst({
        where: { status: 'FLAGGED' },
        orderBy: { createdAt: 'desc' }
      }))?.id
    }
  });

  console.log(`Added DLP violation records for all providers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {}; // Add empty export to make it a module 