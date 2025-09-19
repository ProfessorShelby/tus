import { NextRequest } from 'next/server';

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.READONLY_API_KEY;
  
  if (!expectedKey) {
    // If no API key is configured, allow access (development mode)
    return true;
  }
  
  return apiKey === expectedKey;
}

export function createUnauthorizedResponse() {
  return Response.json(
    { error: 'Invalid or missing API key' },
    { status: 401 }
  );
}

// Rate limiting using simple in-memory store
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  
  // Clean old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  
  return false;
}

export function getRealIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remote = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  if (remote) {
    return remote;
  }
  
  return 'unknown';
}
