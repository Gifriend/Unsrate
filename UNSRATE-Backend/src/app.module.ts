import { Module } from '@nestjs/common';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PddiktiModule } from './pddikti/pddikti.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { SwipeModule } from './swipe/swipe.module';
import { MatchModule } from './match/match.module';
import { ChatModule } from './chat/chat.module';
import { InterestModule } from './interest/interest.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PddiktiModule,
    PrismaModule,
    AdminModule,
    DiscoveryModule,
    SwipeModule,
    MatchModule,
    ChatModule,
    InterestModule,
    ReportModule,
  ],
  providers: [],
})
export class AppModule {}
