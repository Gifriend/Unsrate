import { PrismaClient, Interest } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/id_ID';

export async function seedUserInterests(prisma: PrismaClient) {
  console.log('Seeding user interests...');

  const users = await prisma.user.findMany({
    // Optionally, take a subset of users for seeding to speed things up
    // take: 10, 
  });

  const interests = await prisma.interest.findMany();

  if (users.length === 0) {
    console.log('No users found to seed interests for.');
    return 0;
  }

  if (interests.length === 0) {
    console.log('No interests found to assign to users. Please seed interests first.');
    return 0;
  }

  let userInterestCount = 0;
  const userInterestCreations = [];

  for (const user of users) {
    // Assign 1 to 5 interests randomly to each user
    const numberOfInterestsToAssign = faker.number.int({ min: 1, max: Math.min(5, interests.length) });
    const selectedInterests: Interest[] = [];
    const availableInterests = [...interests]; // Create a mutable copy

    for (let i = 0; i < numberOfInterestsToAssign; i++) {
      if (availableInterests.length === 0) break; // No more unique interests to assign
      const randomIndex = faker.number.int({ min: 0, max: availableInterests.length - 1 });
      selectedInterests.push(availableInterests.splice(randomIndex, 1)[0]);
    }

    for (const interest of selectedInterests) {
      userInterestCreations.push(
        prisma.userInterest.upsert({
          where: { 
            userId_interestId: { // Prisma convention for composite key field
              userId: user.id,
              interestId: interest.id,
            }
          },
          update: {},
          create: {
            userId: user.id,
            interestId: interest.id,
          },
        })
      );
      userInterestCount++;
    }
  }

  try {
    // Using Promise.all to execute all upsert operations concurrently
    await Promise.all(userInterestCreations);
    console.log(`Successfully created or updated ${userInterestCount} user interest links.`);
  } catch (error) {
    console.error('Error seeding user interests:', error);
  }

  return userInterestCount;
}

