import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';
import {
  ListUsersQueryDto,
  UserVerificationStatus,
} from './dto/list-users-query.dto';
import {
  AdminUserListItemDto,
  ListUsersResponseDto,
  PageInfoDto,
} from './dto/list-users-response.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const totalUsers = await this.prisma.user.count();
    const verifiedUsers = await this.prisma.user.count({
      where: { verified: true },
    });

    // Calculate verification rate (as a percentage)
    const verificationRate =
      totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      verifiedUsers,
      verificationRate,
      // Future fields for when report feature is implemented:
      // totalReports: 0,
      // reportedUsers: 0,
    };
  }

  async listUsers(query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    const { status, hasReports, search, page, limit } = query;

    // Build the where conditions for filtering
    const where: any = {};

    // Apply verification status filter
    if (status === UserVerificationStatus.VERIFIED) {
      where.verified = true;
    } else if (status === UserVerificationStatus.PENDING) {
      where.verified = false;
    }

    // Apply search filter if provided
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { nim: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Report filtering will be implemented in the future
    // if (hasReports) {
    //   where.reports = { some: {} };
    // }

    // Count total matching records for pagination
    const total = await this.prisma.user.count({ where });

    // Calculate pagination
    const skip = page * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch users with pagination
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullname: true,
        nim: true,
        email: true,
        verified: true,
        profilePicture: true,
        fakultas: true,
        prodi: true,
        createdAt: true,
        // Add more fields as needed
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // Most recent first
    });

    // Map to response DTO format
    const userItems: AdminUserListItemDto[] = users.map((user) => ({
      ...user,
      reportCount: 0, // Placeholder for future implementation
    }));

    // Build page info
    const pageInfo: PageInfoDto = {
      currentPage: page,
      limit,
      totalPages,
    };

    return {
      users: userItems,
      total,
      pageInfo,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedUser = await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      status: '200',
      messsage: 'User Succesfully deleted',
      data: {
        id: deletedUser.id,
        fullname: deletedUser.fullname,
        email: deletedUser.email,
      },
    };
  }

  async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.verified) {
      throw new BadRequestException('User is already verified');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });
  }
}
