import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@modules/auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from '@dto/create-address.dto';
import { UpdateAddressDto } from '@dto/update-address.dto';
import { UserRepository } from './repositories/user.repository';
import { AddressRepository } from '@common/repositories/address.repository';
import { Address, User } from '@prisma-generated/client';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly addressRepository: AddressRepository,
        private readonly authService: AuthService,
    ) {}

    /**
     * Retrieves active profile details for an authenticated user.
     *
     * @param userId - Unique user identifier.
     * @returns Active user entity profile.
     */
    async getProfile(userId: string): Promise<User> {
        return this.getActiveUserOrThrow(userId);
    }

    /**
     * Updates profile details for an active user.
     *
     * @param userId - Unique user identifier.
     * @param dto - Profile update payload.
     * @returns Updated user entity.
     */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
        await this.getActiveUserOrThrow(userId);
        return this.userRepository.updateProfile(userId, dto);
    }

    /**
     * Deactivates a user account, anonymizes the email address, and revokes all active sessions.
     *
     * @param userId - Unique user identifier.
     */
    async deactivate(userId: string): Promise<void> {
        await this.userRepository.softDelete(userId);
        await this.authService.logoutAll(userId);
    }

    /**
     * Validates user existence and returns active profile.
     *
     * @param userId - Unique user identifier.
     * @returns Active user profile.
     * @throws UnauthorizedException - If user does not exist or is soft-deleted.
     */
    private async getActiveUserOrThrow(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return user;
    }

    // Address

    /**
     * Lists all saved addresses for a user.
     *
     * @param userId - Unique user identifier.
     * @returns Array of user addresses.
     */
    async listAddresses(userId: string): Promise<Address[]> {
        return this.addressRepository.findByUserId(userId);
    }

    /**
     * Creates a new address entry for a user.
     *
     * @param userId - Unique user identifier.
     * @param dto - Address creation parameters.
     * @returns Newly created address record.
     */
    async createAddress(
        userId: string,
        dto: CreateAddressDto,
    ): Promise<Address> {
        return this.addressRepository.create({
            user: { connect: { id: userId } },
            street: dto.street,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
            label: dto.label,
        });
    }

    /**
     * Updates an existing user address.
     *
     * @param userId - Unique user identifier.
     * @param addressId - Unique address record identifier.
     * @param dto - Address update payload.
     * @returns Updated address record.
     */
    async updateAddress(
        userId: string,
        addressId: string,
        dto: UpdateAddressDto,
    ): Promise<Address> {
        const address = await this.addressRepository.findByIdAndUserId(
            addressId,
            userId,
        );

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        return this.addressRepository.update({ id: addressId }, dto);
    }

    /**
     * Removes an address record.
     *
     * @param userId - Unique user identifier.
     * @param addressId - Unique address record identifier.
     * @throws NotFoundException - If target address is not found or does not belong to user.
     */
    async removeAddress(userId: string, addressId: string): Promise<void> {
        const address = await this.addressRepository.findByIdAndUserId(
            addressId,
            userId,
        );

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        await this.addressRepository.removeById(addressId);
    }
}
