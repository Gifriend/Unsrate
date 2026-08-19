import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class DiscoveryFilterDto {
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsInt()
  @Min(18)
  @IsOptional()
  minAge?: number;

  @IsInt()
  @Max(100)
  @IsOptional()
  maxAge?: number;

  @IsOptional()
  fakultas?: string;

  @IsOptional()
  prodi?: string;

  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 20;

  @IsBoolean()
  @IsOptional()
  sharedInterestsOnly?: boolean;
}
