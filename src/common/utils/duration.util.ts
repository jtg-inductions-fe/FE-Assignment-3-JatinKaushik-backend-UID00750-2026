const UNIT_MS: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};

/** Matches the JWT_*_EXPIRES_IN format already used in .env.example ("15m", "7d"). */
export function parseDurationToMs(duration: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
    if (!match) {
        throw new Error(
            `Invalid duration string "${duration}" — expected formats like "15m" or "7d".`,
        );
    }
    const [, value, unit] = match;
    return Number(value) * UNIT_MS[unit];
}

/** Adds a duration string (e.g., "15m", "7d") to a start date and returns the future Date. */
export function addDuration(duration: string, from: Date = new Date()): Date {
    return new Date(from.getTime() + parseDurationToMs(duration));
}
