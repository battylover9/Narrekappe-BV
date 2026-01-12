const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, 
    maxRequests = 10, 
    keyGenerator = (req) => {
      return req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
    }
  } = options;

  return async (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit entry
    let limitEntry = rateLimitMap.get(key);
    
    if (!limitEntry) {
      limitEntry = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, limitEntry);
    }
    
    // Reset if window expired
    if (now > limitEntry.resetTime) {
      limitEntry.count = 0;
      limitEntry.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (limitEntry.count >= maxRequests) {
      const retryAfter = Math.ceil((limitEntry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', limitEntry.resetTime);
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }
    
    // Increment counter
    limitEntry.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - limitEntry.count);
    res.setHeader('X-RateLimit-Reset', limitEntry.resetTime);
    
    // Continue to next handler
    if (next) {
      return next();
    }
  };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime + 300000) { // 5 minutes after reset
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// Helper to apply rate limiting to Next.js API routes
export function withRateLimit(handler, options) {
  return async (req, res) => {
    const limiter = rateLimit(options);
    
    try {
      await new Promise((resolve, reject) => {
        limiter(req, res, (result) => {
          if (result instanceof Error) {
            reject(result);
          } else {
            resolve(result);
          }
        });
      });
      
      return await handler(req, res);
    } catch (error) {
      // Rate limit already handled, don't call handler
      return;
    }
  };
}
