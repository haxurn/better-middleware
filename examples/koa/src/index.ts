import cors from "@koa/cors";
import Router from "@koa/router";
import { createAuthMiddleware } from "better-middleware";
import type { Context, Next } from "koa";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

// Extend Koa Context to include user and session
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

const app = new Koa();
const router = new Router();
const PORT = Number(process.env.PORT) || 3005;

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);

app.use(bodyParser());

// Error handling middleware
app.use(async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    console.error("Server error:", err);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      }),
    };
  }
});

// Create Better Auth middleware
const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Enable caching for better performance
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000,
  },

  // Custom error handler
  onError: async (error, ctx) => {
    console.error("Authentication error:", error);
    return {
      status: 401,
      body: {
        success: false,
        message: "Authentication required",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  },

  // Koa-specific adapter
  framework: {
    getHeaders: (ctx: Context) => ctx.headers as Record<string, string>,
    getCookies: (ctx: Context) => {
      // Parse cookies from header since Koa doesn't have built-in cookie parsing
      const cookieHeader = ctx.headers.cookie;
      if (!cookieHeader) return {};

      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      });
      return cookies;
    },
    setContext: (ctx: Context, key: "user" | "session", value: any) => {
      (ctx as any)[key] = value;
    },
    createResponse: (ctx: Context, body: unknown, status: number) => ({
      status,
      body,
    }),
  },
});

// Convert middleware to Koa middleware
const createKoaAuthMiddleware = () => {
  return async (ctx: Context, next: Next) => {
    const result = await authMiddleware(ctx, ctx, async () => {
      // Continue to next middleware/handler
      await next();
    });

    if (result) {
      ctx.status = result.status;
      ctx.body = result.body;
      return;
    }
  };
};

// Public routes
router.get("/", (ctx: Context) => {
  ctx.body = {
    message: "Welcome to Better Middleware Koa Example!",
    framework: "Koa.js",
    endpoints: {
      public: ["GET /", "GET /health"],
      protected: ["GET /profile", "GET /dashboard", "POST /api/data"],
    },
  };
});

router.get("/health", (ctx: Context) => {
  ctx.body = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    framework: "Koa.js",
  };
});

// Protected routes
router.get(
  "/profile",
  createKoaAuthMiddleware(),
  (ctx: AuthenticatedContext) => {
    ctx.body = {
      message: "User profile retrieved successfully",
      user: ctx.user,
      session: {
        id: ctx.session?.id,
        expiresAt: ctx.session?.expiresAt,
      },
      framework: "Koa.js",
    };
  },
);

router.get(
  "/dashboard",
  createKoaAuthMiddleware(),
  (ctx: AuthenticatedContext) => {
    ctx.body = {
      message: `Welcome to your dashboard, ${ctx.user?.name || ctx.user?.email}!`,
      userId: ctx.user?.id,
      sessionId: ctx.session?.id,
      framework: "Koa.js",
    };
  },
);

router.post(
  "/api/data",
  createKoaAuthMiddleware(),
  (ctx: AuthenticatedContext) => {
    ctx.body = {
      message: "Data endpoint accessed successfully",
      requestedBy: ctx.user?.email,
      timestamp: new Date().toISOString(),
      receivedData: ctx.request.body,
      framework: "Koa.js",
    };
  },
);

// Role-based middleware
const requireRole = (roles: string[]) => {
  return async (ctx: AuthenticatedContext, next: Next) => {
    const userRoles = (ctx.user as any)?.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: "Insufficient permissions",
        required: roles,
        userRoles,
      };
      return;
    }

    await next();
  };
};

router.get(
  "/admin/users",
  createKoaAuthMiddleware(),
  requireRole(["admin"]),
  (ctx: AuthenticatedContext) => {
    ctx.body = {
      message: "Admin endpoint accessed",
      adminUser: ctx.user?.email,
      users: [
        { id: "1", email: "user1@example.com", role: "user" },
        { id: "2", email: "admin@example.com", role: "admin" },
        { id: "3", email: "moderator@example.com", role: "moderator" },
      ],
      framework: "Koa.js",
    };
  },
);

// Multiple middleware example with validation
router.get(
  "/api/secure-data",
  createKoaAuthMiddleware(),
  async (ctx: Context, next: Next) => {
    // Custom validation middleware
    const userAgent = ctx.headers["user-agent"];
    if (!userAgent) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "User agent required",
      };
      return;
    }
    await next();
  },
  (ctx: AuthenticatedContext) => {
    ctx.body = {
      message: "Secure data accessed with validation",
      user: ctx.user?.email,
      userAgent: ctx.headers["user-agent"],
      timestamp: new Date().toISOString(),
      framework: "Koa.js",
    };
  },
);

// Request logging middleware
app.use(async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Register routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Koa server running on http://localhost:${PORT}`);
  console.log(
    `📚 Better Auth URL: ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}`,
  );
  console.log("\n📋 Available endpoints:");
  console.log("  Public:");
  console.log("    GET  /");
  console.log("    GET  /health");
  console.log("  Protected:");
  console.log("    GET  /profile");
  console.log("    GET  /dashboard");
  console.log("    POST /api/data");
  console.log("    GET  /admin/users (admin only)");
  console.log("    GET  /api/secure-data (with validation)");
});
