# Better Middleware - Koa.js Example

This example demonstrates how to integrate Better Auth middleware with a Koa.js application using async middleware patterns and context-based state management.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A running Better Auth server (typically on `http://localhost:3000`)

### Installation

```bash
# From the koa example directory
npm install

# Or if using pnpm from the root
pnpm install
```

### Running the Example

```bash
# Development mode with hot reload
npm run dev

# Build and run production
npm run build
npm start
```

The server will start on `http://localhost:3005`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in this directory:

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Server port (optional)
PORT=3005

# Environment
NODE_ENV=development
```

## 📚 API Endpoints

### Public Routes (No Authentication)

- `GET /` - Welcome message with endpoint list
- `GET /health` - Health check with uptime

### Protected Routes (Authentication Required)

- `GET /profile` - Get current user profile
- `GET /dashboard` - User dashboard
- `POST /api/data` - Submit JSON data
- `GET /api/secure-data` - Multi-middleware protected endpoint

### Admin Routes (Admin Role Required)

- `GET /admin/users` - Admin-only user management

## 🎯 Koa.js-Specific Features

### Context-Based State

Koa's context object is extended to include authentication data:

```typescript
interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    email: string;
    name?: string;
    [key: string]: unknown;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: string;
    [key: string]: unknown;
  };
}
```

### Middleware Composition

Koa's elegant middleware composition with async/await:

```typescript
const createKoaAuthMiddleware = () => {
  return async (ctx: Context, next: Next) => {
    const result = await authMiddleware(ctx, ctx, async () => {
      await next(); // Continue to next middleware
    });
    
    if (result) {
      ctx.status = result.status;
      ctx.body = result.body;
      return;
    }
  };
};
```

### Cookie Parsing

Custom cookie parsing implementation for Koa:

```typescript
getCookies: (ctx: Context) => {
  const cookieHeader = ctx.headers.cookie;
  if (!cookieHeader) return {};
  
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
}
```

### Multiple Middleware Layers

Demonstrating Koa's middleware layering:

```typescript
router.get('/api/secure-data',
  createKoaAuthMiddleware(),        // Authentication layer
  async (ctx, next) => {            // Validation layer
    const userAgent = ctx.headers['user-agent'];
    if (!userAgent) {
      ctx.status = 400;
      ctx.body = { error: 'User agent required' };
      return;
    }
    await next();
  },
  (ctx: AuthenticatedContext) => {  // Business logic layer
    ctx.body = { /* response data */ };
  }
);
```

### Error Handling

Global error handling middleware:

```typescript
app.use(async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    console.error('Server error:', err);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Internal server error',
      // Development error details
    };
  }
});
```

## 🧪 Testing the Middleware

### 1. Test Without Authentication

```bash
curl http://localhost:3005/profile
# Should return 401 Unauthorized
```

### 2. Test With Valid Session

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3005/profile
# Should return user profile
```

### 3. Test Multi-Layer Middleware

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "User-Agent: curl/7.68.0" \
     http://localhost:3005/api/secure-data
# Should return secure data with validation
```

### 4. Test JSON POST with Body Parser

```bash
curl -X POST \
     -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from Koa!", "nested": {"data": [1, 2, 3]}}' \
     http://localhost:3005/api/data
```

## 🔑 Features Demonstrated

- ✅ Koa.js middleware integration
- ✅ Context-based state management
- ✅ Custom cookie parsing
- ✅ Multiple middleware composition
- ✅ Role-based access control
- ✅ Request/response body parsing
- ✅ Global error handling
- ✅ Request logging middleware
- ✅ TypeScript with Koa types
- ✅ Router-based routing

## 🌟 Koa.js Advantages

- **Minimal**: Lightweight core with modular ecosystem
- **Elegant**: Clean async/await middleware pattern
- **Flexible**: Context-based state management
- **Modern**: Built for ES2017+ async functions
- **Composable**: Middleware layers stack naturally

## 📁 Project Structure

```
src/
├── index.ts          # Main Koa server with middleware setup
├── middleware/       # Custom middleware (for larger apps)
├── routes/           # Route modules (for modular apps)
└── types/            # TypeScript type definitions
```

## 🚨 Common Issues

### 1. Context Type Errors

- Use `AuthenticatedContext` for protected routes
- Ensure context extensions are properly typed
- Check that middleware runs before accessing `ctx.user`

### 2. Middleware Order

- Authentication must come before business logic
- Error handling should be registered first
- Body parser should come before routes that need request body

### 3. Cookie Parsing

- Verify cookie format in requests
- Check URL decoding of cookie values
- Ensure cookie names match Better Auth configuration

### 4. Async/Await Issues

- Always use `await next()` in middleware
- Handle promise rejections properly
- Use try/catch blocks for error handling

## 🔄 Middleware Flow

Koa's middleware flows in an "onion" pattern:

```
Request →  Error Handler
       →  CORS
       →  Body Parser  
       →  Request Logger (start)
       →  Auth Middleware
       →  Route Handler
       ←  Request Logger (end)
       ←  Response
```

## 🔗 Related Examples

- [Express Example](../express/) - Express.js integration
- [Fastify Example](../fastify/) - Fastify integration
- [Hono Example](../hono/) - Hono framework integration
- [Next.js Example](../nextjs/) - Next.js API routes integration

## 📖 Learn More

- [Better Middleware Documentation](../../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Koa.js Documentation](https://koajs.com/)
- [Koa Router Documentation](https://github.com/koajs/router)