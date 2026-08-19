import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscoveryFilterDto } from './dto/discovery-filter.dto';
import {
  DiscoveryResponseDto,
  DiscoveryProfileDto,
} from './dto/discovery-response.dto';
import {
  calculateMatchScore,
  calculateAcademicBonus,
} from './utils/match-score.util';
import { Gender } from '@prisma/client';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(
    userId: string,
    filterOptions: DiscoveryFilterDto,
    page = 0,
  ): Promise<DiscoveryResponseDto> {
    // Validate user exists
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          include: { interest: true },
        },
        swipesMade: true, // To exclude already swiped users
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Get IDs of users already swiped to exclude them
    const swipedUserIds = currentUser.swipesMade.map(
      (swipe) => swipe.swipedUserId,
    );

    // Always exclude the current user
    swipedUserIds.push(userId);

    // Base filters - always applied
    const baseFilters: any = {
      id: { notIn: swipedUserIds },
      isActive: true,
    };

    // gender preference - always show opposite gender
    if (currentUser.gender === Gender.MALE) {
      baseFilters.gender = Gender.FEMALE;
    } else if (currentUser.gender === Gender.FEMALE) {
      baseFilters.gender = Gender.MALE;
    }
    // If gender filter is explicitly provided in filterOptions, respect it but only if it's opposite gender
    if (filterOptions.gender) {
      if (
        (currentUser.gender === Gender.MALE && filterOptions.gender === Gender.FEMALE) ||
        (currentUser.gender === Gender.FEMALE && filterOptions.gender === Gender.MALE)
      ) {
        baseFilters.gender = filterOptions.gender;
      }
    }

    const optionalFilters: any = {};

    // Age filters - only if explicitly requested
    if (filterOptions.minAge) {
      optionalFilters.age = { gte: filterOptions.minAge };
    }

    if (filterOptions.maxAge) {
      optionalFilters.age = {
        ...(optionalFilters.age || {}),
        lte: filterOptions.maxAge,
      };
    }

    // Faculty/program filters - only if explicitly requested
    if (filterOptions.fakultas) {
      optionalFilters.fakultas = filterOptions.fakultas;
    }

    if (filterOptions.prodi) {
      optionalFilters.prodi = filterOptions.prodi;
    }

    // Set up pagination
    const limit = filterOptions.limit || 20;
    const skip = page * limit;

    // Combine base and optional filters for initial search
    const initialFilters = {
      ...baseFilters,
      ...optionalFilters,
    };

    // Initial query - try to find matches with all preferences
    let potentialMatches = await this.prisma.user.findMany({
      where: initialFilters,
      include: {
        interests: {
          include: { interest: true },
        },
      },
      skip,
      take: limit,
    });

    // Count total matches with initial filters for pagination
    let totalCount = await this.prisma.user.count({
      where: initialFilters,
    });

    // If results are too few, and user hasn't specified strict mode,
    // fall back to a more relaxed query using only base filters
    const minDesiredMatches = 5;
    if (
      potentialMatches.length < minDesiredMatches &&
      Object.keys(optionalFilters).length > 0 &&
      !filterOptions.sharedInterestsOnly
    ) {
      console.log('Few matches found with filters, expanding search criteria');

      // Get additional matches with relaxed criteria
      const additionalMatches = await this.prisma.user.findMany({
        where: baseFilters,
        include: {
          interests: {
            include: { interest: true },
          },
        },
        // Skip results we already have
        skip: 0,
        // Only get enough to reach our minimum desired
        take: minDesiredMatches - potentialMatches.length,
      });

      // Add fallback matches to our results
      potentialMatches = [...potentialMatches, ...additionalMatches];

      // Update total count to include relaxed criteria matches
      totalCount = await this.prisma.user.count({
        where: baseFilters,
      });
    }

    // Process results to calculate match scores
    const userInterests = currentUser.interests.map((ui) => ({
      id: ui.interest.id,
      name: ui.interest.name,
    }));

    let scoredMatches = potentialMatches.map((match) => {
      const matchInterests = match.interests.map((mi) => ({
        id: mi.interest.id,
        name: mi.interest.name,
      }));

      // Calculate base match score using interests
      let score = calculateMatchScore(userInterests, matchInterests);

      // Add bonus points for academic similarity if applicable
      score += calculateAcademicBonus(
        currentUser.fakultas,
        match.fakultas,
        currentUser.prodi,
        match.prodi,
      );

      // Cap at 100 points maximum
      score = Math.min(score, 100);

      // Format the response data
      const profile: DiscoveryProfileDto = {
        id: match.id,
        fullname: match.fullname,
        age: match.age,
        gender: match.gender,
        fakultas: match.fakultas || undefined,
        prodi: match.prodi || undefined,
        bio: match.bio || undefined,
        profilePicture: match.profilePicture || undefined,
        Photos: match.Photos || [],
        interests: matchInterests,
        matchScore: score,
      };

      return profile;
    });

    // Apply shared interests filter only if explicitly requested
    if (filterOptions.sharedInterestsOnly) {
      scoredMatches = scoredMatches.filter(
        (profile) => profile.matchScore > 50,
      );
    }

    // Sort by match score (highest first)
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return formatted response
    return {
      statusCode: 200,
      message: 'Potential matches found',
      profiles: scoredMatches,
      total: totalCount,
      page: page,
      limit: limit,
      totalPages: totalPages,
    };
  }

  async getQuickRecommendations(userId: string): Promise<DiscoveryResponseDto> {
    return this.getRecommendations(userId, { limit: 5 }, 0);
  }

  /**
   * Save user's discovery preferences
   */
  async saveUserFilters(userId: string, filters: DiscoveryFilterDto) {
    try {
      // Update user preferences in the database
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          interestedInGender: filters.gender,
          minAgePreference: filters.minAge,
          maxAgePreference: filters.maxAge,
        },
        select: {
          id: true,
          interestedInGender: true,
          minAgePreference: true,
          maxAgePreference: true,
        },
      });

      return {
        statusCode: 200,
        message: 'Discovery preferences updated',
        data: updatedUser,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma not found error
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
