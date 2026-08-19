import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(
    reporterId: string,
    reportedUserId: string,
    createReportDto: CreateReportDto,
  ) {
    // 1. Check if reported user exists
    const reportedUser = await this.prisma.user.findUnique({
      where: { id: reportedUserId },
    });
    if (!reportedUser) {
      throw new NotFoundException('Pengguna yang dilaporkan tidak ditemukan.');
    }

    // 2. Check if reporter is trying to report themselves
    if (reporterId === reportedUserId) {
      throw new ForbiddenException('Anda tidak dapat melaporkan diri sendiri.');
    }

    // 3. Create the report
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: reportedUserId,
        reason: createReportDto.reason,
      },
    });

    return report;
  }

  async getReportedUsers(adminId: string) {
    // 1. Verify admin role (optional, can be done in guard)
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya admin yang dapat mengakses sumber daya ini.');
    }

    // 2. Aggregate reports
    const reportedUsers = await this.prisma.report.groupBy({
      by: ['reportedId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    if (reportedUsers.length === 0) {
      return [];
    }

    // 3. Get user details for each reported user and last reported date
    const detailedReportedUsers = await Promise.all(
      reportedUsers.map(async (reportSummary) => {
        const user = await this.prisma.user.findUnique({
          where: { id: reportSummary.reportedId },
          select: {
            id: true,
            fullname: true,
            nim: true,
            profilePicture: true,
          },
        });

        const lastReport = await this.prisma.report.findFirst({
          where: { reportedId: reportSummary.reportedId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          user,
          totalReports: reportSummary._count.id,
          lastReportedAt: lastReport?.createdAt,
        };
      }),
    );

    return detailedReportedUsers;
  }

  async getReportsForUser(adminId: string, userId: string) {
    // 1. Verify admin role (optional, can be done in guard)
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya admin yang dapat mengakses sumber daya ini.');
    }

    // 2. Check if the reported user exists
    const reportedUserExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!reportedUserExists) {
      throw new NotFoundException('Pengguna yang dilaporkan tidak ditemukan.');
    }

    // 3. Get reports for the user
    const reports = await this.prisma.report.findMany({
      where: { reportedId: userId },
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports.map(report => ({
      reportId: report.id,
      reason: report.reason,
      createdAt: report.createdAt,
      reporter: report.reporter,
    }));
  }
}
