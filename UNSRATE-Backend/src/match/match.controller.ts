import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { MatchResponseDto } from './dto/match.dto';
import { MatchListResponseDto, GetMatchesQueryDto } from './dto/match-list.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  async getMatches(
    @User('id') userId: string,
    @Query() query: GetMatchesQueryDto,
  ): Promise<MatchListResponseDto> {
    return this.matchService.getMatches(userId, query);
  }

  @Get(':id')
  async getMatch(
    @User('id') userId: string,
    @Param('id') matchId: string,
  ): Promise<MatchResponseDto> {
    return this.matchService.getMatch(userId, matchId);
  }

  @Delete(':id')
  async unmatch(@User('id') userId: string, @Param('id') matchId: string) {
    return this.matchService.deleteMatch(userId, matchId);
  }
}
