import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { verifyToken } from './auth';

process.env.JWT_SECRET = 'test-secret';
const supa = async (t: string) => (t === 'supa-token' ? { id: 'u2', email: 'b@x.com' } : null);

test('verifyToken accepts legacy JWTs, Supabase tokens, and rejects the rest', async () => {
    const legacy = jwt.sign({ userId: 'u1', email: 'a@x.com' }, 'test-secret');
    assert.deepEqual(await verifyToken(legacy, supa), { userId: 'u1', email: 'a@x.com' });
    assert.deepEqual(await verifyToken('supa-token', supa), { userId: 'u2', email: 'b@x.com' });
    assert.equal(await verifyToken('garbage', supa), null);
    assert.equal(await verifyToken(jwt.sign({ userId: 'u1' }, 'wrong'), supa), null);
    assert.equal(await verifyToken('x', async () => { throw new Error('down'); }), null);
});
