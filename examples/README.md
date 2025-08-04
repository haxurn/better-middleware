# Better Middleware - Framework Examples

This directory contains comprehensive examples demonstrating how to integrate Better Auth middleware with popular Node.js frameworks. Each example is a complete, working application that showcases framework-specific patterns and best practices.

## 🌐 Available Examples

### [Express.js](./express/) - Port 3001
Traditional Node.js web framework with comprehensive middleware ecosystem.

**Features:**
- Classic middleware pattern
- Global type extensions
- Role-based access control
- Error handling middleware
- CORS configuration

**Key Files:**
- `src/index.ts` - Main server with middleware setup
- `package.json` - Express and middleware dependencies

### [Fastify](./fastify/) - Port 3002
High-performance web framework with built-in TypeScript support.

**Features:**
- PreHandler middleware integration
- JSON Schema validation
- Pino logger integration
- Cookie handling
- Plugin architecture

**Key Files:**
- `src/index.ts` - Fastify server with preHandlers
- TypeScript-first development

### [Hono](./hono/) - Port 3003
Modern, lightweight framework optimized for edge computing.

**Features:**
- Context-based dependency injection
- Multiple middleware composition
- Custom cookie parsing
- Web Standards APIs
- Edge runtime compatibility

**Key Files:**
- `src/index.ts` - Hono app with context integration
- Lightweight and fast

### [Next.js](./nextjs/) - Port 3004
Full-stack React framework with API routes.

**Features:**
- Higher-order function pattern
- Interactive web interface
- Method validation
- Type-safe API routes
- Server-side rendering ready

**Key Files:**
- `pages/api/` - API route handlers
- `lib/auth-middleware.ts` - Middleware wrapper utilities
- `pages/index.tsx` - Interactive test interface

### [Koa.js](./koa/) - Port 3005
Minimalist framework with elegant async middleware.

**Features:**
- Context-based state management
- Onion-model middleware
- Custom cookie parsing
- Error boundary handling
- Modular router system

**Key Files:**
- `src/index.ts` - Koa app with async middleware
- Clean middleware composition

## 🚀 Quick Start

### Prerequisites

1. **Better Auth Server**: All examples require a running Better Auth server (typically on `http://localhost:3000`)
2. **Node.js**: Version 18.0.0 or higher
3. **Package Manager**: npm, pnpm, or yarn

### Running Examples

#### Option 1: Individual Examples

```bash
# Navigate to any example directory
cd express  # or fastify, hono, nextjs, koa

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Option 2: From Root (with pnpm workspaces)

```bash
# From the project root
pnpm install

# Run specific example
pnpm --filter better-middleware-express-example dev
pnpm --filter better-middleware-fastify-example dev
pnpm --filter better-middleware-hono-example dev
pnpm --filter better-middleware-nextjs-example dev
pnpm --filter better-middleware-koa-example dev
```

## 📋 Common Setup

### Environment Variables

Each example needs these environment variables (create `.env` or `.env.local`):

```env
# Better Auth server URL
BETTER_AUTH_URL=http://localhost:3000

# Server port (optional, each has defaults)
PORT=3001  # or 3002, 3003, 3004, 3005

# Environment
NODE_ENV=development
```

### Better Auth Configuration

Ensure your Better Auth server allows requests from the example applications:

```typescript
// In your Better Auth server
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  cors: {
    origin: [
      "http://localhost:3001", // Express
      "http://localhost:3002", // Fastify
      "http://localhost:3003", // Hono
      "http://localhost:3004", // Next.js
      "http://localhost:3005", // Koa
    ],
    credentials: true
  },
  // ... other config
});
```

## 🧪 Testing All Examples

### 1. Start Better Auth Server

```bash
# Start your Better Auth server on port 3000
npm run dev  # or however you start your auth server
```

### 2. Authenticate

Visit your Better Auth application and log in to get a session cookie.

### 3. Test Endpoints

Each example exposes similar endpoints on different ports:

```bash
# Health checks (public)
curl http://localhost:3001/health  # Express
curl http://localhost:3002/health  # Fastify
curl http://localhost:3003/health  # Hono
curl http://localhost:3004/api/health  # Next.js
curl http://localhost:3005/health  # Koa

# Protected endpoints (with session cookie)
curl -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
     http://localhost:3001/profile

# Test all frameworks at once
for port in 3001 3002 3003 3005; do
  echo "Testing port $port:"
  curl -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
       http://localhost:$port/profile
done
```

## 📊 Framework Comparison

| Framework | Port | Middleware Pattern | Key Strengths |
|-----------|------|-------------------|---------------|
| **Express** | 3001 | Traditional middleware | Mature ecosystem, familiar |
| **Fastify** | 3002 | PreHandlers | High performance, schema validation |
| **Hono** | 3003 | Context-based | Edge-ready, lightweight |
| **Next.js** | 3004 | Higher-order functions | Full-stack, React integration |
| **Koa** | 3005 | Async onion model | Clean, modern middleware |

## 🔑 Common Features

All examples demonstrate:

- ✅ **Authentication** - Session validation with Better Auth
- ✅ **Caching** - LRU cache for performance optimization
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Role-Based Access** - Admin-only endpoints
- ✅ **TypeScript** - Full type safety
- ✅ **CORS** - Cross-origin request handling
- ✅ **Logging** - Request/response logging
- ✅ **Validation** - Input validation where applicable

## 🎯 Framework-Specific Features

### Express
- Global middleware stack
- Request/response extensions
- Traditional error handling

### Fastify
- Schema validation
- Plugin architecture
- Built-in logging

### Hono
- Edge runtime support
- Web Standards APIs
- Ultra-lightweight

### Next.js
- Server-side rendering
- Interactive test interface
- API route patterns

### Koa
- Context-based state
- Onion middleware model
- Minimal core

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**: Each example uses a different port by default
2. **CORS Errors**: Ensure Better Auth server allows the example origins
3. **Cookie Issues**: Verify session cookies are being sent correctly
4. **TypeScript Errors**: Check that all dependencies are installed

### Debug Tips

```bash
# Check if ports are available
netstat -an | grep :3001

# Test Better Auth server
curl http://localhost:3000/api/health

# Verify middleware configuration
NODE_ENV=development npm run dev
```

## 📁 Project Structure

```
examples/
├── README.md                    # This file
├── express/                     # Express.js example
│   ├── src/index.ts
│   ├── package.json
│   └── README.md
├── fastify/                     # Fastify example
│   ├── src/index.ts
│   ├── package.json
│   └── README.md
├── hono/                        # Hono example
│   ├── src/index.ts
│   ├── package.json
│   └── README.md
├── nextjs/                      # Next.js example
│   ├── pages/
│   ├── lib/auth-middleware.ts
│   ├── package.json
│   └── README.md
└── koa/                         # Koa.js example
    ├── src/index.ts
    ├── package.json
    └── README.md
```

## 🔗 Learn More

- [Better Middleware Documentation](../README.md)
- [Better Auth Documentation](https://better-auth.com)
- [Framework Documentation Links in Individual READMEs]

## 🤝 Contributing

Found an issue or want to add another framework example?

1. Fork the repository
2. Create your example following the existing patterns
3. Add comprehensive documentation
4. Test with Better Auth integration
5. Submit a pull request

### Guidelines for New Examples

- Use TypeScript for type safety
- Include comprehensive error handling
- Demonstrate role-based access control
- Provide interactive testing capabilities
- Follow framework-specific best practices
- Include detailed README with setup instructions