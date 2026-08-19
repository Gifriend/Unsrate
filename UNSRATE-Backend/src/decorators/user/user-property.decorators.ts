import { applyDecorators } from '@nestjs/common';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

/**
 * Create a property decorator for a fullname field
 */
export function FullnameProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Full name of the user',
      example: 'John Doe',
      required: false,
      maxLength: 100,
    }),
    IsOptional(),
    IsString(),
    MaxLength(100),
  );
}

/**
 * Create a property decorator for a profile picture URL
 */
export function ProfilePictureProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'URL to the profile picture',
      example: 'https://example.com/profile.jpg',
      required: false,
    }),
    IsOptional(),
    IsUrl(),
  );
}

/**
 * Create a property decorator for an array of photos
 */
export function PhotosArrayProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Array of photo URLs',
      example: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
      required: false,
      isArray: true,
    }),
    IsOptional(),
    IsArray(),
    IsUrl({}, { each: true }),
  );
}

/**
 * Create a property decorator for bio text
 */
export function BioProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'User biography',
      example: 'I am a student studying Computer Science',
      required: false,
      maxLength: 500,
    }),
    IsOptional(),
    IsString(),
    MaxLength(500),
  );
}

/**
 * Create a property decorator for date of birth
 */
export function DateOfBirthProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Date of birth in ISO format',
      example: '1995-08-24',
      required: false,
    }),
    IsOptional(),
    IsDateString(),
  );
}

/**
 * Create a property decorator for gender enum
 */
export function GenderProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'User gender',
      enum: Gender,
      example: 'MALE',
      required: false,
    }),
    IsOptional(),
    IsEnum(Gender),
  );
}

/**
 * Create a property decorator for address
 */
export function AddressProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'User address',
      example: 'Jalan Dipatiukur No.112-116, Bandung',
      required: false,
      maxLength: 255,
    }),
    IsOptional(),
    IsString(),
    MaxLength(255),
  );
}

/**
 * Create a property decorator for gender preference
 */
export function GenderPreferenceProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Preferred gender for matching',
      enum: Gender,
      example: 'FEMALE',
      required: false,
    }),
    IsOptional(),
    IsEnum(Gender),
  );
}

/**
 * Create a property decorator for min age preference
 */
export function MinAgePreferenceProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Minimum age preference for matching',
      example: 18,
      minimum: 18,
      required: false,
    }),
    IsOptional(),
    IsInt(),
    Min(18),
  );
}

/**
 * Create a property decorator for max age preference
 */
export function MaxAgePreferenceProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Maximum age preference for matching',
      example: 35,
      maximum: 99,
      required: false,
    }),
    IsOptional(),
    IsInt(),
    Max(99),
  );
}

/**
 * Create a property decorator for array of photos to add
 */
export function AddPhotosProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Array of photo URLs to add to the user profile',
      example: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
      required: false,
      isArray: true,
    }),
    IsOptional(),
    IsArray(),
    IsUrl({}, { each: true }),
  );
}

/**
 * Create a property decorator for array of photos to remove
 */
export function RemovePhotosProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Array of photo URLs to remove from the user profile',
      example: ['https://example.com/old-photo.jpg'],
      required: false,
      isArray: true,
    }),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
  );
}
