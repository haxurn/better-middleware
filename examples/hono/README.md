# Better Middleware - Hono Example

This example demonstrates how to integrate Better Auth middleware with a Hono application, showcasing modern web framework patterns.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A running Better Auth server (typically on `http://localhost:3000`)

### Installation

```bash
# From the hono example directory
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

The server will start on `http://localhost:3003`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in this directory:

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Server port (optional)
PORT=3003

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

## 🎯 Hono-Specific Features

### Context Integration

Hono's context is used for dependency injection:

```typescript
app.get('/profile', createHonoAuthMiddleware(), (c: AuthenticatedContext) => {
  const user = c.get('user');
  const session = c.get('session');
  // Use authenticated data
});
```

### Custom Cookie Parsing

Since Hono doesn't have built-in cookie parsing, we implement it:

```typescript
getCookies: (c: Context) => {
  const cookieHeader = c.req.header('cookie');
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

### Multiple Middleware Chaining

Demonstration of middleware composition:

```typescript
app.get('/api/secure-data',
  createHonoAuthMiddleware(),        // Authentication
  async (c, next) => {               // Custom validation
    const userAgent = c.req.header('user-agent');
    if (!userAgent) {
      return c.json({ error: 'User agent required' }, 400);
    }
    await next();
  },
  (c: AuthenticatedContext) => {     // Final handler
    // Handle authenticated request
  }
);
```

### Role-Based Access Control

Flexible role-based middleware:

```typescript
const requireRole = (roles: string[]) => {
  return async (c: AuthenticatedContext, next: Next) => {
    const user = c.get('user');
    const userRoles = (user as any).roles || [];
    
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
};
```

## 🧪 Testing the Middleware

### 1. Test Without Authentication

```bash
curl http://localhost:3003/profile
# Should return 401 Unauthorized
```

### 2. Test With Valid Session

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3003/profile
# Should return user profile
```

### 3. Test Multi-Middleware Endpoint

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "User-Agent: curl/7.68.0" \
     http://localhost:3003/api/secure-data
# Should return secure data with user agent validation
```

### 4. Test JSON POST

```bash
curl -X POST \
     -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from Hono!", "data": [1, 2, 3]}' \
     http://localhost:3003/api/data
```

## 🔑 Features Demonstrated

- ✅ Hono middleware integration
- ✅ Context-based dependency injection  
- ✅ Custom cookie parsing
- ✅ Multiple middleware composition
- ✅ Role-based access control
- ✅ TypeScript with Hono types
- ✅ JSON request/response handling
- ✅ Error boundary handling
- ✅ CORS configuration
- ✅ Built-in logging

## 🌟 Hono Advantages

- **Lightweight**: Minimal footprint, perfect for edge computing
- **Type-Safe**: Excellent TypeScript support
- **Web Standards**: Built on Web APIs (Request/Response)
- **Edge Ready**: Works on Cloudflare Workers, Deno, Bun
- **Fast**: High performance with minimal overhead

## 📁 Project Structure

```
src/
├── index.ts          # Main Hono server with middleware setup
├── middleware/       # Custom middleware (for larger apps)
├── routes/           # Route handlers (for modular apps)
└── types/            # TypeScript type definitions
```

## 🚨 Common Issues

### 1. Cookie Parsing Issues

- Ensure proper cookie format in requests
- Check that cookies are URL-decoded correctly
- Verify cookie names match Better Auth configuration

### 2. Context Type Errors

- Use `AuthenticatedContext` type for protected routes
- Ensure `c.get('user')` and `c.get('session')` are called after authentication
- Check TypeScript configuration for strict mode

### 3. Middleware Order

- Authentication middleware must come before role-based middleware
- Custom validation should come after authentication
- Error handling middleware should be registered last

## 🌐 Deployment Options

Hono works great on various platforms:

- **Node.js** (this example)
- **Cloudflare Workers**
- **Deno**
- **Bun**
- **Vercel Edge Runtime**
- **Netlify Edge Functions**

## 🔗 Related Examples

- [Express Example](../express/) - Express.js integration
- [Fastify Example](../fastify/) - Fastify integration
- [Next.js Example](../nextjs/) - Next.js API routes integration
- [Koa Example](../koa/) - Koa.js integration

## 📖 Learn More

- [Better Middleware Documentation](../../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Hono Documentation](https://hono.dev/)
- [Hono Middleware](https://hono.dev/middleware/builtin/basic-auth)