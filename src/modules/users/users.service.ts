import {
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { EXTENDED_PRISMA_CLIENT } from '../../prisma/prisma.module';
import type { ExtendedPrismaClient } from '../../prisma/extensions/soft-delete.extension';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        private readonly prisma: ExtendedPrismaClient,
        private readonly authService: AuthService,
    ) {}

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        await this.getActiveUserOrThrow(userId);

        return this.prisma.user.update({
            where: { id: userId },
            data: { ...dto },
        });
    }

    async deactivate(userId: string): Promise<void> {
        await this.getActiveUserOrThrow(userId);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
            },
        });

        await this.authService.logoutAll(userId);
    }

    private async getActiveUserOrThrow(userId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return user;
    }

    // Address

    async listAddresses(userId: string) {
        return this.prisma.address.findMany({
            where: { userId, deletedAt: null },
            orderBy: [{ createdAt: 'desc' }],
        });
    }

    async createAddress(userId: string, dto: CreateAddressDto) {
        return this.prisma.address.create({
            data: {
                userId,
                street: dto.street,
                city: dto.city,
                state: dto.state,
                pincode: dto.pincode,
                label: dto.label,
            },
        });
    }

    async updateAddress(
        userId: string,
        addressId: string,
        dto: UpdateAddressDto,
    ) {
        return await this.prisma.address.update({
            where: { id: addressId, userId },
            data: { ...dto },
        });
    }

    async removeAddress(userId: string, addressId: string): Promise<void> {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new NotFoundException('Address not found');
        }

        await this.prisma.address.delete({ where: { id: addressId } });
    }
}
