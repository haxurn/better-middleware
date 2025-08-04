# Better Middleware - Fastify Example

This example demonstrates how to integrate Better Auth middleware with a Fastify application using preHandlers.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A running Better Auth server (typically on `http://localhost:3000`)

### Installation

```bash
# From the fastify example directory
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

The server will start on `http://localhost:3002`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in this directory:

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Server port (optional)
PORT=3002

# Cookie secret for sessions
COOKIE_SECRET=your-super-secret-key-change-in-production

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
- `POST /api/data` - Submit data (with JSON schema validation)

### Admin Routes (Admin Role Required)

- `GET /admin/users` - Admin-only user management

## 🎯 Fastify-Specific Features

### PreHandler Integration

The middleware is converted to Fastify's preHandler format:

```typescript
const createAuthPreHandler = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await authMiddleware(request, request, async () => {});
    if (result) {
      reply.status(result.status).send(result.body);
      return;
    }
  };
};

// Usage in routes
fastify.get('/profile', {
  preHandler: createAuthPreHandler()
}, async (request, reply) => {
  // Route handler
});
```

### Schema Validation

JSON schema validation is included for POST endpoints:

```typescript
fastify.post('/api/data', {
  preHandler: createAuthPreHandler(),
  schema: {
    body: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {}
      }
    }
  }
}, async (request, reply) => {
  // Validated request body
});
```

### Logging Integration

Custom logger integration with Fastify's built-in Pino logger:

```typescript
logger: {
  info: (message, data) => fastify.log.info(data, message),
  error: (message, data) => fastify.log.error(data, message),
  debug: (message, data) => fastify.log.debug(data, message)
}
```

## 🧪 Testing the Middleware

### 1. Test Without Authentication

```bash
curl http://localhost:3002/profile
# Should return 401 Unauthorized
```

### 2. Test With Valid Session

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3002/profile
# Should return user profile
```

### 3. Test POST with Schema Validation

```bash
curl -X POST \
     -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from Fastify!", "data": {"test": true}}' \
     http://localhost:3002/api/data
```

## 🔑 Features Demonstrated

- ✅ Fastify preHandler middleware integration
- ✅ JSON Schema validation
- ✅ Pino logger integration
- ✅ Cookie handling with @fastify/cookie
- ✅ CORS configuration
- ✅ Role-based access control
- ✅ Custom error handlers
- ✅ TypeScript support with Fastify types
- ✅ Performance optimized with caching

## 📁 Project Structure

```
src/
├── index.ts          # Main Fastify server with middleware setup
├── plugins/          # Fastify plugins (if any)
├── routes/           # Route modules (for larger apps)
└── types/            # TypeScript type definitions
```

## 🚨 Common Issues

### 1. ESM Module Errors

- Ensure `"type": "module"` is in package.json
- All imports should use `.js` extensions in built files
- Use `import` instead of `require`

### 2. PreHandler Not Working

- Ensure the middleware returns `undefined` on success
- Check that `reply.status().send()` is called on errors
- Verify preHandler array ordering for multiple handlers

### 3. Schema Validation Failures

- Check JSON schema syntax in route definitions
- Verify request Content-Type headers
- Enable Fastify logging to see validation errors

## 🔗 Related Examples

- [Express Example](../express/) - Express.js integration
- [Hono Example](../hono/) - Hono framework integration
- [Next.js Example](../nextjs/) - Next.js API routes integration
- [Koa Example](../koa/) - Koa.js integration

## 📖 Learn More

- [Better Middleware Documentation](../../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Fastify Documentation](https://www.fastify.io/)
- [Fastify TypeScript](https://www.fastify.io/docs/latest/Reference/TypeScript/)