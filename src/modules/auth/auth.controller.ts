import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponse } from './types/auth-response.interface';

/**
 * Controller handling public authentication operations.
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Registers a new customer or restaurant owner account.
     *
     * @param dto User registration parameters
     * @returns Newly created user profile
     */
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('register')
    async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
        return this.authService.register(dto);
    }
}
