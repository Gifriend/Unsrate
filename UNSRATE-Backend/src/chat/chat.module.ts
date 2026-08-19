import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from './guards/ws-jwt.guard'; // Import the WsJwtGuard

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    WsJwtGuard, // Add WsJwtGuard to providers
  ],
  exports: [ChatService, ChatGateway], // Export if needed by other modules
})
export class ChatModule {}
