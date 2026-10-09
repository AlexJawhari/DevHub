import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCronAuthorized } from './cronAuth';

test('isCronAuthorized only accepts the exact configured secret', () => {
    assert.equal(isCronAuthorized('s3cret', 's3cret'), true);
    assert.equal(isCronAuthorized('s3cret!', 's3cret'), false);
    assert.equal(isCronAuthorized(undefined, 's3cret'), false);
    assert.equal(isCronAuthorized('', ''), false);
    assert.equal(isCronAuthorized('anything', undefined), false);
});
