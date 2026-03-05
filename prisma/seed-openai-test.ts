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

  // Add test chat for OpenAI provider
  const testChat = await prisma.chat.create({
    data: {
      title: 'OpenAI Test Chat',
      userId: adminUser.id,
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

  // Add a query for the test chat
  await prisma.query.create({
    data: {
      userId: adminUser.id,
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

  console.log('Added test chat for OpenAI provider');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 