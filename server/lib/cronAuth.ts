import { createHash, timingSafeEqual } from 'node:crypto';

/** Constant-time check of the cron shared secret; false when no secret is configured. */
export function isCronAuthorized(provided: string | undefined, secret: string | undefined): boolean {
    if (!secret || !provided) return false;
    const h = (v: string) => createHash('sha256').update(v).digest();
    return timingSafeEqual(h(provided), h(secret));
}
