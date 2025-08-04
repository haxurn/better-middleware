import { describe, expect, it } from "vitest";
import type {
  AuthContext,
  AuthMiddlewareOptions,
  AuthResponse,
  BetterAuthError,
  BetterAuthSession,
  BetterAuthSessionResponse,
  BetterAuthUser,
  CacheOptions,
  FrameworkContext,
  FrameworkRequest,
} from "./types";

describe("Type definitions", () => {
  describe("BetterAuthUser", () => {
    it("should have required properties", () => {
      const user: BetterAuthUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
        customField: "custom value",
      };

      expect(user.id).toBe("user123");
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.customField).toBe("custom value");
    });

    it("should allow optional name", () => {
      const user: BetterAuthUser = {
        id: "user123",
        email: "test@example.com",
      };

      expect(user.name).toBeUndefined();
    });

    it("should allow additional properties", () => {
      const user: BetterAuthUser = {
        id: "user123",
        email: "test@example.com",
        role: "admin",
        permissions: ["read", "write"],
      };

      expect(user.role).toBe("admin");
      expect(user.permissions).toEqual(["read", "write"]);
    });
  });

  describe("BetterAuthSession", () => {
    it("should have required properties", () => {
      const session: BetterAuthSession = {
        id: "session123",
        userId: "user123",
        expiresAt: "2024-12-31T23:59:59Z",
        customSessionData: "custom",
      };

      expect(session.id).toBe("session123");
      expect(session.userId).toBe("user123");
      expect(session.expiresAt).toBe("2024-12-31T23:59:59Z");
      expect(session.customSessionData).toBe("custom");
    });

    it("should allow additional properties", () => {
      const session: BetterAuthSession = {
        id: "session123",
        userId: "user123",
        expiresAt: "2024-12-31T23:59:59Z",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      };

      expect(session.ipAddress).toBe("192.168.1.1");
      expect(session.userAgent).toBe("Mozilla/5.0...");
    });
  });

  describe("BetterAuthError", () => {
    it("should have all required properties", () => {
      const error: BetterAuthError = {
        message: "Authentication failed",
        code: "UNAUTHORIZED",
        status: 401,
      };

      expect(error.message).toBe("Authentication failed");
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.status).toBe(401);
    });
  });

  describe("BetterAuthSessionResponse", () => {
    it("should handle successful response", () => {
      const response: BetterAuthSessionResponse = {
        data: {
          user: {
            id: "user123",
            email: "test@example.com",
          },
          session: {
            id: "session123",
            userId: "user123",
            expiresAt: "2024-12-31T23:59:59Z",
          },
        },
      };

      expect(response.data?.user.id).toBe("user123");
      expect(response.data?.session.id).toBe("session123");
      expect(response.error).toBeUndefined();
    });

    it("should handle error response", () => {
      const response: BetterAuthSessionResponse = {
        error: {
          message: "Session expired",
          code: "SESSION_EXPIRED",
          status: 401,
        },
      };

      expect(response.error?.message).toBe("Session expired");
      expect(response.error?.code).toBe("SESSION_EXPIRED");
      expect(response.data).toBeUndefined();
    });

    it("should handle empty response", () => {
      const response: BetterAuthSessionResponse = {};

      expect(response.data).toBeUndefined();
      expect(response.error).toBeUndefined();
    });
  });

  describe("AuthContext", () => {
    it("should contain user and session", () => {
      const context: AuthContext = {
        user: {
          id: "user123",
          email: "test@example.com",
        },
        session: {
          id: "session123",
          userId: "user123",
          expiresAt: "2024-12-31T23:59:59Z",
        },
      };

      expect(context.user.id).toBe("user123");
      expect(context.session.id).toBe("session123");
    });
  });

  describe("AuthResponse", () => {
    it("should have status and body", () => {
      const response: AuthResponse = {
        status: 200,
        body: { success: true, data: "test" },
      };

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: "test" });
    });

    it("should allow any body type", () => {
      const responses: AuthResponse[] = [
        { status: 200, body: "string" },
        { status: 200, body: 123 },
        { status: 200, body: true },
        { status: 200, body: null },
        { status: 200, body: { object: "value" } },
        { status: 200, body: ["array", "value"] },
      ];

      responses.forEach((response) => {
        expect(typeof response.status).toBe("number");
        expect(response.body).toBeDefined();
      });
    });
  });

  describe("CacheOptions", () => {
    it("should have required enabled property", () => {
      const options: CacheOptions = {
        enabled: true,
      };

      expect(options.enabled).toBe(true);
    });

    it("should allow optional ttl and max", () => {
      const options: CacheOptions = {
        enabled: true,
        ttl: 300,
        max: 1000,
      };

      expect(options.ttl).toBe(300);
      expect(options.max).toBe(1000);
    });

    it("should work with partial options", () => {
      const options1: CacheOptions = {
        enabled: true,
        ttl: 600,
      };

      const options2: CacheOptions = {
        enabled: false,
        max: 500,
      };

      expect(options1.max).toBeUndefined();
      expect(options2.ttl).toBeUndefined();
    });
  });

  describe("AuthMiddlewareOptions", () => {
    it("should have required baseURL and framework", () => {
      const options: AuthMiddlewareOptions = {
        baseURL: "http://localhost:3000",
        framework: {
          getHeaders: () => ({}),
          getCookies: () => ({}),
          setContext: () => {},
          createResponse: () => ({ status: 200, body: {} }),
        },
      };

      expect(options.baseURL).toBe("http://localhost:3000");
      expect(typeof options.framework.getHeaders).toBe("function");
    });

    it("should allow all optional properties", () => {
      const options: AuthMiddlewareOptions = {
        baseURL: "http://localhost:3000",
        fetchOptions: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        cache: {
          enabled: true,
          ttl: 600,
          max: 2000,
        },
        onError: async () => ({ status: 500, body: { error: "custom" } }),
        logger: {
          info: () => {},
          error: () => {},
          debug: () => {},
        },
        framework: {
          getHeaders: () => ({}),
          getCookies: () => ({}),
          setContext: () => {},
          createResponse: () => ({ status: 200, body: {} }),
        },
      };

      expect(options.fetchOptions?.method).toBe("POST");
      expect(options.cache?.enabled).toBe(true);
      expect(typeof options.onError).toBe("function");
      expect(typeof options.logger?.info).toBe("function");
    });

    it("should allow custom context types", () => {
      interface CustomContext {
        customField: string;
      }

      const options: AuthMiddlewareOptions<CustomContext> = {
        baseURL: "http://localhost:3000",
        framework: {
          getHeaders: () => ({}),
          getCookies: () => ({}),
          setContext: () => {},
          createResponse: () => ({ status: 200, body: {} }),
        },
      };

      expect(typeof options.framework.setContext).toBe("function");
      expect(typeof options.framework.createResponse).toBe("function");
    });
  });

  describe("Framework types", () => {
    it("should allow FrameworkContext to be any type", () => {
      const context1: FrameworkContext = "string";
      const context2: FrameworkContext = 123;
      const context3: FrameworkContext = { custom: "object" };
      const context4: FrameworkContext = null;

      expect(context1).toBe("string");
      expect(context2).toBe(123);
      expect(context3).toEqual({ custom: "object" });
      expect(context4).toBeNull();
    });

    it("should allow FrameworkRequest to be any type", () => {
      const request1: FrameworkRequest = { method: "GET", url: "/test" };
      const request2: FrameworkRequest = "request-string";
      const request3: FrameworkRequest = null;

      expect(request1).toEqual({ method: "GET", url: "/test" });
      expect(request2).toBe("request-string");
      expect(request3).toBeNull();
    });
  });
});
