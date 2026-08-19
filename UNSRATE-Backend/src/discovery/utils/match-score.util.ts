/**
 * Calculate match score based on shared interests between two users
 * @param userInterests Array of current user's interest objects
 * @param potentialMatchInterests Array of potential match's interest objects
 * @returns A score between 0-100
 */
export function calculateMatchScore(
  userInterests: { id: string; name: string }[],
  potentialMatchInterests: { id: string; name: string }[],
): number {
  // If either user has no interests, return base score
  if (!userInterests.length || !potentialMatchInterests.length) {
    return 50; // Base compatibility score
  }

  // Extract interest IDs for comparison
  const userInterestIds = userInterests.map((interest) => interest.id);
  const matchInterestIds = potentialMatchInterests.map(
    (interest) => interest.id,
  );

  // Count shared interests
  const sharedInterests = userInterestIds.filter((id) =>
    matchInterestIds.includes(id),
  );

  // Calculate total unique interests
  const totalUniqueInterests = new Set([
    ...userInterestIds,
    ...matchInterestIds,
  ]).size;

  // Jaccard similarity coefficient (intersection over union)
  const similarityScore =
    totalUniqueInterests > 0
      ? (sharedInterests.length / totalUniqueInterests) * 100
      : 0;

  // Apply weighting: 40% base score + 60% similarity
  // This ensures even users with no matching interests still get a reasonable score
  return Math.min(Math.round(40 + similarityScore * 0.6), 100);
}

/**
 * Calculate similarity score between faculties/programs
 * @param userFakultas User's faculty
 * @param matchFakultas Potential match's faculty
 * @param userProdi User's program
 * @param matchProdi Potential match's program
 * @returns A bonus score between 0-15
 */
export function calculateAcademicBonus(
  userFakultas?: string,
  matchFakultas?: string,
  userProdi?: string,
  matchProdi?: string,
): number {
  let bonus = 0;

  // Same faculty is a moderate bonus
  if (userFakultas && matchFakultas && userFakultas === matchFakultas) {
    bonus += 10;

    // Same program within same faculty is an additional bonus
    if (userProdi && matchProdi && userProdi === matchProdi) {
      bonus += 5;
    }
  }

  return bonus;
}
