import { createAuthMiddleware } from "better-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

// Extend NextApiRequest to include user and session
export interface AuthenticatedNextApiRequest extends NextApiRequest {
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

// Create the Better Auth middleware instance
const authMiddleware = createAuthMiddleware({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",

  // Enable caching for better performance
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000,
  },

  // Custom error handler
  onError: async (error, req) => {
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

  // Next.js-specific adapter
  framework: {
    getHeaders: (req: NextApiRequest) => req.headers as Record<string, string>,
    getCookies: (req: NextApiRequest) => req.cookies || {},
    setContext: (req: NextApiRequest, key: "user" | "session", value: any) => {
      (req as any)[key] = value;
    },
    createResponse: (req: NextApiRequest, body: unknown, status: number) => ({
      status,
      body,
    }),
  },
});

// Higher-order function to wrap Next.js API routes with authentication
export function withAuth<T = any>(
  handler: (
    req: AuthenticatedNextApiRequest,
    res: NextApiResponse<T>,
  ) => Promise<void> | void,
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    try {
      // Run the authentication middleware
      const result = await authMiddleware(req, req, async () => {
        // If authentication succeeds, call the original handler
        await handler(req as AuthenticatedNextApiRequest, res);
      });

      // If middleware returns a result, it means authentication failed
      if (result) {
        return res.status(result.status).json(result.body as T);
      }
    } catch (error) {
      console.error("API route error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      } as T);
    }
  };
}

// Higher-order function for role-based access control
export function withRole<T = any>(
  roles: string[],
  handler: (
    req: AuthenticatedNextApiRequest,
    res: NextApiResponse<T>,
  ) => Promise<void> | void,
) {
  return withAuth<T>(
    async (req: AuthenticatedNextApiRequest, res: NextApiResponse<T>) => {
      const userRoles = (req.user as any)?.roles || [];
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          required: roles,
          userRoles,
        } as T);
      }

      await handler(req, res);
    },
  );
}

// Method-specific wrapper
export function withMethod<T = any>(
  method: string | string[],
  handler: (
    req: AuthenticatedNextApiRequest,
    res: NextApiResponse<T>,
  ) => Promise<void> | void,
) {
  const methods = Array.isArray(method) ? method : [method];

  return (req: NextApiRequest, res: NextApiResponse<T>) => {
    if (!methods.includes(req.method || "")) {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`,
        allowed: methods,
      } as T);
    }

    return handler(req as AuthenticatedNextApiRequest, res);
  };
}

// Combined wrapper for authenticated routes with method validation
export function withAuthAndMethod<T = any>(
  method: string | string[],
  handler: (
    req: AuthenticatedNextApiRequest,
    res: NextApiResponse<T>,
  ) => Promise<void> | void,
) {
  return withMethod(method, withAuth(handler));
}
