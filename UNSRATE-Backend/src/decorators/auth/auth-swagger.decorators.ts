import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from '../../auth/dto/auth.dto';

/**
 * Swagger decorator factory for the auth register endpoint
 */
export function ApiRegisterUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register new user',
      description:
        'Creates a new user account and returns authentication tokens',
    }),
    ApiBody({
      description: 'User registration data',
      type: RegisterDto,
      examples: {
        standard: {
          summary: 'Standard Registration',
          description: 'Register with required user information',
          value: {
            fullname: 'John Doe',
            nim: '1122334455',
            email: 'john.doe@mail.com',
            password: 'password123',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
      schema: {
        properties: {
          status: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Berhasil Membuat Akun' },
          data: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                example: '7f1e1546-76a5-4967-b63e-ac9c9f2bbd7e',
              },
              email: { type: 'string', example: 'john.doe@mail.com' },
              token: {
                type: 'object',
                properties: {
                  access_token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                  refresh_token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation failed',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - User with this NIM or email already exists',
    }),
  );
}

/**
 * Swagger decorator factory for the auth login endpoint
 */
export function ApiLoginUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticates a user and returns tokens',
    }),
    ApiBody({
      description: 'User login credentials',
      type: LoginDto,
      examples: {
        standard: {
          summary: 'Standard Login',
          description: 'Login with email and password',
          value: {
            email: 'john.doe@mail.com',
            password: 'password123',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        properties: {
          status: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Login berhasil' },
          data: {
            type: 'object',
            properties: {
              access_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refresh_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation failed',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid credentials',
    }),
  );
}

/**
 * Swagger decorator factory for the token refresh endpoint
 */
export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'Generate a new access token using a valid refresh token',
    }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      schema: {
        properties: {
          status: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Token berhasil diperbarui' },
          data: {
            type: 'object',
            properties: {
              access_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid refresh token',
    }),
  );
}

/**
 * Swagger decorator factory for the logout endpoint
 */
export function ApiLogoutUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Invalidates all refresh tokens for the current user',
    }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        properties: {
          status: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Logout berhasil' },
          data: { type: 'null', example: null },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid access token',
    }),
  );
}
