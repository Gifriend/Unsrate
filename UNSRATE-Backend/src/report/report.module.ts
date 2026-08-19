import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
