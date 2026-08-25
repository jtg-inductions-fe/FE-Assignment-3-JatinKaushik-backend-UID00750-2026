import { createHmac, randomBytes } from 'crypto';

/** Generates a secure, 128-character random hexadecimal token. */
export function generateOpaqueToken(): string {
    return randomBytes(64).toString('hex');
}

/** Computes a deterministic HMAC-SHA256 hash of a token using a secret key. */
export function hashToken(rawToken: string, secret: string): string {
    return createHmac('sha256', secret).update(rawToken).digest('hex');
}
