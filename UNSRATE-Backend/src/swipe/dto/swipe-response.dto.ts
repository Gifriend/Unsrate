import { SwipeAction } from '@prisma/client';

// Basic response data for match
class MatchData {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
}

// Basic response data for a swipe
class SwipeData {
  id: string;
  swiperUserId: string;
  swipedUserId: string;
  action: SwipeAction;
  createdAt: Date;
}

export class SwipeResponseDto {
  statusCode: number;
  message: string;
  swipe: SwipeData;
  match: MatchData | null;
}

export class SwipeStatsResponseDto {
  statusCode: number;
  message: string;
  totalLikes: number;
  totalDislikes: number;
  totalMatches: number;
  matchRate: number;
}
