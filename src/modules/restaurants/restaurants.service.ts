import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { SearchRestaurantsQueryDto } from './dto/search-restaurants-query.dto';
import { CurrentUserPayload } from '@interfaces/current-user.interface';
import { parseTimeString } from '@utils/time.util';
import { RestaurantRepository } from './repositories/restaurants.repository';
import { Restaurant } from '@prisma-generated/client';
import { PaginatedResult } from '@interfaces/paginated-result.interface';
import { Role } from '@common/enums/role.enum';

@Injectable()
export class RestaurantsService {
    constructor(private readonly restaurantRepository: RestaurantRepository) {}

    /**
     * Creates a new restaurant record for a restaurant owner.
     *
     * @param ownerId - Unique identifier of the requesting restaurant owner.
     * @param dto - Restaurant creation details.
     * @returns Newly created restaurant entity.
     */
    async create(
        ownerId: string,
        dto: CreateRestaurantDto,
    ): Promise<Restaurant> {
        const existing = await this.restaurantRepository.findFirst({
            ownerId,
            name: dto.name,
        });

        if (existing) {
            throw new ConflictException(
                'You already have an active restaurant with this name',
            );
        }

        if (dto.closingTime <= dto.openingTime) {
            throw new BadRequestException(
                `Invalid operating hours: closingTime (${dto.closingTime}) must be later than openingTime (${dto.openingTime}).`,
            );
        }

        const { openingTime, closingTime, address, ...baseFields } = dto;

        return this.restaurantRepository.createWithAddress({
            ...baseFields,
            ownerId,
            openingTime: parseTimeString(openingTime),
            closingTime: parseTimeString(closingTime),
            address: {
                create: { ...address },
            },
        });
    }

    /**
     * Updates an existing restaurant owned by the requesting user.
     *
     * @param ownerId - Unique identifier of the owner user.
     * @param restaurantId - Unique identifier of the target restaurant.
     * @param dto - Update parameters.
     * @returns Updated restaurant entity.
     * @throws NotFoundException - If restaurant is missing or not owned by requesting user.
     */
    async update(
        ownerId: string,
        restaurantId: string,
        dto: UpdateRestaurantDto,
    ): Promise<Restaurant> {
        const currentRestaurant = await this.assertOwnedRestaurant(
            ownerId,
            restaurantId,
        );

        const { openingTime, closingTime, address, ...baseFields } = dto;

        const finalOpening = openingTime ?? currentRestaurant.openingTime;
        const finalClosing = closingTime ?? currentRestaurant.closingTime;

        if (finalOpening && finalClosing && finalClosing <= finalOpening) {
            throw new BadRequestException(
                'Invalid operating hours: closingTime must be later than openingTime.',
            );
        }

        const updateData = {
            ...baseFields,
            ...(openingTime && { openingTime: parseTimeString(openingTime) }),
            ...(closingTime && { closingTime: parseTimeString(closingTime) }),
            ...(address && {
                address: {
                    upsert: {
                        create: { ...address },
                        update: { ...address },
                    },
                },
            }),
        };

        return this.restaurantRepository.updateWithAddress(
            restaurantId,
            updateData,
        );
    }

    /**
     * Removes a restaurant by running a multi-level cascading soft delete.
     *
     * @param ownerId - Unique identifier of the owner user.
     * @param restaurantId - Unique identifier of the target restaurant.
     * @throws NotFoundException - If restaurant is missing or not owned by user.
     */
    async remove(ownerId: string, restaurantId: string): Promise<void> {
        await this.assertOwnedRestaurant(ownerId, restaurantId);
        await this.restaurantRepository.softDelete(restaurantId);
    }

    /**
     * Retrieves a paginated list of restaurants based on user role and query filters.
     *
     * @param user - Authenticated user payload.
     * @param query - Filter options (name, dietaryType, pagination limits).
     * @returns Paginated result list.
     */
    async findAll(
        user: CurrentUserPayload,
        query: SearchRestaurantsQueryDto,
    ): Promise<PaginatedResult<Restaurant>> {
        const ownerId =
            user.role === Role.RESTAURANT_OWNER ? user.id : undefined;
        return this.restaurantRepository.findAllPaginated(query, ownerId);
    }

    /**
     * Helper check to verify ownership of a restaurant.
     *
     * @param ownerId - Unique identifier of the owner user.
     * @param restaurantId - Unique identifier of the target restaurant.
     * @returns Verified active restaurant entity.
     * @throws NotFoundException - If restaurant does not exist or is soft-deleted.
     */
    private async assertOwnedRestaurant(
        ownerId: string,
        restaurantId: string,
    ): Promise<Restaurant> {
        const restaurant = await this.restaurantRepository.findByIdAndOwner(
            restaurantId,
            ownerId,
        );

        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }

        return restaurant;
    }
}
