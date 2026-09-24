/**
 * In-Memory Rate Limiting Middleware
 * Protects authentication and critical endpoints against brute-force and credential-stuffing attacks.
 */

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 50, message = 'Too many requests. Please try again later.' } = {}) {
    const hits = new Map();

    // Periodic sweep to clean up expired buckets
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of hits.entries()) {
            if (now - record.startTime > windowMs) {
                hits.delete(key);
            }
        }
    }, 5 * 60 * 1000);

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    return (req, res, next) => {
        // Skip rate limiting during test executions if configured
        if (process.env.SKIP_RATE_LIMIT === 'true') {
            return next();
        }

        const forwarded = req.headers['x-forwarded-for'];
        const ip = (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
        const now = Date.now();

        let record = hits.get(ip);
        if (!record || now - record.startTime > windowMs) {
            record = { count: 1, startTime: now };
            hits.set(ip, record);
            return next();
        }

        record.count += 1;

        if (record.count > max) {
            const retryAfterSec = Math.max(1, Math.ceil((record.startTime + windowMs - now) / 1000));
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json({
                success: false,
                message,
                retryAfter: retryAfterSec
            });
        }

        next();
    };
}

const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

module.exports = {
    createRateLimiter,
    authLimiter
};
