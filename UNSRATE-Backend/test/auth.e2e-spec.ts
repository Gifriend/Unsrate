import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // Ensure validation pipes are used
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean the database before running tests
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean the database after running tests
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // Placeholder for test suites
  describe('POST /auth/register', () => {
    const registerDto = {
      fullname: 'Test User',
      nim: '1234567890',
      email: 'test@example.com',
      password: 'password123',
    };

    // Clean up user after each test in this suite
    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: registerDto.email } });
      await prisma.user.deleteMany({ where: { nim: registerDto.nim } }); // Clean up potential duplicates if tests fail midway
    });

    it('should successfully register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201) // Assuming register returns 201 Created
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 200); // Or 201 based on your service impl
          expect(res.body).toHaveProperty('message', 'Berhasil Membuat Akun');
          expect(res.body.data).toHaveProperty('user_id');
          expect(res.body.data).toHaveProperty('email', registerDto.email);
          expect(res.body.data.token).toHaveProperty('access_token');
          expect(res.body.data.token).toHaveProperty('refresh_token');
        });
    });

    it('should fail if NIM already exists', async () => {
      // First, register a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // Try to register again with the same NIM
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, email: 'another@example.com' }) // Different email, same NIM
        .expect(409) // Conflict
        .expect((res) => {
          expect(res.body.message).toContain(
            'User with this NIM or email already exists',
          );
        });
    });

    it('should fail if email already exists', async () => {
      // First, register a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // Try to register again with the same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, nim: '0987654321' }) // Different NIM, same email
        .expect(409) // Conflict
        .expect((res) => {
          expect(res.body.message).toContain(
            'User with this NIM or email already exists',
          );
        });
    });

    it('should fail if required field (fullname) is missing', () => {
      const { fullname, ...incompleteDto } = registerDto;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(400) // Bad Request due to validation
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['fullname should not be empty']),
          );
        });
    });

    it('should fail if password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, password: '123' }) // Short password
        .expect(400) // Bad Request due to validation
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'password must be longer than or equal to 6 characters',
            ]),
          );
        });
    });
  });

  describe('POST /auth/login', () => {
    const registerDto = {
      fullname: 'Login Test User',
      nim: '1122334455',
      email: 'login.test@example.com',
      password: 'password123',
    };

    const loginDto = {
      email: registerDto.email,
      password: registerDto.password,
    };

    beforeEach(async () => {
      // Clean up potential leftovers first
      await prisma.user.deleteMany({ where: { email: registerDto.email } });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
    });

    afterEach(async () => {
      // Clean up user and tokens after each test using email as the primary identifier for cleanup
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      if (user) {
        await prisma.token.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      } else {
        // Fallback cleanup if user wasn't found by email (e.g., test failed before user creation completed properly)
        await prisma.user.deleteMany({ where: { nim: registerDto.nim } });
      }
    });

    it('should successfully login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto) // Send email and password
        .expect(200) // Default POST status
        .expect((res) => {
          // Check the custom response structure from the service
          expect(res.body).toHaveProperty('status', 200);
          expect(res.body).toHaveProperty('message', 'Login berhasil');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('refresh_token');
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...loginDto, password: 'wrongpassword' }) // Correct email, wrong password
        .expect(401) // Unauthorized (as thrown by the service)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid credentials'); // Exact match
        });
    });

    it('should fail with non-existent NIM', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...loginDto, email: 'nonexistent@example.com' }) // Non-existent email
        .expect(401) // Unauthorized (as thrown by the service)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid credentials'); // Exact match
        });
    });
    it('should fail if required field (email) is missing', () => {
      const { email, ...incompleteDto } = loginDto; // Destructure email
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(incompleteDto)
        .expect(400) // Bad Request due to validation
        .expect((res) => {
          // Check specific validation messages for email
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'email must be a string',
              'email should not be empty',
            ]),
          ); // Update expected validation message
        });
    });
    it('should fail if required field (password) is missing', () => {
      const { password, ...incompleteDto } = loginDto;
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(incompleteDto)
        .expect(400) // Bad Request due to validation
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['password should not be empty']),
          ); // Password validation remains the same
        });
    });
  });

  describe('POST /auth/refresh', () => {
    const registerDto = {
      fullname: 'Refresh Test User',
      nim: '5566778899', // Keep nim for registration
      email: 'refresh.test@example.com',
      password: 'password123',
    };
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login user to get tokens
      // Clean up potential leftovers first
      await prisma.user.deleteMany({ where: { email: registerDto.email } });
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: registerDto.email, password: registerDto.password }); // Login with email

      // Check if login was successful and data exists before accessing token
      if (
        loginRes.body &&
        loginRes.body.data &&
        loginRes.body.data.refresh_token
      ) {
        refreshToken = loginRes.body.data.refresh_token;
      } else {
        console.error(
          'Failed to get refresh token during setup:',
          loginRes.body,
        );
        refreshToken = null; // Set to null if login failed
      }
    });

    afterEach(async () => {
      // Clean up user and tokens using email
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      if (user) {
        await prisma.token.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      } else {
        await prisma.user.deleteMany({ where: { nim: registerDto.nim } });
      }
    });

    it('should successfully refresh the access token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`) // RefreshTokenGuard expects token in header
        .expect(201) // Default POST status - Keep 201
        .expect((res) => {
          // Check the custom response structure - Keep checks
          expect(res.body).toHaveProperty('status', 200);
          expect(res.body).toHaveProperty(
            'message',
            'Token berhasil diperbarui',
          );
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data.access_token).not.toBeNull();
        });
    });

    it('should fail with an invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401) // Unauthorized (as thrown by the service)
        .expect((res) => {
          expect(res.body.message).toEqual('Unauthorized'); // Update expected message
        });
    });

    it('should fail if Authorization header is missing', () => {
      // Note: This tests the RefreshTokenGuard directly
      return (
        request(app.getHttpServer())
          .post('/auth/refresh')
          // No Authorization header
          .expect(401) // Unauthorized because guard fails
          .expect((res) => {
            expect(res.body.message).toContain('Unauthorized'); // Default NestJS message when guard fails without specific error
          })
      );
    });
  });

  describe('POST /auth/logout', () => {
    const registerDto = {
      fullname: 'Logout Test User',
      nim: '9988776655', // Keep nim for registration
      email: 'logout.test@example.com',
      password: 'password123',
    };
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login user to get tokens
      // Clean up potential leftovers first
      await prisma.user.deleteMany({ where: { email: registerDto.email } });
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
      // Capture userId only if registration was successful and returned expected data
      if (
        registerRes.body &&
        registerRes.body.data &&
        registerRes.body.data.user_id
      ) {
        userId = registerRes.body.data.user_id;
      } else {
        console.error('Failed to get user_id during setup:', registerRes.body);
        userId = null;
      }

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: registerDto.email, password: registerDto.password }); // Login with email

      // Check if login was successful and data exists before accessing token
      if (
        loginRes.body &&
        loginRes.body.data &&
        loginRes.body.data.access_token
      ) {
        accessToken = loginRes.body.data.access_token;
      } else {
        console.error(
          'Failed to get access token during setup:',
          loginRes.body,
        );
        accessToken = null; // Set to null if login failed
      }
    });

    afterEach(async () => {
      // Clean up user and tokens using email
      if (userId) {
        await prisma.token.deleteMany({ where: { userId: userId } });
        await prisma.user.delete({ where: { id: userId } }).catch(() => {}); // Use delete and ignore error if user not found
      }
      // Fallback cleanup just in case userId wasn't captured or user was already deleted
      await prisma.user.deleteMany({ where: { email: registerDto.email } });
      userId = null;
      accessToken = null;
    });

    it('should successfully logout the user', async () => {
      // Verify token exists before logout
      const tokensBefore = await prisma.token.findMany({ where: { userId } });
      // Only run token check if userId was successfully captured
      if (userId) {
        const tokensBefore = await prisma.token.findMany({ where: { userId } });
        expect(tokensBefore.length).toBeGreaterThan(0);
      } else {
        console.warn(
          'Skipping token check before logout as userId was not available.',
        );
      }

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200) // Match controller's @HttpCode(HttpStatus.OK)
        .expect((res) => {
          // Check the custom response structure - Keep checks
          expect(res.body).toHaveProperty('status', 200);
          expect(res.body).toHaveProperty('message', 'Logout berhasil');
          expect(res.body.data).toBeNull();
        });

      // Verify tokens are deleted after logout, only if userId was available
      if (userId) {
        const tokensAfter = await prisma.token.findMany({ where: { userId } });
        expect(tokensAfter.length).toBe(0);
      }
    });

    it('should fail if access token is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401) // Unauthorized
        .expect((res) => {
          // The exact message might depend on JwtAuthGuard/JwtStrategy implementation
          expect(res.body.message).toContain('Unauthorized');
        });
    });

    it('should fail if Authorization header is missing', () => {
      // Note: This tests the JwtAuthGuard directly
      return (
        request(app.getHttpServer())
          .post('/auth/logout')
          // No Authorization header
          .expect(401) // Unauthorized because guard fails
          .expect((res) => {
            expect(res.body.message).toContain('Unauthorized'); // Default NestJS message
          })
      );
    });
  });
});
