import { Controller, Get, UseGuards } from '@nestjs/common';
import { InterestService } from './interest.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InterestDto } from './dto/interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Interests')
@Controller('interests')
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available interests' })
  @ApiOkResponse({
    description: 'A list of all interests.',
    type: [InterestDto],
  })
  async findAll(): Promise<InterestDto[]> {
    return this.interestService.findAll();
  }
}
