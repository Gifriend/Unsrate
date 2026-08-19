import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { DiscoveryFilterDto } from './dto/discovery-filter.dto';
import { DiscoveryResponseDto } from './dto/discovery-response.dto';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  async getDiscovery(
    @User('id') userId: string,
    @Query(new ValidationPipe({ transform: true }))
    filterOptions: DiscoveryFilterDto,
    @Query('page') page = 0,
  ): Promise<DiscoveryResponseDto> {
    return this.discoveryService.getRecommendations(
      userId,
      filterOptions,
      +page,
    );
  }

  @Get('feed')
  async getInitialFeed(
    @User('id') userId: string,
  ): Promise<DiscoveryResponseDto> {
    return this.discoveryService.getQuickRecommendations(userId);
  }

  @Post('filters')
  async updateFilters(
    @User('id') userId: string,
    @Body() filters: DiscoveryFilterDto,
  ) {
    return this.discoveryService.saveUserFilters(userId, filters);
  }
}
