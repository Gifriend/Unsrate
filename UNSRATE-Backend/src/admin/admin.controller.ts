import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';
import {
  ApiDashboardStats,
  ApiListUsers,
} from '../decorators/admin/admin-swagger.decorators';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ListUsersResponseDto } from './dto/list-users-response.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiDashboardStats()
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiListUsers()
  async listUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<ListUsersResponseDto> {
    return this.adminService.listUsers(query);
  }

  @Delete('user')
  async deleteUser(@Body('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Post('verify')
  async verifyUser(@Body('userId') userId: string) {
    return this.adminService.verifyUser(userId);
  }
}
