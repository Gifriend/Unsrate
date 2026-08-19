import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/id_ID';

export async function seedMessages(prisma: PrismaClient) {
  console.log('Seeding messages for specific matches...');

  const matches = await prisma.match.findMany({
    // Assuming we want to add messages to the first 3 matches created
    // This relies on the order of matches created by seedSwipes.
    // A more robust way would be to select matches based on specific user pairs if known.
    take: 3, 
    orderBy: {
      createdAt: 'asc', // Or any other consistent ordering
    },
    include: {
      userA: true,
      userB: true,
    }
  });

  if (matches.length === 0) {
    console.log('No matches found to seed messages for.');
    return 0;
  }

  let messageCount = 0;
  const messagesToCreate = [];

  for (const match of matches) {
    // Create 2-5 messages for each of these 3 matches
    const numMessages = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < numMessages; i++) {
      // Alternate sender
      const sender = i % 2 === 0 ? match.userA : match.userB;
      messagesToCreate.push({
        matchId: match.id,
        senderId: sender.id,
        content: faker.lorem.sentence(),
        createdAt: faker.date.recent({ days: 7 }), // Messages created in the last week
        isRead: Math.random() < 0.5 // Randomly mark as read
      });
      messageCount++;
    }
  }

  if (messagesToCreate.length > 0) {
    await prisma.message.createMany({
      data: messagesToCreate,
      skipDuplicates: true,
    });
    console.log(`Created ${messageCount} messages for ${matches.length} matches.`);
  } else {
    console.log('No messages were generated.');
  }

  return messageCount;
}
