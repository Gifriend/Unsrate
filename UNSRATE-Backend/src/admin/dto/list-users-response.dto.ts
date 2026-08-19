import {
  UsersArrayProperty,
  TotalCountProperty,
  PageInfoProperty,
  CurrentPageProperty,
  LimitProperty,
  TotalPagesProperty,
  UserItemProperty,
} from '../../decorators/admin/admin-users-property.decorators';
import { ApiProperty } from '@nestjs/swagger';

/**
 * User data structure for admin panel listing
 */
export class AdminUserListItemDto {
  @ApiProperty({ example: 'cl42jkvw10039pdtb3lxu6g8l', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  fullname: string;

  @ApiProperty({ example: '1234567890', description: 'User NIM (Student ID)' })
  nim: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({ example: true, description: 'Whether the user is verified' })
  verified: boolean;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'User profile picture URL',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'User faculty',
    required: false,
  })
  fakultas?: string;

  @ApiProperty({
    example: 'Information Technology',
    description: 'User study program',
    required: false,
  })
  prodi?: string;

  @ApiProperty({
    example: 0,
    description: 'Number of reports against this user',
  })
  reportCount: number;

  @ApiProperty({
    example: '2023-04-15T08:30:00.000Z',
    description: 'User creation date',
  })
  createdAt: Date;
}

/**
 * Page info for pagination
 */
export class PageInfoDto {
  @CurrentPageProperty()
  currentPage: number;

  @LimitProperty()
  limit: number;

  @TotalPagesProperty()
  totalPages: number;
}

/**
 * Response DTO for paginated user listing
 */
export class ListUsersResponseDto {
  @UsersArrayProperty()
  users: AdminUserListItemDto[];

  @TotalCountProperty()
  total: number;

  @PageInfoProperty()
  pageInfo: PageInfoDto;
}
