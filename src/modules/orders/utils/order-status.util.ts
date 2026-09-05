import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma-generated/enums';

const OWNER_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
    [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
    [OrderStatus.PREPARING]: [OrderStatus.OUT_FOR_DELIVERY],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.REJECTED]: [],
};

export function assertValidOwnerTransition(
    current: OrderStatus,
    next: OrderStatus,
): void {
    const allowed = OWNER_ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
        throw new ConflictException(
            `Cannot move an order from ${current} to ${next}. Allowed next state(s): ${
                allowed.length
                    ? allowed.join(', ')
                    : 'none — this is a final state'
            }.`,
        );
    }
}
