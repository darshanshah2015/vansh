import rateLimit from 'express-rate-limit';

export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      type: 'https://vansh.app/errors/rate-limit',
      title: 'Too Many Requests',
      status: 429,
      detail: 'You have exceeded the rate limit. Please try again later.',
    },
  });
}

export const authRateLimiter = createRateLimiter(60 * 1000, 5);
export const searchRateLimiter = createRateLimiter(60 * 1000, 30);
