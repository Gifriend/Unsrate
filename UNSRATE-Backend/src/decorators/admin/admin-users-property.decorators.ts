import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsString,
  Min,
} from 'class-validator';

/**
 * User property for admin listing
 */
export function UserItemProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'User item in the listing',
      example: {
        id: 'cl42jkvw10039pdtb3lxu6g8l',
        fullname: 'John Doe',
        nim: '1234567890',
        email: 'john.doe@example.com',
        verified: true,
        profilePicture: 'https://example.com/profile.jpg',
        faculty: 'Computer Science',
        program: 'Information Technology',
        reportCount: 0,
        createdAt: '2023-04-15T08:30:00.000Z',
      },
    }),
    IsObject(),
  );
}

/**
 * Property decorator for user array
 */
export function UsersArrayProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Array of user items',
      isArray: true,
      type: Object,
      example: [
        {
          id: 'cl42jkvw10039pdtb3lxu6g8l',
          fullname: 'John Doe',
          nim: '1234567890',
          email: 'john.doe@example.com',
          verified: true,
          profilePicture: 'https://example.com/profile.jpg',
        },
      ],
    }),
    IsArray(),
  );
}

/**
 * Property decorator for total count
 */
export function TotalCountProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Total count of matching records',
      example: 150,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Property decorator for page info
 */
export function PageInfoProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Pagination information',
      example: {
        currentPage: 0,
        limit: 10,
        totalPages: 15,
      },
    }),
    IsObject(),
  );
}

/**
 * Property decorator for pagination current page
 */
export function CurrentPageProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Current page (0-indexed)',
      example: 0,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}

/**
 * Property decorator for pagination limit
 */
export function LimitProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Items per page',
      example: 10,
      minimum: 1,
    }),
    IsNumber(),
    Min(1),
  );
}

/**
 * Property decorator for total pages
 */
export function TotalPagesProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'Total number of pages',
      example: 15,
      minimum: 0,
    }),
    IsNumber(),
    Min(0),
  );
}
