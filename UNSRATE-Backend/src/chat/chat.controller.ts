import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming you have JWT Auth Guard
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('match/:matchId/messages')
  async getMessagesForMatch(@Param('matchId') matchId: string, @Req() req) {
    const userId = req.user.id;
    await this.chatService.validateUserInMatch(userId, matchId);
    return this.chatService.getMessagesForMatch(matchId);
  }
}
