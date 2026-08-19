import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming you have PrismaService
import { xorEncrypt, xorDecrypt } from '../utils/crypto.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('MESSAGE_XOR_KEY');
    if (!this.encryptionKey) {
      throw new Error(
        'MESSAGE_XOR_KEY is not defined in environment variables.',
      );
    }
  }

  async createMessage(matchId: string, senderId: string, content: string) {
    // It's good practice to also validate if the sender is part of the match before creating a message.
    await this.validateUserInMatch(senderId, matchId);
    const encryptedContent = xorEncrypt(content, this.encryptionKey);
    return this.prisma.message.create({
      data: {
        matchId,
        senderId,
        content: encryptedContent,
      },
    });
  }

  async getMessagesForMatch(matchId: string) {
    // Validation that the requesting user is part of the match should be done in the controller
    // before calling this method, using validateUserInMatch.
    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullname: true, profilePicture: true } },
      }, // Include sender details
    });

    return messages.map((msg) => ({
      ...msg,
      content: xorDecrypt(msg.content, this.encryptionKey),
    }));
  }

  async validateUserInMatch(userId: string, matchId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { userAId: true, userBId: true },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID "${matchId}" not found.`);
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException(
        `User "${userId}" is not a participant in match "${matchId}".`,
      );
    }
    // If no error is thrown, the user is validated.
  }

  // Placeholder for WebSocket related logic (to be implemented in gateway)
  // async handleIncomingMessage(payload: { matchId: string; senderId: string; content: string }) {
  //   const message = await this.createMessage(payload.matchId, payload.senderId, payload.content);
  //   // Here you would typically emit the message to the relevant room via the gateway
  //   // For now, just returning the created message (with decrypted content for broadcasting if needed)
  //   return {
  //     ...message,
  //     content: xorDecrypt(message.content, this.encryptionKey) // Decrypt for broadcasting
  //   };
  // }
}
