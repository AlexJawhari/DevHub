import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import { assertPublicUrl, isPublicAddress, safeLookup } from './egressGuard';
import { safeHttp } from './safeHttp';

test('isPublicAddress allows public and blocks private, loopback, link-local and mapped addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
        assert.equal(isPublicAddress(ip), true, ip);
    }
    for (const ip of [
        '127.0.0.1', '127.1.2.3', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
        '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', '::ffff:127.0.0.1', '::ffff:7f00:1',
        'fc00::1', 'fe80::1', 'fe80::1%eth0', '64:ff9b::7f00:1', 'not-an-ip'
    ]) {
        assert.equal(isPublicAddress(ip), false, ip);
    }
});

test('assertPublicUrl rejects bad schemes and non-public IP literals in any notation', () => {
    for (const url of [
        'ftp://example.com', 'file:///etc/passwd', 'http://127.0.0.1', 'http://2130706433',
        'http://0x7f.1', 'http://[::1]/', 'http://[::ffff:169.254.169.254]/', 'http://172.20.0.5:8080'
    ]) {
        assert.throws(() => assertPublicUrl(url), { code: 'EGRESS_BLOCKED' }, url);
    }
    assert.doesNotThrow(() => assertPublicUrl('https://example.com/path?q=1'));
});

test('safeLookup rejects names that resolve to loopback', async () => {
    await assert.rejects(
        new Promise((resolve, reject) => {
            safeLookup('localhost', {}, (err, address) => (err ? reject(err) : resolve(address)));
        }),
        { code: 'EGRESS_BLOCKED' }
    );
});

test('safeHttp never reaches a local server', async () => {
    let hits = 0;
    const server = http.createServer((_req, res) => { hits++; res.end('ok'); });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    try {
        await assert.rejects(safeHttp.get(`http://127.0.0.1:${port}/`), { code: 'EGRESS_BLOCKED' });
        await assert.rejects(safeHttp.get(`http://localhost:${port}/`), { code: 'EGRESS_BLOCKED' });
        assert.equal(hits, 0);
    } finally {
        server.close();
    }
});
