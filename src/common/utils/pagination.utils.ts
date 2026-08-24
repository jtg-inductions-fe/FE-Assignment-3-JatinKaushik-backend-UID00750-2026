import { PaginatedResult } from '@interfaces/paginated-result.interface';
import { PaginationQueryDto } from '@dto/pagination-query.dto';

interface PrismaListDelegate<T> {
    findMany(options: {
        where?: object;
        orderBy?: object;
        skip?: number;
        take?: number;
    }): Promise<T[]>;
    count(options: { where?: object }): Promise<number>;
}

export async function paginate<T>(
    model: PrismaListDelegate<T>,
    { page, limit, skip }: PaginationQueryDto,
    options: { where?: object; orderBy?: object } = {},
): Promise<PaginatedResult<T>> {
    const [data, total] = await Promise.all([
        model.findMany({ ...options, skip, take: limit }),
        model.count({ where: options.where }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}
