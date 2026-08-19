import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Verification status options for filtering users
 */
export enum UserVerificationStatus {
  ALL = 'all',
  PENDING = 'pending',
  VERIFIED = 'verified',
}

/**
 * Query parameters for retrieving and filtering users in the admin panel
 */
export class ListUsersQueryDto {
  @ApiProperty({
    description: 'Filter users by verification status',
    enum: UserVerificationStatus,
    default: UserVerificationStatus.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserVerificationStatus)
  status?: UserVerificationStatus = UserVerificationStatus.ALL;

  @ApiProperty({
    description: 'Filter users who have reports',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasReports?: boolean;

  @ApiProperty({
    description: 'Search users by name or NIM',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number (0-indexed)',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 0;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
