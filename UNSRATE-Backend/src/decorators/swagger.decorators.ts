import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateUserProfileDto } from '../user/dto/update-user-profile.dto';
import { UserProfileResponse } from '../user/dto/user-profile-response.dto';
import { ManageUserPhotosDto } from '../user/dto/manage-user-photos.dto';

/**
 * Swagger decorator factory for the update profile endpoint
 */
export function ApiUpdateProfile() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update user profile',
      description:
        "Updates the authenticated user's profile information including personal details and preferences.",
    }),
    ApiBody({
      description: 'User profile data to update',
      type: UpdateUserProfileDto,
      examples: {
        basicInfo: {
          summary: 'Basic Profile Update',
          description: 'Update basic profile information',
          value: {
            fullname: 'John Doe',
            bio: 'Software Engineering student at University',
            dateOfBirth: '1995-08-24',
          },
        },
        preferences: {
          summary: 'Dating Preferences Update',
          description: 'Update matching preferences',
          value: {
            interestedInGender: 'FEMALE',
            minAgePreference: 18,
            maxAgePreference: 30,
          },
        },
        fullProfile: {
          summary: 'Complete Profile Update',
          description: 'Update all profile fields',
          value: {
            fullname: 'John Doe',
            bio: 'Software Engineering student at University',
            dateOfBirth: '1995-08-24',
            gender: 'MALE',
            alamat: 'Jalan Dipatiukur No.112-116, Bandung',
            profilePicture: 'https://example.com/profile.jpg',
            Photos: [
              'https://example.com/photo1.jpg',
              'https://example.com/photo2.jpg',
            ],
            interestedInGender: 'FEMALE',
            minAgePreference: 18,
            maxAgePreference: 30,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Profile updated successfully',
      type: UserProfileResponse,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Valid JWT token is required',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}

/**
 * Swagger decorator factory for the manage photos endpoint
 */
export function ApiManagePhotos() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Manage user photos',
      description:
        'Add or remove photos from the user profile, and set profile picture.',
    }),
    ApiBody({
      description: 'Photo management operations',
      type: ManageUserPhotosDto,
      examples: {
        addPhotos: {
          summary: 'Add new photos',
          description: 'Add new photos to the user profile',
          value: {
            addPhotos: [
              'https://example.com/new-photo1.jpg',
              'https://example.com/new-photo2.jpg',
            ],
          },
        },
        removePhotos: {
          summary: 'Remove photos',
          description: 'Remove specific photos from the user profile',
          value: {
            removePhotos: ['https://example.com/old-photo.jpg'],
          },
        },
        setProfilePic: {
          summary: 'Set profile picture',
          description: 'Update the main profile picture',
          value: {
            profilePicture: 'https://example.com/new-profile.jpg',
          },
        },
        fullExample: {
          summary: 'Complete photo management',
          description: 'Perform multiple photo operations at once',
          value: {
            addPhotos: [
              'https://example.com/new-photo1.jpg',
              'https://example.com/new-photo2.jpg',
            ],
            removePhotos: ['https://example.com/old-photo.jpg'],
            profilePicture: 'https://example.com/new-profile.jpg',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Photos updated successfully',
      schema: {
        properties: {
          id: {
            type: 'string',
            example: '7f1e1546-76a5-4967-b63e-ac9c9f2bbd7e',
          },
          fullname: { type: 'string', example: 'John Doe' },
          profilePicture: {
            type: 'string',
            example: 'https://example.com/profile.jpg',
          },
          Photos: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'https://example.com/photo1.jpg',
              'https://example.com/photo2.jpg',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Valid JWT token is required',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
