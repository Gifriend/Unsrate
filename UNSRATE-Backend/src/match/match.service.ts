import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchDto, MatchResponseDto, MatchedUserDto } from './dto/match.dto';
import {
  MatchListResponseDto,
  GetMatchesQueryDto,
  MatchPaginationDto,
} from './dto/match-list.dto';

@Injectable()
export class MatchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all matches for a user with pagination and sorting
   */
  async getMatches(
    userId: string,
    queryOptions: GetMatchesQueryDto,
  ): Promise<MatchListResponseDto> {
    const { page = 0, limit = 10, sortBy = 'recent' } = queryOptions;

    // Find all matches where the current user is either userA or userB
    const whereClause = {
      OR: [{ userAId: userId }, { userBId: userId }],
    };

    // Count total matches for pagination
    const totalMatches = await this.prisma.match.count({
      where: whereClause,
    });

    // Determine sorting strategy
    let orderBy = {};
    if (sortBy === 'recent') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'activity') {
      orderBy = {
        messages: {
          _count: 'desc',
        },
      };
    }

    // Get matches with pagination
    const matchRecords = await this.prisma.match.findMany({
      where: whereClause,
      orderBy,
      skip: page * limit,
      take: limit,
      include: {
        userA: true,
        userB: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Just get the most recent message
        },
      },
    });

    // Get unread message counts for all these matches
    const matchIds = matchRecords.map((match) => match.id);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['matchId'],
      where: {
        matchId: { in: matchIds },
        senderId: { not: userId }, // Messages not sent by current user
        isRead: false, // Unread messages
      },
      _count: true,
    });

    // Create a map of matchId to unread count for easy lookup
    const unreadCountMap = new Map();
    unreadCounts.forEach((item) => {
      unreadCountMap.set(item.matchId, item._count);
    });

    // Format matches for the response
    const formattedMatches = matchRecords.map((match) => {
      // Determine which user is the match (not the current user)
      const matchedUser = match.userAId === userId ? match.userB : match.userA;

      // Extract the last message if it exists
      const lastMessage =
        match.messages.length > 0
          ? {
              id: match.messages[0].id,
              content: match.messages[0].content,
              senderId: match.messages[0].senderId,
              createdAt: match.messages[0].createdAt,
              isRead: match.messages[0].isRead,
            }
          : null;

      // Get unread count for this match
      const unreadCount = unreadCountMap.get(match.id) || 0;

      // Create a DTO for the matched user
      const matchedUserDto: MatchedUserDto = {
        id: matchedUser.id,
        fullname: matchedUser.fullname,
        age: matchedUser.age,
        gender: matchedUser.gender,
        fakultas: matchedUser.fakultas,
        prodi: matchedUser.prodi,
        profilePicture: matchedUser.profilePicture,
        bio: matchedUser.bio,
      };

      // Format the match
      const matchDto: MatchDto = {
        id: match.id,
        matchedUser: matchedUserDto,
        createdAt: match.createdAt,
        lastMessage: lastMessage,
        unreadCount: unreadCount,
      };

      return matchDto;
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalMatches / limit);
    const pagination: MatchPaginationDto = {
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalMatches: totalMatches,
    };

    // Return formatted response
    return {
      statusCode: 200,
      message: 'Matches retrieved successfully',
      matches: formattedMatches,
      pagination: pagination,
    };
  }

  /**
   * Get details for a specific match
   */
  async getMatch(userId: string, matchId: string): Promise<MatchResponseDto> {
    // Find the match and ensure the current user is part of it
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: true,
        userB: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Just get the most recent message
        },
      },
    });

    if (!match) {
      throw new NotFoundException(
        'Match not found or you are not part of this match',
      );
    }

    // Determine which user is the match (not the current user)
    const matchedUser = match.userAId === userId ? match.userB : match.userA;

    // Extract the last message if it exists
    const lastMessage =
      match.messages.length > 0
        ? {
            id: match.messages[0].id,
            content: match.messages[0].content,
            senderId: match.messages[0].senderId,
            createdAt: match.messages[0].createdAt,
            isRead: match.messages[0].isRead,
          }
        : null;

    // Count unread messages
    const unreadCount = await this.prisma.message.count({
      where: {
        matchId: matchId,
        senderId: { not: userId }, // Messages not sent by current user
        isRead: false, // Unread messages
      },
    });

    // Format the response
    return {
      statusCode: 200,
      message: 'Match retrieved successfully',
      match: {
        id: match.id,
        matchedUser: {
          id: matchedUser.id,
          fullname: matchedUser.fullname,
          age: matchedUser.age,
          gender: matchedUser.gender,
          fakultas: matchedUser.fakultas,
          prodi: matchedUser.prodi,
          profilePicture: matchedUser.profilePicture,
          bio: matchedUser.bio,
        },
        createdAt: match.createdAt,
        lastMessage: lastMessage,
        unreadCount: unreadCount,
      },
    };
  }

  /**
   * Unmatch from a user (delete the match)
   */
  async deleteMatch(userId: string, matchId: string) {
    // Check if match exists and user is part of it
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    if (!match) {
      throw new NotFoundException(
        'Match not found or you are not part of this match',
      );
    }

    // Delete the match (this will cascade delete all messages as well)
    await this.prisma.match.delete({
      where: { id: matchId },
    });

    return {
      statusCode: 200,
      message: 'You have successfully unmatched',
    };
  }
}
