import dns from 'node:dns';
import net from 'node:net';

const blocked = new net.BlockList();

const IPV4_RANGES: [string, number][] = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4]
];
// 64:ff9b::/96 (NAT64) and 2002::/16 (6to4) embed IPv4 addresses, so they can reach private hosts.
const IPV6_RANGES: [string, number][] = [
    ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
    ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]
];
IPV4_RANGES.forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv4'));
IPV6_RANGES.forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv6'));

export class EgressBlockedError extends Error {
    readonly code = 'EGRESS_BLOCKED';

    constructor(target: string) {
        super(`Blocked non-public address: ${target}`);
    }
}

/** IPv4-mapped IPv6 addresses (::ffff:a.b.c.d) are checked against the IPv4 ranges by BlockList. */
export function isPublicAddress(ip: string): boolean {
    const bare = ip.split('%')[0];
    const family = net.isIP(bare);
    return family !== 0 && !blocked.check(bare, family === 6 ? 'ipv6' : 'ipv4');
}

/** Hostnames are not resolved here; safeLookup checks them at connect time. */
export function assertPublicHost(hostname: string): void {
    const host = hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && !isPublicAddress(host)) {
        throw new EgressBlockedError(host);
    }
}

export function assertPublicUrl(raw: string | URL): URL {
    const url = typeof raw === 'string' ? new URL(raw) : raw;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new EgressBlockedError(url.protocol);
    }
    assertPublicHost(url.hostname);
    return url;
}

export function isAllowedUrl(raw: string): boolean {
    try {
        assertPublicUrl(raw);
        return true;
    } catch {
        return false;
    }
}

/**
 * DNS lookup that rejects any name resolving to a non-public address. Validating at connect time
 * (not before the request) closes DNS rebinding, and also covers redirects to hostnames.
 */
export const safeLookup: net.LookupFunction = (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, '', 0);
        if (addresses.some((a) => !isPublicAddress(a.address))) {
            return callback(new EgressBlockedError(hostname), '', 0);
        }
        if (options.all) return callback(null, addresses);
        callback(null, addresses[0].address, addresses[0].family);
    });
};
