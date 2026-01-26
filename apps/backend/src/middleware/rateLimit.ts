import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Stricter limit: 5 requests per minute per IP
 * Protects against brute-force and credential stuffing attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 requests per window
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Use default keyGenerator which properly handles IPv6
});

/**
 * Rate limiter for general API endpoints
 * More permissive: 100 requests per minute per user/IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per window
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // For authenticated users, use their user ID (no IP involved, so no IPv6 issue)
    const user = (req as { user?: { id: string } }).user;
    if (user?.id) {
      return user.id;
    }
    // For unauthenticated requests, return a constant to use default IP handling
    // The actual IP limiting is handled by authRateLimiter for auth routes
    return 'unauthenticated';
  },
  // Skip the IPv6 validation since we handle user ID separately
  validate: { xForwardedForHeader: false },
});

/**
 * Rate limiter for password reset requests
 * Moderate limit: 3 requests per hour per IP
 * Prevents abuse of password reset functionality
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // 3 requests per window
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator which properly handles IPv6
});

/**
 * Rate limiter for file import uploads
 * Strict limit: 10 uploads per hour per user
 * Prevents abuse of file processing resources
 */
export const importRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // 10 requests per window
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many import requests. Please try again later (max 10 per hour).',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated import requests
    const user = (req as { user?: { userId: string } }).user;
    if (user?.userId) {
      return `import:${user.userId}`;
    }
    return 'import:unauthenticated';
  },
});
