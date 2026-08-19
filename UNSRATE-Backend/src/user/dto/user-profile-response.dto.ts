import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

/**
 * Response DTO for user profile data
 */
export class UserProfileResponse {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '7f1e1546-76a5-4967-b63e-ac9c9f2bbd7e',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  fullname: string;

  @ApiProperty({
    description: 'URL to the profile picture',
    example: 'https://example.com/profile.jpg',
    nullable: true,
  })
  profilePicture: string | null;

  @ApiProperty({
    description: 'Array of photo URLs',
    example: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ],
    nullable: true,
    isArray: true,
  })
  Photos: string[] | null;

  @ApiProperty({
    description: 'User biography',
    example: 'Software Engineering student at University',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Date of birth',
    example: '1995-08-24T00:00:00.000Z',
    nullable: true,
  })
  dateOfBirth: Date | null;

  @ApiProperty({
    description: 'User gender',
    enum: Gender,
    example: 'MALE',
    nullable: true,
  })
  gender: Gender | null;

  @ApiProperty({
    description: 'User address',
    example: 'Jalan Dipatiukur No.112-116, Bandung',
    nullable: true,
  })
  alamat: string | null;

  @ApiProperty({
    description: 'Preferred gender for matching',
    enum: Gender,
    example: 'FEMALE',
    nullable: true,
  })
  interestedInGender: Gender | null;

  @ApiProperty({
    description: 'Minimum age preference for matching',
    example: 18,
    nullable: true,
  })
  minAgePreference: number | null;

  @ApiProperty({
    description: 'Maximum age preference for matching',
    example: 30,
    nullable: true,
  })
  maxAgePreference: number | null;
}
