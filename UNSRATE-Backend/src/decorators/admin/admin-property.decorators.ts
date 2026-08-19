import { applyDecorators } from '@nestjs/common';
import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create a property decorator for total users count
 */
export function TotalUsersProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Total number of users in the system',
      example: 150,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Create a property decorator for verified users count
 */
export function VerifiedUsersProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Number of verified users',
      example: 75,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Create a property decorator for verification rate percentage
 */
export function VerificationRateProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Percentage of verified users (0-100)',
      example: 50,
      minimum: 0,
      maximum: 100,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Create a property decorator for total reports count (future implementation)
 */
export function TotalReportsProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Total number of reports submitted',
      example: 8,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Create a property decorator for reported users count (future implementation)
 */
export function ReportedUsersProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Number of users with at least one report',
      example: 5,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}
