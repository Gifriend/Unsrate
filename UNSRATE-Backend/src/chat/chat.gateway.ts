import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger, ValidationPipe, UseGuards } from '@nestjs/common';
import { IncomingMessageDto } from './dto/incoming-message.dto';
import { xorDecrypt } from '../utils/crypto.util';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ConfigService } from '@nestjs/config';

// We can use a guard for WebSocket authentication if needed,
// but for simplicity, we'll parse token from handshake here.

@WebSocketGateway({
  cors: {
    origin: new ConfigService().get<string>('CORS_ORIGIN') || '*',
  },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server; // This 'server' is used for broadcasting, so it should remain.

  private logger: Logger = new Logger('ChatGateway');
  private readonly encryptionKey: string;

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('MESSAGE_XOR_KEY');
    if (!this.encryptionKey) {
      this.logger.error(
        'MESSAGE_XOR_KEY is not defined in environment variables.',
      );
      throw new Error(
        'MESSAGE_XOR_KEY is not defined in environment variables.',
      );
    }
  }

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized');
  }

  // handleConnection is now primarily for post-authentication logic
  // WsJwtGuard handles the authentication and attaches user to client.handshake.auth.user
  async handleConnection(client: Socket) {
    this.logger.log(`[ChatGateway][${client.id}] handleConnection invoked.`);
    // Parse token from handshake again
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];
    let user = undefined;
    if (token) {
      try {
        const jwtService =
          this.configService.get<any>('JwtService') ||
          require('@nestjs/jwt').JwtService;
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        // Use a new JwtService instance if not injected
        const jwt = new jwtService({ secret: jwtSecret });
        user = jwt.verify(token, { secret: jwtSecret });
        this.logger.log(
          `[ChatGateway][${client.id}] User verified from token: ${JSON.stringify(user)}`,
        );
      } catch (e) {
        this.logger.warn(
          `[ChatGateway][${client.id}] Token verification failed: ${e.message}`,
        );
      }
    }
    if (user && user.sub) {
      this.logger.log(
        `[ChatGateway][${client.id}] User data found from token. User ID: ${user.sub}`,
      );
      (client as any).user = user; // Attach for use in other handlers
    } else {
      this.logger.warn(
        `[ChatGateway][${client.id}] User data NOT found or incomplete from token. Token: ${token}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Handle cleanup, like removing user from rooms they were in
  }

  @SubscribeMessage('joinMatchRoom')
  handleJoinRoom(
    @MessageBody('matchId') matchId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user || !user.sub) {
      this.logger.warn(
        `Unauthorized attempt to join room by ${client.id}. User: ${JSON.stringify(user)}`,
      );
      return { event: 'error', data: 'Unauthorized' };
    }
    client.join(matchId);
    this.logger.log(
      `User ${user.sub} (Client ${client.id}) joined room: ${matchId}`,
    );
    client.emit('joinedRoom', { matchId });
    return { event: 'joinedRoom', data: { matchId } };
  }

  @SubscribeMessage('leaveMatchRoom')
  handleLeaveRoom(
    @MessageBody('matchId') matchId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user || !user.sub) {
      this.logger.warn(
        `Unauthorized attempt to leave room by ${client.id}. User: ${JSON.stringify(user)}`,
      );
      return { event: 'error', data: 'Unauthorized' };
    }
    client.leave(matchId);
    this.logger.log(
      `User ${user.sub} (Client ${client.id}) left room: ${matchId}`,
    );
    return { event: 'leftRoom', data: { matchId } };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody(ValidationPipe) payload: IncomingMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = (client as any).user;
    if (!user || !user.sub) {
      this.logger.warn(
        `Unauthorized message attempt by ${client.id}. User: ${JSON.stringify(user)}`,
      );
      return;
    }
    const senderId = user.sub;
    this.logger.log(
      `Message from User ${senderId} (Client ${client.id}) to Match ${payload.matchId}: ${payload.content}`,
    );

    try {
      const savedMessage = await this.chatService.createMessage(
        payload.matchId,
        senderId,
        payload.content,
      );

      // Decrypt content for broadcasting
      const decryptedContent = xorDecrypt(
        savedMessage.content,
        this.encryptionKey,
      );

      const messageToBroadcast = {
        id: savedMessage.id,
        matchId: savedMessage.matchId,
        senderId: savedMessage.senderId,
        content: decryptedContent, // Send decrypted content
        createdAt: savedMessage.createdAt,
        isRead: savedMessage.isRead,
        // Include sender details if needed, fetched from client.data.user or another service call
        sender: {
          id: user.sub,
          fullname: user.fullname,
          // profilePicture: user.profilePicture
        },
      };

      // Broadcast to the specific match room
      this.server.to(payload.matchId).emit('newMessage', messageToBroadcast);
      this.logger.log(`Message broadcasted to room ${payload.matchId}`);

      // Optional: Acknowledge message receipt to sender
      // client.emit('messageSentAck', { messageId: savedMessage.id, status: 'success' });
    } catch (error) {
      this.logger.error(
        `Error handling message from ${senderId}: ${error.message}`,
      );
      // client.emit('error', { message: 'Failed to send message' });
    }
  }
}
