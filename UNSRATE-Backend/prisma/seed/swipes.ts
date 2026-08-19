import { PrismaClient, SwipeAction, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/id_ID'; // Ensure faker is imported

/**
 * Select a random pair of users that haven't swiped on each other
 */
function selectRandomUserPair(users: any[], existingPairs: Set<string>) {
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  if (users.length < 2) {
    // Not enough users to form a pair, return a placeholder or handle error
    // This case should ideally be handled before calling this function if distinct users are mandatory
    return [users[0], users[0]]; 
  }

  while (attempts < maxAttempts) {
    const userA = faker.helpers.arrayElement(users);
    const userB = faker.helpers.arrayElement(users);

    // Skip if same user
    if (userA.id === userB.id) {
      attempts++;
      continue;
    }

    // Check if this pair (in either order) has already been processed
    const pairKey1 = `${userA.id}_${userB.id}`;
    const pairKey2 = `${userB.id}_${userA.id}`;

    if (!existingPairs.has(pairKey1) && !existingPairs.has(pairKey2)) {
      return [userA, userB];
    }

    attempts++;
  }

  // Fallback: If no unique pair is found after maxAttempts,
  // try to return any two distinct users. This might not be ideal if all pairs are exhausted.
  // For robust seeding, ensure enough unique user combinations exist.
  let fallbackUserA = users[0];
  let fallbackUserB = users[1];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const pairKey1 = `${users[i].id}_${users[j].id}`;
      const pairKey2 = `${users[j].id}_${users[i].id}`;
      if (!existingPairs.has(pairKey1) && !existingPairs.has(pairKey2)) {
        return [users[i], users[j]];
      }
    }
  }
  // If truly all pairs are exhausted, return the first two (or duplicates if <2 users)
  return [fallbackUserA, fallbackUserB]; 
}

/**
 * Create swipes between users and generate matches for mutual likes
 */
export async function seedSwipes(prisma: PrismaClient, users: any[]) {
  console.log('Creating swipes and potential matches...');
  
  const swipes = [];
  const potentialMatches = new Map<string, { userAId: string, userBId: string }>();
  
  // Ensure there are at least 6 users to create 3 matches
  if (users.length < 6) {
    console.log('Not enough users to create 3 specific matches. Need at least 6 users.');
    // Fallback or error, for now, we'll proceed but might not get 3 matches
  }

  const maleUsers = users.filter(u => u.gender === Gender.MALE);
  const femaleUsers = users.filter(u => u.gender === Gender.FEMALE);

  // Create up to 3 specific matches
  const matchesToCreate = Math.min(3, maleUsers.length, femaleUsers.length);

  for (let i = 0; i < matchesToCreate; i++) {
    const userA = maleUsers[i];
    const userB = femaleUsers[i];

    if (userA && userB) {
      // User A likes User B
      swipes.push({
        swiperUserId: userA.id,
        swipedUserId: userB.id,
        action: SwipeAction.LIKE
      });

      // User B likes User A
      swipes.push({
        swiperUserId: userB.id,
        swipedUserId: userA.id,
        action: SwipeAction.LIKE
      });

      // Track the potential match
      const [userAId, userBId] = [userA.id, userB.id].sort(); // Ensure consistent key
      const matchKey = `${userAId}_${userBId}`;
      if (!potentialMatches.has(matchKey)) {
        potentialMatches.set(matchKey, { userAId, userBId });
      }
      console.log(`Created a specific swipe interaction for a match between ${userA.fullname} and ${userB.fullname}`);
    }
  }
  
  // Create a reasonable number of additional random swipes based on user count
  // This part can be adjusted if you only want the specific matches to have a high chance of forming
  const additionalSwipeCount = Math.min(20, users.length * 2); // Reduced random swipes
  
  // Set to track pairs that have already swiped to prevent duplicates
  const existingPairs = new Set<string>();
  // Add already processed specific pairs to existingPairs to avoid re-swiping them randomly
  potentialMatches.forEach(match => {
    existingPairs.add(`${match.userAId}_${match.userBId}`);
    existingPairs.add(`${match.userBId}_${match.userAId}`);
  });


  for (let i = 0; i < additionalSwipeCount; i++) {
    // Select random users that haven't swiped on each other yet
    const [swiper, swiped] = selectRandomUserPair(users, existingPairs);
    
    // Create a unique key for this pair
    const pairKey = `${swiper.id}_${swiped.id}`;
    existingPairs.add(pairKey);
    
    // 70% chance of LIKE, 30% chance of DISLIKE
    const action = Math.random() < 0.7 ? SwipeAction.LIKE : SwipeAction.DISLIKE;
    
    swipes.push({
      swiperUserId: swiper.id,
      swipedUserId: swiped.id,
      action
    });
    
    // If A likes B, ~50% chance B also likes A (creates potential match)
    if (action === SwipeAction.LIKE && Math.random() < 0.5) {
      const reversePairKey = `${swiped.id}_${swiper.id}`;
      existingPairs.add(reversePairKey);
      
      swipes.push({
        swiperUserId: swiped.id,
        swipedUserId: swiper.id,
        action: SwipeAction.LIKE
      });
      
      // Track the potential match (ensure consistent userA/userB ordering)
      const [userAId, userBId] = [swiper.id, swiped.id].sort();
      const matchKey = `${userAId}_${userBId}`;
      
      if (!potentialMatches.has(matchKey)) {
        potentialMatches.set(matchKey, { userAId, userBId });
      }
    }
  }
  
  // Create swipes in batches
  const swipeBatchSize = 100;
  for (let i = 0; i < swipes.length; i += swipeBatchSize) {
    const batch = swipes.slice(i, i + swipeBatchSize);
    await prisma.swipe.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
  console.log(`Created ${swipes.length} swipes`);
  
  // Create matches based on mutual likes
  const matches = Array.from(potentialMatches.values());
  if (matches.length > 0) {
    await prisma.match.createMany({
      data: matches,
      skipDuplicates: true
    });
    console.log(`Created ${matches.length} matches from mutual likes`);
  }
  
  return {
    swipeCount: swipes.length,
    matchCount: matches.length
  };
}