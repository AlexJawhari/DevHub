import jwt from 'jsonwebtoken';

export type AuthUser = { userId: string; email?: string };
export type GetSupabaseUser = (token: string) => Promise<{ id: string; email?: string } | null>;

/**
 * Resolves a bearer token to a user. Legacy self-issued JWTs are checked locally first,
 * then Supabase Auth access tokens. Returns null when neither is valid.
 */
export async function verifyToken(token: string, getSupabaseUser: GetSupabaseUser): Promise<AuthUser | null> {
    const secret = process.env.JWT_SECRET;
    if (secret) {
        try {
            const d = jwt.verify(token, secret) as { userId?: string; email?: string };
            if (d.userId) return { userId: d.userId, email: d.email };
        } catch { /* not a legacy token */ }
    }
    const user = await getSupabaseUser(token).catch(() => null);
    return user ? { userId: user.id, email: user.email } : null;
}
