import { Controller, Post, Body, Param, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator'; // Changed GetUser to User
import { User as UserModel } from '@prisma/client'; // Prisma user model
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator'; 
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard'; // Added import for RolesGuard


@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Endpoint 1: Membuat Laporan Baru (User)
  @Post('users/:reportedUserId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @User() reporter: UserModel, // Changed GetUser to User
    @Param('reportedUserId') reportedUserId: string,
    @Body() createReportDto: CreateReportDto,
  ) {
    await this.reportService.createReport(
      reporter.id,
      reportedUserId,
      createReportDto,
    );
    return {
      status: 'success',
      message: 'Laporan berhasil dikirim.',
    };
  }

  // Endpoint 2: Menampilkan Daftar Pengguna yang Dilaporkan (Admin)
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getReportedUsers(@User() admin: UserModel) { // Changed GetUser to User
    const data = await this.reportService.getReportedUsers(admin.id);
    return {
      status: 'success',
      data,
    };
  }

  // Endpoint 3: Melihat Detail Laporan untuk Satu Pengguna (Admin)
  @Get('admin/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getReportsForUser(
    @User() admin: UserModel, // Changed GetUser to User
    @Param('userId') userId: string,
  ) {
    const data = await this.reportService.getReportsForUser(admin.id, userId);
    return {
      status: 'success',
      data,
    };
  }
}
