const PLATFORM_FEE_FLAT = 20;
const PLATFORM_FEE_PERCENT = 0.01;

export interface PricingLineItem {
    priceSnapshot: number;
    quantity: number;
}

export interface PricingResult {
    subtotal: number;
    platformFee: number;
    discount: number;
    total: number;
}

export function calculatePricing(
    items: PricingLineItem[],
    discountPercent = 0,
): PricingResult {
    const subtotal = round2(
        items.reduce(
            (sum, item) => sum + item.priceSnapshot * item.quantity,
            0,
        ),
    );
    const platformFee = round2(
        Math.max(PLATFORM_FEE_FLAT, subtotal * PLATFORM_FEE_PERCENT),
    );
    const discount = round2(subtotal * (discountPercent / 100));
    const total = round2(subtotal - discount + platformFee);

    return { subtotal, platformFee, discount, total };
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}
