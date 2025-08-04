# Better Middleware

[![npm version](https://badge.fury.io/js/better-middleware.svg)](https://badge.fury.io/js/better-middleware)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A **framework-agnostic** authentication middleware for [Better Auth](https://better-auth.com) that provides robust session validation, intelligent caching, and comprehensive error handling for your backend routes.

## ✨ Features

- 🚀 **Framework Agnostic** - Works with Express, Fastify, Hono, Koa, and any Node.js framework
- 🔐 **Session Validation** - Automatic Better Auth session verification
- ⚡ **Intelligent Caching** - LRU cache with configurable TTL for optimal performance
- 🛡️ **Security First** - Token masking, secure session handling, and comprehensive error management
- 📝 **Structured Logging** - Built-in logging with customizable levels and output
- 🎯 **TypeScript Native** - Full type safety and IntelliSense support
- 🔧 **Highly Configurable** - Extensive customization options for any use case
- 🎨 **Modern API** - Clean, intuitive API design with async/await support
- 🧪 **Battle Tested** - 100% test coverage with 113+ comprehensive tests

## 📦 Installation

```bash
npm install better-middleware better-auth
# or
pnpm add better-middleware better-auth
# or
yarn add better-middleware better-auth
```

## 🎯 **Framework Examples**

Ready-to-run examples for popular frameworks:

- **[Express.js](./examples/express/)** - Traditional middleware pattern with global extensions
- **[Fastify](./examples/fastify/)** - High-performance preHandlers with schema validation  
- **[Hono](./examples/hono/)** - Modern edge-ready framework with context injection
- **[Next.js](./examples/nextjs/)** - API routes with higher-order functions and interactive UI
- **[Koa.js](./examples/koa/)** - Elegant async middleware with context-based state

Each example includes:
- Complete TypeScript setup
- Authentication flow implementation  
- Role-based access control
- Interactive testing capabilities
- Comprehensive documentation

👉 **[Browse All Examples →](./examples/)**

## 🚀 Quick Start

### Basic Usage

```typescript
import { createAuthMiddleware } from 'better-middleware';
import type { Request, Response, NextFunction } from 'express';

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  framework: {
    getHeaders: (req: Request) => req.headers as Record<string, string>,
    getCookies: (req: Request) => req.cookies,
    setContext: (req: Request, key: string, value: any) => {
      req[key] = value;
    },
    createResponse: (req: Request, body: any, status: number) => ({
      status,
      body
    })
  }
});

// Use in your routes
app.get('/protected', authMiddleware, (req: Request, res: Response) => {
  // Access authenticated user
  console.log(req.user); // Better Auth user object
  console.log(req.session); // Better Auth session object
  
  res.json({ message: 'Hello authenticated user!', user: req.user });
});
```

## 🔧 Configuration

### AuthMiddlewareOptions

```typescript
interface AuthMiddlewareOptions<TContext> {
  // Better Auth server URL
  baseURL: string;
  
  // Additional fetch options for Better Auth client
  fetchOptions?: RequestInit;
  
  // Caching configuration
  cache?: {
    enabled: boolean;
    ttl?: number;     // Time to live in seconds (default: 300)
    max?: number;     // Maximum cache entries (default: 1000)
  };
  
  // Custom error handler
  onError?: (error: unknown, ctx: TContext) => AuthResponse | Promise<AuthResponse>;
  
  // Custom logger
  logger?: {
    info: (message: string, data?: Record<string, unknown>) => void;
    error: (message: string, data?: Record<string, unknown>) => void;
    debug: (message: string, data?: Record<string, unknown>) => void;
  };
  
  // Framework adapter
  framework: {
    getHeaders: (req: FrameworkRequest) => Record<string, string>;
    getCookies: (req: FrameworkRequest) => Record<string, string>;
    setContext: (ctx: TContext, key: "user" | "session", value: any) => void;
    createResponse: (ctx: TContext, body: unknown, status: number) => AuthResponse;
  };
}
```

## 🌐 Framework Examples

### Express.js

```typescript
import express from 'express';
import { createAuthMiddleware } from 'better-middleware';

const app = express();

const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000
  },
  framework: {
    getHeaders: (req) => req.headers as Record<string, string>,
    getCookies: (req) => req.cookies || {},
    setContext: (req, key, value) => { req[key] = value; },
    createResponse: (req, body, status) => ({ status, body })
  }
});

app.use('/api/protected', authMiddleware);
```

### Fastify

```typescript
import Fastify from 'fastify';
import { createAuthMiddleware } from 'better-middleware';

const fastify = Fastify();

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  framework: {
    getHeaders: (request) => request.headers as Record<string, string>,
    getCookies: (request) => request.cookies || {},
    setContext: (request, key, value) => { request[key] = value; },
    createResponse: (request, body, status) => ({ status, body })
  }
});

fastify.addHook('preHandler', authMiddleware);
```

### Hono

```typescript
import { Hono } from 'hono';
import { createAuthMiddleware } from 'better-middleware';

const app = new Hono();

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  framework: {
    getHeaders: (c) => Object.fromEntries(c.req.raw.headers.entries()),
    getCookies: (c) => c.req.cookie() || {},
    setContext: (c, key, value) => c.set(key, value),
    createResponse: (c, body, status) => c.json(body, status)
  }
});

app.use('/protected/*', authMiddleware);
```

### Next.js API Routes

```typescript
import { createAuthMiddleware } from 'better-middleware';
import type { NextApiRequest, NextApiResponse } from 'next';

const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL!,
  framework: {
    getHeaders: (req) => req.headers as Record<string, string>,
    getCookies: (req) => req.cookies || {},
    setContext: (req, key, value) => { req[key] = value; },
    createResponse: (req, body, status) => ({ status, body })
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await authMiddleware(req, req, async () => {});
  if (authResult) {
    return res.status(authResult.status).json(authResult.body);
  }
  
  // Your protected route logic here
  res.json({ user: req.user, session: req.session });
}
```

## 🗄️ Caching

The middleware includes intelligent session caching to reduce database queries and improve performance:

```typescript
const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  cache: {
    enabled: true,
    ttl: 600,    // 10 minutes
    max: 5000,   // 5000 entries
  },
  // ... other options
});
```

### Cache Features

- **LRU (Least Recently Used)** eviction policy
- **Automatic TTL** expiration
- **Session token extraction** from multiple cookie formats
- **Cache hit/miss logging** for monitoring
- **Memory efficient** with configurable limits

## 🚨 Error Handling

### Default Error Handling

The middleware provides comprehensive error handling out of the box:

```typescript
// Automatic error responses for common scenarios
{
  "success": false,
  "message": "Invalid or missing session",
  "code": "UNAUTHORIZED"
}
```

### Custom Error Handler

```typescript
const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  onError: async (error, ctx) => {
    // Log error
    console.error('Auth error:', error);
    
    // Custom error response
    if (error.code === 'SESSION_EXPIRED') {
      return {
        status: 401,
        body: {
          error: 'Session expired',
          redirect: '/login'
        }
      };
    }
    
    return {
      status: 401,
      body: { error: 'Authentication failed' }
    };
  },
  // ... other options
});
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | No valid session found |
| `SESSION_EXPIRED` | Session has expired |
| `INVALID_SESSION` | Session format is invalid |
| `INVALID_CREDENTIALS` | Authentication credentials are invalid |

## 📝 Logging

### Built-in Logging

```typescript
const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  // Uses built-in structured logging
  framework: { /* ... */ }
});
```

### Custom Logger

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'auth.log' })
  ]
});

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  logger: {
    info: (msg, data) => logger.info(msg, data),
    error: (msg, data) => logger.error(msg, data),
    debug: (msg, data) => logger.debug(msg, data),
  },
  framework: { /* ... */ }
});
```

## 📚 API Reference

### Types

```typescript
// Re-exported from better-middleware
import type {
  AuthContext,
  AuthMiddlewareOptions,
  AuthResponse,
  BetterAuthUser,
  BetterAuthSession,
  BetterAuthError,
  CacheOptions,
  FrameworkContext,
  FrameworkRequest,
} from 'better-middleware';
```

### Utilities

```typescript
// Re-exported utilities
import {
  SessionCache,
  createErrorResponse,
  createLogger
} from 'better-middleware';

// SessionCache methods
const cache = new SessionCache(1000, 300);
cache.get(key);           // Get cached session
cache.set(key, value);    // Cache session
cache.has(key);           // Check if key exists
cache.delete(key);        // Remove from cache
cache.clear();            // Clear all entries
cache.size();             // Get cache size

// Static method for session token extraction
SessionCache.extractSessionToken(cookieString);
```

## 🔍 Advanced Usage

### Multiple Authentication Strategies

```typescript
const publicRoutes = ['/health', '/docs'];
const adminRoutes = ['/admin'];

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  onError: async (error, ctx) => {
    // Different handling for different route types
    if (ctx.path?.startsWith('/admin')) {
      return { status: 403, body: { error: 'Admin access required' } };
    }
    return { status: 401, body: { error: 'Authentication required' } };
  },
  framework: { /* ... */ }
});
```

### Session Validation with Roles

```typescript
function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await authMiddleware(req, req, async () => {});
    
    const userRoles = req.user?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

app.get('/admin/users', requireRole(['admin']), (req, res) => {
  // Admin only route
});
```

## 🧪 Testing

This project includes a comprehensive test suite built with **Vitest** that ensures reliability and maintainability.

### 📊 **Exceptional Test Coverage**
- **100% Statement Coverage** - Every line of code is tested
- **98.75% Branch Coverage** - Nearly all code paths covered  
- **100% Function Coverage** - Every function is tested
- **100% Line Coverage** - Complete line-by-line testing
- **113 Total Tests** across 7 test files

### 🚀 **Test Commands**
```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### 🧪 **Testing Your Integration**

```typescript
import { createAuthMiddleware } from 'better-middleware';
import { describe, it, expect, vi } from 'vitest';

// Mock framework adapter for testing
const mockFramework = {
  getHeaders: vi.fn(),
  getCookies: vi.fn(),
  setContext: vi.fn(),
  createResponse: vi.fn(),
};

const authMiddleware = createAuthMiddleware({
  baseURL: 'http://localhost:3000',
  framework: mockFramework
});

// Test your middleware
describe('Auth Middleware', () => {
  it('should authenticate valid sessions', async () => {
    mockFramework.getHeaders.mockReturnValue({
      cookie: 'better-auth.session_token=valid_token'
    });
    
    const result = await authMiddleware(mockReq, mockReq, vi.fn());
    expect(result).toBeUndefined(); // Success case
    expect(mockFramework.setContext).toHaveBeenCalled();
  });
});
```

### 🎯 **Test Categories**

- **Core Middleware Tests** (26 tests) - Main functionality, authentication flows, error handling
- **SessionCache Tests** (20 tests) - LRU cache operations, TTL behavior, token extraction
- **Error Handling Tests** (12 tests) - Error utilities, response creation, localization
- **Logger Tests** (21 tests) - Logging functionality, levels, formatting
- **Type Definition Tests** (20 tests) - TypeScript type correctness and flexibility
- **Export Tests** (14 tests) - Public API surface and compatibility

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Better Auth**: >= 1.3.4
- **TypeScript**: >= 5.0.0 (for TypeScript projects)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/haxurn/better-middleware.git
cd better-middleware

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting and formatting
pnpm lint
pnpm format

# Run type checking
pnpm check

# Build the project
pnpm build

# Test framework examples
cd examples/express && npm run dev  # Test Express example
cd examples/nextjs && npm run dev   # Test Next.js example
```

### 🎨 **Code Quality Standards**

This project maintains high code quality standards with:

- **Biome** for linting and formatting
- **TypeScript** for type safety
- **Vitest** for comprehensive testing
- **100% test coverage** requirement
- **Consistent code formatting** across all files
- **Comprehensive type definitions** for all exports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Better Auth](https://better-auth.com) - The authentication library this middleware is built for
- [LRU Cache](https://github.com/isaacs/node-lru-cache) - Efficient caching implementation
- All contributors who have helped improve this project

## 📞 Support

- 📚 [Documentation](https://github.com/haxurn/better-middleware)
- 🐛 [Issue Tracker](https://github.com/haxurn/better-middleware/issues)
- 💬 [Discussions](https://github.com/haxurn/better-middleware/discussions)

---

Made with ❤️ by [haxurn](https://github.com/haxurn)