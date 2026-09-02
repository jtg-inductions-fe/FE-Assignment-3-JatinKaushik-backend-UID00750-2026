import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { SearchRestaurantsQueryDto } from './dto/search-restaurants-query.dto';
import { CurrentUserPayload } from '@interfaces/current-user.interface';
import { parseTimeString } from '@utils/time.util';
import { RestaurantRepository } from './repositories/restaurants.repository';
import { Restaurant } from '@prisma-generated/client';
import { PaginatedResult } from '@interfaces/paginated-result.interface';

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
        return this.restaurantRepository.createWithAddress({
            ownerId,
            name: dto.name,
            description: dto.description,
            dietaryType: dto.dietaryType,
            phone: dto.phone,
            openingTime: parseTimeString(dto.openingTime),
            closingTime: parseTimeString(dto.closingTime),
            address: {
                create: {
                    street: dto.address.street,
                    city: dto.address.city,
                    state: dto.address.state,
                    pincode: dto.address.pincode,
                },
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
        await this.assertOwnedRestaurant(ownerId, restaurantId);

        return this.restaurantRepository.updateWithAddress(restaurantId, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && {
                description: dto.description,
            }),
            ...(dto.dietaryType !== undefined && {
                dietaryType: dto.dietaryType,
            }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.openingTime !== undefined && {
                openingTime: parseTimeString(dto.openingTime),
            }),
            ...(dto.closingTime !== undefined && {
                closingTime: parseTimeString(dto.closingTime),
            }),
            ...(dto.address && {
                address: {
                    update: { ...dto.address },
                },
            }),
        });
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
        return this.restaurantRepository.findAllPaginated(user, query);
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
