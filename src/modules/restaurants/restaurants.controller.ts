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
    Query,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { SearchRestaurantsQueryDto } from './dto/search-restaurants-query.dto';
import { RestaurantResponseDto } from './dto/restaurant-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { Role } from '@enums/role.enum';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Serialize } from '@interceptors/serialize.interceptor';
import { Restaurant } from '@prisma-generated/client';
import { PaginatedResult } from '@interfaces/paginated-result.interface';

@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    /**
     * Endpoint to create a new restaurant.
     * Restricted to users with RESTAURANT_OWNER role.
     *
     * @param user - Authenticated owner payload.
     * @param dto - Restaurant creation data.
     * @returns Newly created restaurant profile.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @Serialize(RestaurantResponseDto)
    @Post()
    async create(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreateRestaurantDto,
    ): Promise<Restaurant> {
        return this.restaurantsService.create(user.id, dto);
    }

    /**
     * Endpoint to fetch paginated restaurants.
     * Open to both RESTAURANT_OWNER and CUSTOMER roles.
     * - Owners get their own restaurants.
     * - Customers get all active public restaurants.
     *
     * @param user - Authenticated user payload.
     * @param query - Search criteria and page options.
     * @returns Paginated list of restaurant profiles.
     */
    @Serialize(RestaurantResponseDto)
    @Get()
    async findAll(
        @CurrentUser() user: CurrentUserPayload,
        @Query() query: SearchRestaurantsQueryDto,
    ): Promise<PaginatedResult<Restaurant>> {
        return this.restaurantsService.findAll(user, query);
    }

    /**
     * Endpoint to update an existing restaurant.
     * Restricted to RESTAURANT_OWNER role.
     *
     * @param user - Authenticated owner payload.
     * @param id - Restaurant ID from route params.
     * @param dto - Update payload.
     * @returns Updated restaurant profile.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @Serialize(RestaurantResponseDto)
    @Patch(':id')
    async update(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
        @Body() dto: UpdateRestaurantDto,
    ): Promise<Restaurant> {
        return this.restaurantsService.update(user.id, id, dto);
    }

    /**
     * Endpoint to soft-delete a restaurant and its linked items.
     * Restricted to RESTAURANT_OWNER role.
     *
     * @param user - Authenticated owner payload.
     * @param id - Restaurant ID from route params.
     * @returns Resolves with 204 No Content when successful.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async remove(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
    ): Promise<void> {
        return this.restaurantsService.remove(user.id, id);
    }
}
