# Better Middleware - Next.js Example

This example demonstrates how to integrate Better Auth middleware with Next.js API routes using higher-order functions and custom middleware wrappers.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- A running Better Auth server (typically on `http://localhost:3000`)

### Installation

```bash
# From the nextjs example directory
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

The application will start on `http://localhost:3004`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in this directory:

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## 📚 API Endpoints

### Public Routes (No Authentication)

- `GET /api/health` - Health check endpoint

### Protected Routes (Authentication Required)

- `GET /api/profile` - Get current user profile
- `GET /api/dashboard` - User dashboard
- `POST /api/data` - Submit JSON data

### Admin Routes (Admin Role Required)

- `GET /api/admin/users` - Admin-only user management

## 🎯 Next.js-Specific Features

### Higher-Order Function Pattern

The middleware is implemented using higher-order functions that wrap API route handlers:

```typescript
// Basic authentication wrapper
export function withAuth<T = any>(
  handler: (req: AuthenticatedNextApiRequest, res: NextApiResponse<T>) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    // Authentication logic
    const result = await authMiddleware(req, req, async () => {
      await handler(req as AuthenticatedNextApiRequest, res);
    });

    if (result) {
      return res.status(result.status).json(result.body as T);
    }
  };
}

// Usage in API routes
export default withAuth(async (req, res) => {
  // Authenticated handler logic
});
```

### Method Validation

Combined authentication and HTTP method validation:

```typescript
// Only allow GET requests with authentication
export default withAuthAndMethod('GET', async (req, res) => {
  // Handler logic
});

// Allow multiple methods
export default withAuthAndMethod(['GET', 'POST'], async (req, res) => {
  // Handler logic
});
```

### Role-Based Access Control

Simplified role-based access control:

```typescript
// Require admin role
export default withRole(['admin'], async (req, res) => {
  // Admin-only handler logic
});

// Require multiple roles (user has any of these)
export default withRole(['admin', 'moderator'], async (req, res) => {
  // Handler logic
});
```

### Type Safety

Full TypeScript support with extended request types:

```typescript
interface AuthenticatedNextApiRequest extends NextApiRequest {
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

## 🧪 Testing the Middleware

### 1. Using the Web Interface

Navigate to `http://localhost:3004` and use the interactive buttons to test each endpoint.

### 2. Using cURL

```bash
# Test public endpoint
curl http://localhost:3004/api/health

# Test protected endpoint without authentication (should fail)
curl http://localhost:3004/api/profile

# Test protected endpoint with authentication
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3004/api/profile

# Test POST endpoint
curl -X POST \
     -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from Next.js!", "data": {"test": true}}' \
     http://localhost:3004/api/data
```

### 3. Browser Testing

1. Open your Better Auth application and log in
2. Navigate to `http://localhost:3004`
3. Use the interactive buttons to test endpoints
4. Check the browser's Network tab to see requests and responses

## 🔑 Features Demonstrated

- ✅ Next.js API routes integration
- ✅ Higher-order function middleware pattern
- ✅ TypeScript support with extended types
- ✅ Method validation (GET, POST, etc.)
- ✅ Role-based access control
- ✅ Interactive web interface for testing
- ✅ Error handling and validation
- ✅ Cookie-based session management
- ✅ Development and production builds

## 📁 Project Structure

```
pages/
├── index.tsx                 # Interactive test interface
├── api/
│   ├── health.ts            # Public health check
│   ├── profile.ts           # Protected user profile
│   ├── dashboard.ts         # Protected dashboard
│   ├── data.ts              # Protected POST endpoint
│   └── admin/
│       └── users.ts         # Admin-only endpoint
lib/
└── auth-middleware.ts       # Middleware wrapper utilities
```

## 🚨 Common Issues

### 1. Cookie Issues

- Ensure cookies are being sent with `credentials: 'include'`
- Check that your Better Auth server allows credentials
- Verify cookie domain and path settings

### 2. CORS Problems

- Configure CORS in your Better Auth server
- Ensure origins include your Next.js development server
- Check that credentials are allowed in CORS settings

### 3. TypeScript Errors

- Ensure proper type imports from the middleware
- Check that `AuthenticatedNextApiRequest` is used correctly
- Verify all dependencies are installed

### 4. Role Authorization

- Ensure your Better Auth user has the required roles
- Check that roles are properly stored in the user object
- Verify role checking logic in `withRole` function

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod

# Set environment variables in Vercel dashboard
# BETTER_AUTH_URL=https://your-auth-server.com
```

### Other Platforms

- **Netlify**: Configure build command and environment variables
- **Railway**: Add environment variables and deploy
- **Heroku**: Set buildpacks and environment variables

## 🔗 Related Examples

- [Express Example](../express/) - Express.js integration
- [Fastify Example](../fastify/) - Fastify integration
- [Hono Example](../hono/) - Hono framework integration
- [Koa Example](../koa/) - Koa.js integration

## 📖 Learn More

- [Better Middleware Documentation](../../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Next.js TypeScript](https://nextjs.org/docs/basic-features/typescript)