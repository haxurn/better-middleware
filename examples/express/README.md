# Better Middleware - Express.js Example

This example demonstrates how to integrate Better Auth middleware with an Express.js application.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A running Better Auth server (typically on `http://localhost:3000`)

### Installation

```bash
# From the express example directory
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

The server will start on `http://localhost:3001`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in this directory:

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Server port (optional)
PORT=3001

# Environment
NODE_ENV=development
```

### Better Auth Setup

Make sure your Better Auth server is running and configured. Example configuration:

```typescript
// In your Better Auth server
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  database: {
    // your database config
  },
  // ... other config
});
```

## 📚 API Endpoints

### Public Routes (No Authentication)

- `GET /` - Welcome message with endpoint list
- `GET /health` - Health check endpoint

### Protected Routes (Authentication Required)

- `GET /profile` - Get current user profile
- `GET /dashboard` - User dashboard
- `POST /api/data` - Submit data (with body)

### Admin Routes (Admin Role Required)

- `GET /admin/users` - Admin-only user management

## 🧪 Testing the Middleware

### 1. Test Without Authentication

```bash
curl http://localhost:3001/profile
# Should return 401 Unauthorized
```

### 2. Test With Valid Session

First, authenticate with your Better Auth server to get a session cookie, then:

```bash
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3001/profile
# Should return user profile
```

### 3. Test POST Endpoint

```bash
curl -X POST \
     -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from authenticated user"}' \
     http://localhost:3001/api/data
```

## 🔑 Features Demonstrated

- ✅ Basic authentication middleware setup
- ✅ Session caching for performance
- ✅ Custom error handling
- ✅ Role-based access control
- ✅ TypeScript integration with Express
- ✅ Public and protected routes
- ✅ Request context injection (user, session)

## 📝 Code Structure

```
src/
├── index.ts          # Main server file with middleware setup
├── types/            # TypeScript type definitions (if needed)
└── middleware/       # Custom middleware (if any)
```

## 🚨 Common Issues

### 1. Authentication Fails

- Ensure Better Auth server is running
- Check `BETTER_AUTH_URL` environment variable
- Verify session cookies are being sent correctly

### 2. CORS Issues

- The example includes CORS middleware
- Configure CORS origins for production use

### 3. TypeScript Errors

- Ensure all dependencies are installed
- Run `npm run type-check` to verify TypeScript setup

## 🔗 Related Examples

- [Fastify Example](../fastify/) - Fastify.js integration
- [Hono Example](../hono/) - Hono framework integration
- [Next.js Example](../nextjs/) - Next.js API routes integration
- [Koa Example](../koa/) - Koa.js integration

## 📖 Learn More

- [Better Middleware Documentation](../../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Express.js Documentation](https://expressjs.com)