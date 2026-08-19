import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import {
  SwipeResponseDto,
  SwipeStatsResponseDto,
} from './dto/swipe-response.dto';
import { SwipeAction } from '@prisma/client';

@Injectable()
export class SwipeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a swipe record and potentially a match if there's mutual interest
   */
  async createSwipe(
    userId: string,
    createSwipeDto: CreateSwipeDto,
  ): Promise<SwipeResponseDto> {
    const { swipedUserId, action } = createSwipeDto;

    // Validate that the swiped user exists
    const swipedUser = await this.prisma.user.findUnique({
      where: { id: swipedUserId },
    });

    if (!swipedUser) {
      throw new NotFoundException(
        'The user you are trying to swipe on does not exist',
      );
    }

    // Prevent swiping on oneself
    if (userId === swipedUserId) {
      throw new BadRequestException('You cannot swipe on yourself');
    }

    // Check if a swipe already exists from this user to the target user
    const existingSwipe = await this.prisma.swipe.findUnique({
      where: {
        swiperUserId_swipedUserId: {
          swiperUserId: userId,
          swipedUserId,
        },
      },
    });

    if (existingSwipe) {
      throw new ConflictException('You have already swiped on this user');
    }

    // Use a transaction to ensure swipe creation and potential match creation are atomic
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the swipe record
      const swipe = await tx.swipe.create({
        data: {
          swiperUserId: userId,
          swipedUserId,
          action,
        },
      });

      // If this is a LIKE, check for a mutual like (to create a match)
      let match = null;
      if (action === SwipeAction.LIKE) {
        // Check if the other user has already liked this user
        const otherUserLike = await tx.swipe.findUnique({
          where: {
            swiperUserId_swipedUserId: {
              swiperUserId: swipedUserId,
              swipedUserId: userId,
            },
          },
        });

        // If mutual like exists, create a match
        if (otherUserLike && otherUserLike.action === SwipeAction.LIKE) {
          // Determine order for user IDs to ensure consistency
          // This prevents having both (A,B) and (B,A) as separate matches
          const [userAId, userBId] = [userId, swipedUserId].sort();

          match = await tx.match.create({
            data: {
              userAId,
              userBId,
            },
          });
        }
      }

      return { swipe, match };
    });

    // Format the response
    return {
      statusCode: 200,
      message: result.match
        ? "It's a match! You both liked each other."
        : 'Swipe recorded successfully',
      swipe: result.swipe,
      match: result.match,
    };
  }

  /**
   * Get swipe statistics for the current user
   */
  async getSwipeStats(userId: string): Promise<SwipeStatsResponseDto> {
    // Count likes given by the user
    const totalLikes = await this.prisma.swipe.count({
      where: {
        swiperUserId: userId,
        action: SwipeAction.LIKE,
      },
    });

    // Count dislikes given by the user
    const totalDislikes = await this.prisma.swipe.count({
      where: {
        swiperUserId: userId,
        action: SwipeAction.DISLIKE,
      },
    });

    // Count matches for this user
    const totalMatches = await this.prisma.match.count({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    // Calculate match rate (percentage of likes that resulted in matches)
    const matchRate =
      totalLikes > 0 ? Math.round((totalMatches / totalLikes) * 100) : 0;

    return {
      statusCode: 200,
      message: 'Swipe statistics retrieved successfully',
      totalLikes,
      totalDislikes,
      totalMatches,
      matchRate,
    };
  }
}
