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
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { CurrentUser } from '@decorators/current-user.decorator';

@Controller('users/me')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Serialize(UserResponseDto)
    @Patch()
    updateProfile(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    deactivate(@CurrentUser() user: CurrentUserPayload) {
        return this.usersService.deactivate(user.id);
    }

    @Serialize(AddressResponseDto)
    @Get('addresses')
    listAddresses(@CurrentUser() user: CurrentUserPayload) {
        return this.usersService.listAddresses(user.id);
    }

    @Serialize(AddressResponseDto)
    @Post('addresses')
    createAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateAddressDto,
    ) {
        return this.usersService.createAddress(user.id, dto);
    }

    @Serialize(AddressResponseDto)
    @Patch('addresses/:id')
    updateAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') addressId: string,
        @Body() dto: UpdateAddressDto,
    ) {
        return this.usersService.updateAddress(user.id, addressId, dto);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('addresses/:id')
    removeAddress(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') addressId: string,
    ) {
        return this.usersService.removeAddress(user.id, addressId);
    }
}
