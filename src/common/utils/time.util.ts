import { TIME_24H_REGEX } from '../constants/validation.constants';

/**
 * Converts a 24-hour time string into a Date object for the database.
 *
 * @param time - A string in "HH:mm" 24-hour format (e.g., "09:00", "23:15").
 * @returns A UTC Date object containing the specified hours and minutes.
 */

export function parseTimeString(time: string): Date {
    const match = TIME_24H_REGEX.exec(time);
    if (!match) {
        throw new Error(
            `Invalid time "${time}" — expected 24-hour "HH:mm" format.`,
        );
    }
    const [, hours, minutes] = match;
    return new Date(Date.UTC(2026, 0, 1, Number(hours), Number(minutes), 0));
}

/**
 * Converts a database Date object back into a clean 24-hour time string.
 *
 * @param date - The Date object.
 * @returns A 5-character string in "HH:mm" format.
 */
export function formatTimeString(date: Date): string {
    return date.toISOString().slice(11, 16);
}
