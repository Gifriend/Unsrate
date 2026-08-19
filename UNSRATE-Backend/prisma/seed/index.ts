import { PrismaClient } from '@prisma/client'; // Removed Gender, SwipeAction as they are not directly used here
import { faker } from '@faker-js/faker/locale/id_ID';
import { seedUsers } from './users';
import { seedSwipes } from './swipes';
import { seedMessages } from './messages';
import { seedUserInterests } from './userInterests';

// Define interests directly in this file
const interestsArray = [
  "Coding", "Gaming", "Movies", "Music", "Travel", "Sports", "Reading", 
  "Cooking", "Art", "Photography", "Dancing", "Writing", "Yoga", "Hiking",
  "Volunteering", "Fashion", "Technology", "Science", "History", "Languages"
];

/**
 * Assign interests to users
 */
export async function assignInterests(
  prisma: PrismaClient, 
  users: { id: string }[], // Specify a more concrete type for users
  dbInterests: { id: string }[] // Specify a more concrete type for interests
) {
  console.log('Assigning interests to users via assignInterests function...');
  
  const userInterestsData = [];
  if (users.length === 0 || dbInterests.length === 0) {
    console.log('No users or interests provided to assignInterests function. Skipping.');
    return;
  }

  for (const user of users) {
    const userInterestCount = faker.number.int({ min: 2, max: Math.min(6, dbInterests.length) });
    if (userInterestCount === 0) continue;
    const selectedInterests = faker.helpers.arrayElements(dbInterests, userInterestCount);
    
    for (const interest of selectedInterests) {
      userInterestsData.push({
        userId: user.id,
        interestId: interest.id
      });
    }
  }
  
  if (userInterestsData.length === 0) {
    console.log('No user interests were generated to assign.');
    return;
  }
  
  const batchSize = 100;
  for (let i = 0; i < userInterestsData.length; i += batchSize) {
    const batch = userInterestsData.slice(i, i + batchSize);
    await prisma.userInterest.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
  
  console.log(`Assigned ${userInterestsData.length} interests via assignInterests function`);
}

async function seedAll(prisma: PrismaClient) {
  console.log('Running full seeding process (seedAll)...');

  console.log('Cleaning up existing data for full seed...');
  await prisma.message.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.swipe.deleteMany({});
  await prisma.userInterest.deleteMany({});
  await prisma.interest.deleteMany({});
  await prisma.token.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleaned successfully for full seed.');

  console.log('Creating interests...');
  await prisma.interest.createMany({
    data: interestsArray.map(name => ({ name }))
  });
  const dbInterests = await prisma.interest.findMany();
  console.log(`Created ${dbInterests.length} interests`);

  const createdUsers = await seedUsers(prisma, 10); 

  if (createdUsers.length > 0 && dbInterests.length > 0) {
    await assignInterests(prisma, createdUsers, dbInterests);
  } else {
    console.log('Skipping initial assignInterests: No new users or no base interests found.');
  }

  let swipeStats = { swipeCount: 0, matchCount: 0 };
  if (createdUsers.length > 0) {
    swipeStats = await seedSwipes(prisma, createdUsers);
  } else {
    console.log('Skipping seedSwipes: No users available for swiping.');
  }
  
  let messageCount = 0;
  const matchesExist = await prisma.match.count();
  if (matchesExist > 0) {
    messageCount = await seedMessages(prisma);
  } else {
    console.log('Skipping seedMessages: No matches found.');
  }
  
  // This will attempt to link any users (including newly created) with interests.
  // It's good as a comprehensive pass.
  await seedUserInterests(prisma);

  console.log('\n===== Seeding Summary (Full Seed) =====');
  console.log(`Created ${createdUsers.length} users`);
  console.log(`Created ${dbInterests.length} interests`);
  // assignInterests and seedUserInterests log their own counts
  console.log(`Created ${swipeStats.swipeCount} swipes`);
  console.log(`Created ${swipeStats.matchCount} matches`);
  console.log(`Created ${messageCount} messages`);
  console.log('======================================\n');

  console.log('Full seeding completed successfully!');
}

async function main() {
  const prisma = new PrismaClient();
  const choice = process.argv[2]?.toLowerCase();

  try {
    console.log('Starting database seeding script...');

    if (!choice || choice === 'all') {
      await seedAll(prisma);
    } else if (choice === 'users') {
      console.log('Seeding users only...');
      console.log('Cleaning user-related tables (User, Token, UserInterest, Swipe, Match, Message)...');
      await prisma.message.deleteMany({});
      await prisma.match.deleteMany({});
      await prisma.swipe.deleteMany({});
      await prisma.userInterest.deleteMany({});
      await prisma.token.deleteMany({});
      await prisma.user.deleteMany({});
      console.log('Cleaned user-related tables.');
      const users = await seedUsers(prisma, 10);
      console.log(`Created ${users.length} users.`);
      console.log('Note: Interests are not automatically assigned. Run "userinterests" or "all" to link users and interests.');
    } else if (choice === 'interest' || choice === 'interests') {
      console.log('Seeding interests only...');
      console.log('Cleaning interest-related tables (Interest, UserInterest)...');
      await prisma.userInterest.deleteMany({});
      await prisma.interest.deleteMany({});
      console.log('Cleaned interest-related tables.');
      await prisma.interest.createMany({
        data: interestsArray.map(name => ({ name }))
      });
      const dbInterests = await prisma.interest.findMany();
      console.log(`Created ${dbInterests.length} interests.`);
    } else if (choice === 'userinterests') {
      console.log('Seeding user interests links...');
      console.log('Cleaning UserInterest table...');
      await prisma.userInterest.deleteMany({});
      console.log('Cleaned UserInterest table.');

      const existingUsers = await prisma.user.findMany({select: {id: true}});
      const existingDbInterests = await prisma.interest.findMany({select: {id: true}});

      if (existingUsers.length > 0 && existingDbInterests.length > 0) {
        console.log('Running assignInterests for existing users and interests...');
        await assignInterests(prisma, existingUsers, existingDbInterests);
      } else {
        console.log('Skipping assignInterests: No users or no interests found in the database. Seed them first.');
      }
      
      console.log('Running seedUserInterests for a comprehensive pass...');
      await seedUserInterests(prisma); // This function logs its own success/count
    } else if (choice === 'swipes') {
      console.log('Seeding swipes and resulting matches...');
      console.log('Cleaning swipe-related tables (Swipe, Match, Message)...');
      await prisma.message.deleteMany({});
      await prisma.match.deleteMany({});
      await prisma.swipe.deleteMany({});
      console.log('Cleaned swipe, match, and message tables.');
      const users = await prisma.user.findMany(); // seedSwipes needs full user objects
      if (users.length > 0) {
        const swipeStats = await seedSwipes(prisma, users);
        console.log(`Created ${swipeStats.swipeCount} swipes and ${swipeStats.matchCount} matches.`);
        if (swipeStats.matchCount === 0) {
            console.log("No new matches were created from these swipes.");
        }
      } else {
        console.log('Skipping swipe seeding: No users found. Seed users first.');
      }
    } else if (choice === 'message' || choice === 'messages') {
      console.log('Seeding messages...');
      console.log('Cleaning Message table...');
      await prisma.message.deleteMany({});
      console.log('Cleaned Message table.');
      const matchesCount = await prisma.match.count();
      if (matchesCount > 0) {
        const messageCount = await seedMessages(prisma);
        console.log(`Created ${messageCount} messages.`);
      } else {
        console.log('Skipping message seeding: No matches found. Seed swipes to create matches first.');
      }
    } else {
      console.log(`Invalid choice: '${choice}'.`);
      console.log('Available choices: users, interest, userinterests, swipes, message, all (or no argument for all).');
    }

    if (choice && choice !== 'all') {
        console.log(`\nSeeding for '${choice}' part completed.`);
    }

  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  }
}

main()
  .then(() => {
    if (process.exitCode === 1) {
        console.log("Seeding script finished with errors.");
    } else {
        console.log("Seeding script finished successfully.");
    }
    // Node.js will exit with process.exitCode (or 0 if not set)
  })
  .catch((e) => {
    console.error('Unhandled critical error at the end of seeding script execution:', e);
    process.exit(1); // Force exit with error for unhandled promise rejections from main
  });