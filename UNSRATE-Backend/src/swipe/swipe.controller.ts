import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { SwipeService } from './swipe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import {
  SwipeResponseDto,
  SwipeStatsResponseDto,
} from './dto/swipe-response.dto';

@Controller('swipes')
@UseGuards(JwtAuthGuard)
export class SwipeController {
  constructor(private readonly swipeService: SwipeService) {}

  @Post()
  async createSwipe(
    @User('id') userId: string,
    @Body() createSwipeDto: CreateSwipeDto,
  ): Promise<SwipeResponseDto> {
    return this.swipeService.createSwipe(userId, createSwipeDto);
  }

  @Get('stats')
  async getSwipeStats(
    @User('id') userId: string,
  ): Promise<SwipeStatsResponseDto> {
    return this.swipeService.getSwipeStats(userId);
  }
}
