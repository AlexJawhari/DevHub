/** A POST of dummy credentials only reveals a real login endpoint if the server rejects them as bad input or bad credentials. */
export function isLoginRejection(status: number): boolean {
    return [400, 401, 403, 422].includes(status);
}
