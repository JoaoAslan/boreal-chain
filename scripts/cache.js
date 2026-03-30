

const CACHE_PREFIX = 'crypto_';
const CACHE_TTL = 60 * 60 * 1000;

export function createCache(key, data) {
    const entry = {
        data,
        timestamp: Date.now()
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export function getCache(key) {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;

    if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
    }

    return entry.data;
}