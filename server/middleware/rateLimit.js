const { rateLimit } = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const createLimiter = (options) => rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
    ...options,
});

const loginLimiter = createLimiter({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
});

const registerLimiter = createLimiter({
    windowMs: ONE_HOUR,
    limit: 20,
});

const writeLimiter = createLimiter({
    windowMs: FIFTEEN_MINUTES,
    limit: 100,
    skip: (req) => req.method === 'GET' || req.method === 'HEAD',
});

module.exports = { loginLimiter, registerLimiter, writeLimiter };
