import { PaginatedResult } from '@interfaces/paginated-result.interface';
import { PaginationQueryDto } from '@dto/pagination-query.dto';

interface PrismaModelDelegate<T, WhereInput, OrderByInput> {
    findMany(options: {
        where?: WhereInput;
        orderBy?: OrderByInput;
        skip?: number;
        take?: number;
    }): Promise<T[]>;
    count(options: { where?: WhereInput }): Promise<number>;
}

export async function paginate<
    T,
    W = Record<string, unknown>,
    O = Record<string, unknown>,
>(
    model: PrismaModelDelegate<T, W, O>,
    { page, limit }: PaginationQueryDto,
    options: { where?: W; orderBy?: O } = {},
): Promise<PaginatedResult<T>> {
    const where = options.where ?? ({} as W);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        model.findMany({ where, orderBy: options.orderBy, skip, take: limit }),
        model.count({ where }),
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
