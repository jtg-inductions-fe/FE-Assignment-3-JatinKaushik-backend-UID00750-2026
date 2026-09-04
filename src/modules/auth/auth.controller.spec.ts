import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@enums/role.enum';

describe('AuthController (Unit Tests)', () => {
    let controller: AuthController;
    let mockAuthService: {
        register: jest.Mock;
        login: jest.Mock;
    };
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        mockAuthService = {
            register: jest.fn(),
            login: jest.fn(),
        };

        mockResponse = {
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // register() Endpoint
    describe('register', () => {
        it('should delegate registration to AuthService and return the sanitized user profile', async () => {
            const registerDto: RegisterDto = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'Password123!',
                phone: '+1234567890',
                role: Role.CUSTOMER,
            };

            const expectedResponse = {
                user: {
                    id: 'user-uuid-1',
                    name: registerDto.name,
                    email: registerDto.email,
                    phone: registerDto.phone,
                    role: registerDto.role,
                    createdAt: new Date(),
                },
            };

            mockAuthService.register.mockResolvedValue(expectedResponse);

            const result = await controller.register(registerDto);

            expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(expectedResponse);
        });
    });

    // login() Endpoint
    describe('login', () => {
        it('should set HTTP-Only refresh cookie and omit refresh token from response body', async () => {
            const loginDto: LoginDto = {
                email: 'jane@example.com',
                password: 'Password123!',
            };

            const mockUserResponse = {
                id: 'user-uuid-1',
                name: 'Jane Doe',
                email: loginDto.email,
                phone: '+1234567890',
                role: Role.CUSTOMER,
                createdAt: new Date(),
            };

            const serviceLoginResult = {
                user: mockUserResponse,
                accessToken: 'mock-access-token',
                refreshToken: 'raw-refresh-token',
            };

            mockAuthService.login.mockResolvedValue(serviceLoginResult);

            const result = await controller.login(
                loginDto,
                mockResponse as Response,
            );

            expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);

            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'raw-refresh-token',
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                },
            );

            expect(result).toEqual({
                user: mockUserResponse,
                accessToken: 'mock-access-token',
            });
            expect(result).not.toHaveProperty('refreshToken');
        });
    });
});
