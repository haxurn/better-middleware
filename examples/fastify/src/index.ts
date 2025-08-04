import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { createAuthMiddleware } from "better-middleware";
import type { FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";

// Extend Fastify types to include user and session
declare module "fastify" {
  interface FastifyRequest {
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
}

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});

const PORT = Number(process.env.PORT) || 3002;

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || "secret-key-change-in-production",
});

// Create Better Auth middleware
const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",

  // Enable caching
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000,
  },

  // Custom error handler
  onError: async (error, request) => {
    fastify.log.error("Authentication error:", error);
    return {
      status: 401,
      body: {
        success: false,
        message: "Authentication required",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  },

  // Custom logger integration
  logger: {
    info: (message, data) => fastify.log.info(data, message),
    error: (message, data) => fastify.log.error(data, message),
    debug: (message, data) => fastify.log.debug(data, message),
  },

  // Fastify-specific adapter
  framework: {
    getHeaders: (request: FastifyRequest) =>
      request.headers as Record<string, string>,
    getCookies: (request: FastifyRequest) => request.cookies || {},
    setContext: (
      request: FastifyRequest,
      key: "user" | "session",
      value: any,
    ) => {
      request[key] = value;
    },
    createResponse: (
      request: FastifyRequest,
      body: unknown,
      status: number,
    ) => ({
      status,
      body,
    }),
  },
});

// Convert middleware to Fastify preHandler
const createAuthPreHandler = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await authMiddleware(
      request,
      request,
      async () => {}, // No-op since we handle continuation differently
    );

    if (result) {
      reply.status(result.status).send(result.body);
      return;
    }
  };
};

// Public routes
fastify.get("/", async (request, reply) => {
  return {
    message: "Welcome to Better Middleware Fastify Example!",
    endpoints: {
      public: ["GET /", "GET /health"],
      protected: ["GET /profile", "GET /dashboard", "POST /api/data"],
    },
  };
});

fastify.get("/health", async (request, reply) => {
  return {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Protected routes
fastify.get(
  "/profile",
  {
    preHandler: createAuthPreHandler(),
  },
  async (request, reply) => {
    return {
      message: "User profile retrieved successfully",
      user: request.user,
      session: {
        id: request.session?.id,
        expiresAt: request.session?.expiresAt,
      },
    };
  },
);

fastify.get(
  "/dashboard",
  {
    preHandler: createAuthPreHandler(),
  },
  async (request, reply) => {
    return {
      message: `Welcome to your dashboard, ${request.user?.name || request.user?.email}!`,
      userId: request.user?.id,
      sessionId: request.session?.id,
    };
  },
);

fastify.post<{
  Body: { message?: string; data?: unknown };
}>(
  "/api/data",
  {
    preHandler: createAuthPreHandler(),
    schema: {
      body: {
        type: "object",
        properties: {
          message: { type: "string" },
          data: {},
        },
      },
    },
  },
  async (request, reply) => {
    return {
      message: "Data endpoint accessed successfully",
      requestedBy: request.user?.email,
      timestamp: new Date().toISOString(),
      receivedData: request.body,
    };
  },
);

// Role-based route example
const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.status(401).send({ error: "Not authenticated" });
    return;
  }

  const userRoles = (request.user as any).roles || [];
  if (!userRoles.includes("admin")) {
    reply.status(403).send({ error: "Admin access required" });
    return;
  }
};

fastify.get(
  "/admin/users",
  {
    preHandler: [createAuthPreHandler(), requireAdmin],
  },
  async (request, reply) => {
    return {
      message: "Admin endpoint accessed",
      adminUser: request.user?.email,
      users: [
        { id: "1", email: "user1@example.com", role: "user" },
        { id: "2", email: "admin@example.com", role: "admin" },
      ],
    };
  },
);

// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);

  reply.status(500).send({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
});

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  reply.status(404).send({
    success: false,
    message: "Route not found",
    path: request.url,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: PORT,
      host: "0.0.0.0",
    });

    console.log(`🚀 Fastify server running on http://localhost:${PORT}`);
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
