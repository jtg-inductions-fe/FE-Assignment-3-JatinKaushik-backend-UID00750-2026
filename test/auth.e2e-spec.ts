import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDatabase, closeDatabase } from './test-db.util';
import { Role } from '../src/common/enums/role.enum';
import { App } from 'supertest/types';

interface UserResponse {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
}

interface AuthDataPayload {
    accessToken?: string;
    user?: UserResponse;
}

interface AuthResponse {
    success: boolean;
    data?: AuthDataPayload;
    message?: string | string[];
}

function getSetCookies(response: request.Response): string[] {
    const cookieHeader = response.headers['set-cookie'];
    if (!cookieHeader) return [];
    return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

describe('AuthController (E2E)', () => {
    let app: INestApplication;

    const getServer = (): App => app.getHttpServer() as App;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await clearDatabase();
        await closeDatabase();
        await app.close();
    });

    // POST /auth/register
    describe('POST /auth/register', () => {
        const validRegisterDto = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123!',
            phone: '+1234567890',
            role: Role.CUSTOMER,
        };

        it('should register a new user successfully and return 201 Created', async () => {
            const response = await request(getServer())
                .post('/auth/register')
                .send(validRegisterDto)
                .expect(HttpStatus.CREATED);

            const responseBody = response.body as AuthResponse;

            expect(responseBody.data).toHaveProperty('user');
            expect(responseBody.data?.user).toEqual({
                id: expect.any(String) as string,
                email: validRegisterDto.email,
                name: validRegisterDto.name,
                phone: validRegisterDto.phone,
                role: validRegisterDto.role,
                createdAt: expect.any(String) as string,
                updatedAt: expect.any(String) as string,
            });

            // dynamic fields without assignments
            expect(typeof responseBody.data?.user?.id).toBe('string');
            expect(typeof responseBody.data?.user?.createdAt).toBe('string');
            expect(typeof responseBody.data?.user?.updatedAt).toBe('string');

            // Ensure sensitive password fields are stripped
            expect(responseBody.data?.user).not.toHaveProperty('passwordHash');
            expect(responseBody.data?.user).not.toHaveProperty('password');
        });

        it('should throw 409 Conflict when registering with an existing email', async () => {
            await request(getServer())
                .post('/auth/register')
                .send(validRegisterDto)
                .expect(HttpStatus.CREATED);

            // Duplicate registration attempt
            const response = await request(getServer())
                .post('/auth/register')
                .send(validRegisterDto)
                .expect(HttpStatus.CONFLICT);

            const responseBody = response.body as AuthResponse;

            expect(responseBody).toHaveProperty('message');
            expect(responseBody.message).toContain('already exists');
        });

        it('should throw 400 Bad Request when password fails complexity rules', async () => {
            const response = await request(getServer())
                .post('/auth/register')
                .send({
                    ...validRegisterDto,
                    password: 'weak',
                })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toHaveProperty('message');
        });
    });

    // POST /auth/login
    describe('POST /auth/login', () => {
        const credentials = {
            email: 'login.test@example.com',
            password: 'StrongPassword123!',
        };

        beforeEach(async () => {
            // Seed user in test DB
            await request(getServer()).post('/auth/register').send({
                name: 'Login User',
                email: credentials.email,
                password: credentials.password,
                phone: '+1987654321',
                role: Role.CUSTOMER,
            });
        });

        it('should authenticate user, return accessToken and set HTTP-Only refresh cookie', async () => {
            const response = await request(getServer())
                .post('/auth/login')
                .send(credentials)
                .expect(HttpStatus.OK);

            const responseBody = response.body as AuthResponse;

            // Verify response body payload
            expect(responseBody.data).toHaveProperty('accessToken');
            expect(responseBody.data).toHaveProperty('user');
            expect(responseBody.data?.user).toBeDefined();
            if (responseBody.data?.user) {
                expect(responseBody.data?.user.email).toBe(credentials.email);
            }
            expect(responseBody.data).not.toHaveProperty('refreshToken');

            // Verify Set-Cookie header formatting
            const cookies = getSetCookies(response);
            expect(cookies.length).toBeGreaterThan(0);

            const refreshCookie = cookies.find((c) =>
                c.startsWith('refreshToken='),
            );
            expect(refreshCookie).toBeDefined();
            expect(refreshCookie).toContain('HttpOnly');
            expect(refreshCookie).toContain('SameSite=Strict');
        });

        it('should return 401 Unauthorized when password is invalid', async () => {
            const response = await request(getServer())
                .post('/auth/login')
                .send({
                    email: credentials.email,
                    password: 'WrongPassword999!',
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toHaveProperty(
                'message',
                'Invalid email or password',
            );
        });
    });
});
