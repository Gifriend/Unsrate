import {
  TotalUsersProperty,
  VerifiedUsersProperty,
  VerificationRateProperty,
  // TotalReportsProperty,
  // ReportedUsersProperty
} from '../../decorators/admin/admin-property.decorators';

/**
 * Response DTO for Admin Dashboard Statistics
 * Contains counters for various user metrics used in the admin dashboard
 */
export class DashboardStatsResponseDto {
  @TotalUsersProperty()
  totalUsers: number;

  @VerifiedUsersProperty()
  verifiedUsers: number;

  @VerificationRateProperty()
  verificationRate: number;

  // For future implementation when report feature is added
  /*
  @TotalReportsProperty()
  totalReports: number;

  @ReportedUsersProperty()
  reportedUsers: number;
  */
}
