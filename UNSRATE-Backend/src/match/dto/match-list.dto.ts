import { MatchDto } from './match.dto';

// Pagination information
export class MatchPaginationDto {
  currentPage: number;
  limit: number;
  totalPages: number;
  totalMatches: number;
}

// Query parameters for fetching matches
export class GetMatchesQueryDto {
  page?: number = 0;
  limit?: number = 10;
  sortBy?: 'recent' | 'activity' = 'recent';
}

// Response for match listing
export class MatchListResponseDto {
  statusCode: number;
  message: string;
  matches: MatchDto[];
  pagination: MatchPaginationDto;
}
