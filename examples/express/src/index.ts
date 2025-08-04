import { createAuthMiddleware } from "better-middleware";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import express from "express";

// Extend Express Request interface to include user and session
declare global {
  namespace Express {
    interface Request {
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
}

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Create Better Auth middleware
const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",

  // Optional: Enable caching for better performance
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000, // 1000 sessions
  },

  // Optional: Custom error handler
  onError: async (error, req) => {
    console.error("Authentication error:", error);
    return {
      status: 401,
      body: {
        success: false,
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  },

  // Framework-specific adapter
  framework: {
    getHeaders: (req: Request) => req.headers as Record<string, string>,
    getCookies: (req: Request) => req.cookies || {},
    setContext: (req: Request, key: "user" | "session", value: any) => {
      req[key] = value;
    },
    createResponse: (req: Request, body: unknown, status: number) => ({
      status,
      body,
    }),
  },
});

// Public routes - no authentication required
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Better Middleware Express Example!",
    endpoints: {
      public: ["GET /", "GET /health"],
      protected: ["GET /profile", "GET /dashboard", "POST /api/data"],
    },
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Protected routes - authentication required
app.get("/profile", authMiddleware, (req: Request, res: Response) => {
  res.json({
    message: "User profile retrieved successfully",
    user: req.user,
    session: {
      id: req.session?.id,
      expiresAt: req.session?.expiresAt,
    },
  });
});

app.get("/dashboard", authMiddleware, (req: Request, res: Response) => {
  res.json({
    message: `Welcome to your dashboard, ${req.user?.name || req.user?.email}!`,
    userId: req.user?.id,
    sessionId: req.session?.id,
  });
});

app.post("/api/data", authMiddleware, (req: Request, res: Response) => {
  res.json({
    message: "Data endpoint accessed successfully",
    requestedBy: req.user?.email,
    timestamp: new Date().toISOString(),
    data: req.body,
  });
});

// Role-based route example
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Assuming roles are stored in user object
  const userRoles = (req.user as any).roles || [];
  if (!userRoles.includes("admin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

app.get(
  "/admin/users",
  authMiddleware,
  requireAdmin,
  (req: Request, res: Response) => {
    res.json({
      message: "Admin endpoint accessed",
      adminUser: req.user?.email,
      users: [
        { id: "1", email: "user1@example.com", role: "user" },
        { id: "2", email: "admin@example.com", role: "admin" },
      ],
    });
  },
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
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
});
