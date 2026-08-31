import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from '@dto/create-address.dto';
import { UpdateAddressDto } from '@dto/update-address.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AddressResponseDto } from '@dto/address-response.dto';
import { Serialize } from '@interceptors/serialize.interceptor';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { CurrentUser } from '@decorators/current-user.decorator';
import { Address, User } from '@prisma-generated/client';

@Controller('users/me')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    /**
     * Retrieves the profile details of the currently authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @returns Profile entity of the requesting user serialized via UserResponseDto.
     */
    @Serialize(UserResponseDto)
    @Get()
    async getProfile(@CurrentUser() user: CurrentUserPayload): Promise<User> {
        return this.usersService.getProfile(user.id);
    }

    /**
     * Updates profile details for the currently authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @param dto - Profile update parameters.
     * @returns Updated user profile entity serialized via UserResponseDto.
     */
    @Serialize(UserResponseDto)
    @Patch()
    async updateProfile(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: UpdateProfileDto,
    ): Promise<User> {
        return this.usersService.updateProfile(user.id, dto);
    }

    /**
     * Deactivates the authenticated user account, anonymizes email, and clears active sessions.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @returns Resolves with 204 No Content when deactivation finishes.
     */
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    async deactivate(@CurrentUser() user: CurrentUserPayload): Promise<void> {
        return this.usersService.deactivate(user.id);
    }

    /**
     * Retrieves all saved addresses belonging to the authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @returns List of active user addresses serialized via AddressResponseDto.
     */
    @Serialize(AddressResponseDto)
    @Get('addresses')
    async listAddresses(
        @CurrentUser() user: CurrentUserPayload,
    ): Promise<Address[]> {
        return this.usersService.listAddresses(user.id);
    }

    /**
     * Creates a new saved address entry for the authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @param dto - Address creation details.
     * @returns Newly created address record serialized via AddressResponseDto.
     */
    @Serialize(AddressResponseDto)
    @Post('addresses')
    async createAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateAddressDto,
    ): Promise<Address> {
        return this.usersService.createAddress(user.id, dto);
    }

    /**
     * Updates an existing saved address belonging to the authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @param addressId - Unique address record identifier from URL parameter.
     * @param dto - Address update fields.
     * @returns Updated address record serialized via AddressResponseDto.
     */
    @Serialize(AddressResponseDto)
    @Patch('addresses/:id')
    async updateAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') addressId: string,
        @Body() dto: UpdateAddressDto,
    ): Promise<Address> {
        return this.usersService.updateAddress(user.id, addressId, dto);
    }

    /**
     * Removes an existing saved address belonging to the authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @param addressId - Unique address record identifier from URL parameter.
     * @returns Resolves with 204 No Content upon successful removal.
     */
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('addresses/:id')
    async removeAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') addressId: string,
    ): Promise<void> {
        return this.usersService.removeAddress(user.id, addressId);
    }
}
