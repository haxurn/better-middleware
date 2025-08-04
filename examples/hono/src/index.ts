import { serve } from "@hono/node-server";
import { createAuthMiddleware } from "better-middleware";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Define types for authenticated context
type AuthenticatedContext = Context & {
  get(key: "user"): {
    id: string;
    email: string;
    name?: string;
    [key: string]: unknown;
  };
  get(key: "session"): {
    id: string;
    userId: string;
    expiresAt: string;
    [key: string]: unknown;
  };
};

const app = new Hono();
const PORT = Number(process.env.PORT) || 3003;

// Basic middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);

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
  onError: async (error, c) => {
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

  // Hono-specific adapter
  framework: {
    getHeaders: (c: Context) => {
      const headers: Record<string, string> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return headers;
    },
    getCookies: (c: Context) => {
      // Parse cookies from header since Hono doesn't have built-in cookie parsing
      const cookieHeader = c.req.header("cookie");
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
    setContext: (c: Context, key: "user" | "session", value: any) => {
      c.set(key, value);
    },
    createResponse: (c: Context, body: unknown, status: number) => ({
      status,
      body,
    }),
  },
});

// Convert middleware to Hono middleware
const createHonoAuthMiddleware = () => {
  return async (c: Context, next: Next) => {
    const result = await authMiddleware(c, c, async () => {
      // Continue to next middleware/handler
      await next();
    });

    if (result) {
      return c.json(result.body, result.status);
    }
  };
};

// Public routes
app.get("/", (c) => {
  return c.json({
    message: "Welcome to Better Middleware Hono Example!",
    framework: "Hono",
    endpoints: {
      public: ["GET /", "GET /health"],
      protected: ["GET /profile", "GET /dashboard", "POST /api/data"],
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    framework: "Hono",
  });
});

// Protected routes
app.get("/profile", createHonoAuthMiddleware(), (c: AuthenticatedContext) => {
  const user = c.get("user");
  const session = c.get("session");

  return c.json({
    message: "User profile retrieved successfully",
    user,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  });
});

app.get("/dashboard", createHonoAuthMiddleware(), (c: AuthenticatedContext) => {
  const user = c.get("user");
  const session = c.get("session");

  return c.json({
    message: `Welcome to your dashboard, ${user.name || user.email}!`,
    userId: user.id,
    sessionId: session.id,
    framework: "Hono",
  });
});

app.post(
  "/api/data",
  createHonoAuthMiddleware(),
  async (c: AuthenticatedContext) => {
    const user = c.get("user");
    let body;

    try {
      body = await c.req.json();
    } catch {
      body = null;
    }

    return c.json({
      message: "Data endpoint accessed successfully",
      requestedBy: user.email,
      timestamp: new Date().toISOString(),
      receivedData: body,
      framework: "Hono",
    });
  },
);

// Role-based middleware
const requireRole = (roles: string[]) => {
  return async (c: AuthenticatedContext, next: Next) => {
    const user = c.get("user");
    const userRoles = (user as any).roles || [];

    const hasRequiredRole = roles.some((role) => userRoles.includes(role));
    if (!hasRequiredRole) {
      return c.json(
        {
          success: false,
          message: "Insufficient permissions",
          required: roles,
          userRoles,
        },
        403,
      );
    }

    await next();
  };
};

app.get(
  "/admin/users",
  createHonoAuthMiddleware(),
  requireRole(["admin"]),
  (c: AuthenticatedContext) => {
    const user = c.get("user");

    return c.json({
      message: "Admin endpoint accessed",
      adminUser: user.email,
      users: [
        { id: "1", email: "user1@example.com", role: "user" },
        { id: "2", email: "admin@example.com", role: "admin" },
      ],
      framework: "Hono",
    });
  },
);

// Multiple middleware example
app.get(
  "/api/secure-data",
  createHonoAuthMiddleware(),
  async (c: Context, next: Next) => {
    // Custom validation middleware
    const userAgent = c.req.header("user-agent");
    if (!userAgent) {
      return c.json({ error: "User agent required" }, 400);
    }
    await next();
  },
  (c: AuthenticatedContext) => {
    const user = c.get("user");
    return c.json({
      message: "Secure data accessed",
      user: user.email,
      userAgent: c.req.header("user-agent"),
      timestamp: new Date().toISOString(),
    });
  },
);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        error: err.message,
        stack: err.stack,
      }),
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
      path: c.req.path,
    },
    404,
  );
});

// Start server
console.log(`🚀 Hono server starting on http://localhost:${PORT}`);
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
console.log("    GET  /api/secure-data (with custom middleware)");

serve({
  fetch: app.fetch,
  port: PORT,
});
