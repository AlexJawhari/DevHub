import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isLoginRejection } from './scannerRules';

test('isLoginRejection ignores pages that merely exist', () => {
    for (const s of [400, 401, 403, 422]) assert.equal(isLoginRejection(s), true, String(s));
    for (const s of [200, 301, 404, 405, 500]) assert.equal(isLoginRejection(s), false, String(s));
});
