import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardStatsResponseDto } from '../../admin/dto/dashboard-stats.dto';
import { ListUsersResponseDto } from '../../admin/dto/list-users-response.dto';
import { UserVerificationStatus } from '../../admin/dto/list-users-query.dto';

/**
 * Swagger decorator factory for admin dashboard statistics endpoint
 */
export function ApiDashboardStats() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get admin dashboard statistics',
      description:
        'Retrieves key metrics for the admin dashboard including user counts and verification rates.',
    }),
    ApiResponse({
      status: 200,
      description: 'Statistics retrieved successfully',
      type: DashboardStatsResponseDto,
      schema: {
        properties: {
          totalUsers: {
            type: 'number',
            example: 150,
            description: 'Total number of users in the system',
          },
          verifiedUsers: {
            type: 'number',
            example: 75,
            description: 'Number of verified users',
          },
          verificationRate: {
            type: 'number',
            example: 50,
            description: 'Percentage of verified users (0-100)',
          },
          // Future fields:
          // totalReports: { type: 'number', example: 8, description: 'Total number of reports submitted' },
          // reportedUsers: { type: 'number', example: 5, description: 'Number of users with at least one report' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Valid JWT token is required',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have admin privileges',
    }),
  );
}

/**
 * Swagger decorator factory for admin users listing endpoint
 */
export function ApiListUsers() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get users list with filtering and pagination',
      description:
        'Retrieves a paginated list of users with various filtering options.',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: UserVerificationStatus,
      description: 'Filter users by verification status',
    }),
    ApiQuery({
      name: 'hasReports',
      required: false,
      type: Boolean,
      description: 'Filter users who have reports',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search users by name or NIM',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (0-indexed)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
    }),
    ApiResponse({
      status: 200,
      description: 'Users retrieved successfully',
      type: ListUsersResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Valid JWT token is required',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have admin privileges',
    }),
  );
}
