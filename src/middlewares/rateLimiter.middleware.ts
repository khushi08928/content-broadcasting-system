import rateLimit from "express-rate-limit";

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter: any = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: "Too many requests, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter - 20 requests per 15 minutes (stricter for login/signup)
export const authLimiter: any = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: "Too many authentication attempts, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public broadcasting rate limiter - 60 requests per minute
export const broadcastLimiter: any = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: {
        error: "Too many requests, please try again after 1 minute"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
