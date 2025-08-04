import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthMiddleware } from "./index";
import type {
  AuthContext,
  AuthMiddlewareOptions,
  BetterAuthSessionResponse,
  FrameworkContext,
  FrameworkRequest,
} from "./types";

// Mock the better-auth client
vi.mock("better-auth/client", () => ({
  createAuthClient: vi.fn(() => ({
    getSession: vi.fn(),
  })),
}));

// Mock utilities
vi.mock("./utils", () => ({
  SessionCache: vi.fn().mockImplementation(() => ({
    has: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    size: vi.fn(() => 0),
  })),
  createErrorResponse: vi.fn(() => ({ status: 401, body: { error: "test" } })),
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

import { createAuthClient } from "better-auth/client";
import { createErrorResponse, createLogger, SessionCache } from "./utils";

describe("createAuthMiddleware", () => {
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockSessionCache: {
    has: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    size: ReturnType<typeof vi.fn>;
  };
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let mockFramework: AuthMiddlewareOptions<unknown>["framework"];
  let mockRequest: FrameworkRequest;
  let mockContext: FrameworkContext;
  let mockNext: ReturnType<typeof vi.fn>;

  const validAuthContext: AuthContext = {
    user: {
      id: "user123",
      email: "test@example.com",
      name: "Test User",
    },
    session: {
      id: "session123",
      userId: "user123",
      expiresAt: "2024-12-31T23:59:59Z",
    },
  };

  const successSessionResponse: BetterAuthSessionResponse = {
    data: validAuthContext,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup Better Auth client mock
    mockGetSession = vi.fn();
    (createAuthClient as ReturnType<typeof vi.fn>).mockReturnValue({
      getSession: mockGetSession,
    });

    // Setup SessionCache mock
    mockSessionCache = {
      has: vi.fn(() => false),
      get: vi.fn(),
      set: vi.fn(),
      size: vi.fn(() => 0),
    };
    (SessionCache as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockSessionCache,
    );
    (
      SessionCache as unknown as {
        extractSessionToken: ReturnType<typeof vi.fn>;
      }
    ).extractSessionToken = vi.fn(() => "valid_token");

    // Setup logger mock
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    (createLogger as ReturnType<typeof vi.fn>).mockReturnValue(mockLogger);

    // Setup framework mock
    mockFramework = {
      getHeaders: vi.fn(() => ({
        cookie: "better-auth.session_token=valid_token",
      })),
      getCookies: vi.fn(() => ({ session_token: "valid_token" })),
      setContext: vi.fn(),
      createResponse: vi.fn(() => ({ status: 401, body: { error: "test" } })),
    };

    mockRequest = { test: "request" } as FrameworkRequest;
    mockContext = { test: "context" } as FrameworkContext;
    mockNext = vi.fn().mockResolvedValue(undefined);

    // Setup default successful session response
    mockGetSession.mockResolvedValue(successSessionResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("middleware creation", () => {
    it("should create middleware function with required options", () => {
      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      expect(middleware).toBeInstanceOf(Function);
      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: "http://localhost:3000",
        fetchOptions: {
          credentials: "include",
        },
      });
    });

    it("should merge custom fetchOptions with defaults", () => {
      createAuthMiddleware({
        baseURL: "http://localhost:3000",
        fetchOptions: {
          method: "POST",
          headers: { "Custom-Header": "value" },
        },
        framework: mockFramework,
      });

      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: "http://localhost:3000",
        fetchOptions: {
          credentials: "include",
          method: "POST",
          headers: { "Custom-Header": "value" },
        },
      });
    });

    it("should create session cache when cache is enabled", () => {
      createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: {
          enabled: true,
          max: 500,
          ttl: 600,
        },
        framework: mockFramework,
      });

      expect(SessionCache).toHaveBeenCalledWith(500, 600);
    });

    it("should use default cache values when not specified", () => {
      createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      expect(SessionCache).toHaveBeenCalledWith(1000, 300);
    });

    it("should not create cache when disabled", () => {
      createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: false },
        framework: mockFramework,
      });

      expect(SessionCache).not.toHaveBeenCalled();
    });

    it("should use custom logger when provided", () => {
      const customLogger = {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      createAuthMiddleware({
        baseURL: "http://localhost:3000",
        logger: customLogger,
        framework: mockFramework,
      });

      expect(createLogger).not.toHaveBeenCalled();
    });
  });

  describe("successful authentication flow", () => {
    it("should authenticate user with valid session", async () => {
      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toBeUndefined();
      expect(mockFramework.getHeaders).toHaveBeenCalledWith(mockRequest);
      expect(SessionCache.extractSessionToken).toHaveBeenCalledWith(
        "better-auth.session_token=valid_token",
      );
      expect(mockGetSession).toHaveBeenCalledWith({
        fetchOptions: {
          headers: { cookie: "better-auth.session_token=valid_token" },
        },
      });
      expect(mockFramework.setContext).toHaveBeenCalledWith(
        mockContext,
        "user",
        validAuthContext.user,
      );
      expect(mockFramework.setContext).toHaveBeenCalledWith(
        mockContext,
        "session",
        validAuthContext.session,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should use cached session when available", async () => {
      mockSessionCache.has.mockReturnValue(true);
      mockSessionCache.get.mockReturnValue(validAuthContext);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toBeUndefined();
      expect(mockSessionCache.has).toHaveBeenCalledWith("valid_token");
      expect(mockSessionCache.get).toHaveBeenCalledWith("valid_token");
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockFramework.setContext).toHaveBeenCalledWith(
        mockContext,
        "user",
        validAuthContext.user,
      );
      expect(mockFramework.setContext).toHaveBeenCalledWith(
        mockContext,
        "session",
        validAuthContext.session,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should cache session after successful validation", async () => {
      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockSessionCache.set).toHaveBeenCalledWith(
        "valid_token",
        validAuthContext,
      );
    });

    it("should log successful authentication", async () => {
      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockLogger.debug).toHaveBeenCalledWith("Processing session", {
        sessionToken: "valid_to...",
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Session validated successfully",
        {
          userId: validAuthContext.user.id,
          sessionId: validAuthContext.session.id,
        },
      );
    });
  });

  describe("authentication failures", () => {
    it("should handle missing session token", async () => {
      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue(null);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No session token found in request",
      );
      expect(mockLogger.error).toHaveBeenCalledWith("Authentication failed", {
        error: "No session token found",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle session validation error from Better Auth", async () => {
      const authError = {
        message: "Session invalid",
        code: "INVALID_SESSION",
        status: 401,
      };
      mockGetSession.mockResolvedValue({ error: authError });

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Session validation failed",
        {
          error: authError.message,
          code: authError.code,
        },
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle invalid session response structure", async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid session response structure",
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle missing user in session response", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: validAuthContext.session,
          user: null,
        },
      });

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid session response structure",
      );
    });

    it("should handle missing session in response", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          user: validAuthContext.user,
          session: null,
        },
      });

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid session response structure",
      );
    });
  });

  describe("custom error handling", () => {
    it("should use custom error handler when provided", async () => {
      const customErrorResponse = { status: 403, body: { custom: "error" } };
      const onError = vi.fn().mockResolvedValue(customErrorResponse);

      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue(null);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        onError,
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual(customErrorResponse);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), mockContext);
      expect(createErrorResponse).not.toHaveBeenCalled();
    });

    it("should pass through custom error handler errors", async () => {
      const customError = new Error("Custom error handler failed");
      const onError = vi.fn().mockRejectedValue(customError);

      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue(null);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        onError,
        framework: mockFramework,
      });

      await expect(
        middleware(mockRequest, mockContext, mockNext),
      ).rejects.toThrow("Custom error handler failed");
    });
  });

  describe("caching behavior", () => {
    it("should not use cache when disabled", async () => {
      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockSessionCache.has).not.toHaveBeenCalled();
      expect(mockSessionCache.get).not.toHaveBeenCalled();
      expect(mockSessionCache.set).not.toHaveBeenCalled();
    });

    it("should handle cache miss correctly", async () => {
      mockSessionCache.has.mockReturnValue(false);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockSessionCache.has).toHaveBeenCalledWith("valid_token");
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSessionCache.set).toHaveBeenCalledWith(
        "valid_token",
        validAuthContext,
      );
    });

    it("should handle cache with undefined value", async () => {
      mockSessionCache.has.mockReturnValue(true);
      mockSessionCache.get.mockReturnValue(undefined);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockGetSession).toHaveBeenCalled();
    });

    it("should log cache operations", async () => {
      // Test cache hit
      mockSessionCache.has.mockReturnValue(true);
      mockSessionCache.get.mockReturnValue(validAuthContext);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockLogger.debug).toHaveBeenCalledWith("Cache hit for session", {
        sessionToken: "valid_to...",
      });
    });

    it("should log cache set operations", async () => {
      mockSessionCache.size.mockReturnValue(5);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        cache: { enabled: true },
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockLogger.debug).toHaveBeenCalledWith("Session cached", {
        sessionToken: "valid_to...",
        cacheSize: 5,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty cookie string", async () => {
      mockFramework.getHeaders = vi.fn(() => ({ cookie: "" }));
      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue(null);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No session token found in request",
      );
    });

    it("should handle missing cookie header", async () => {
      mockFramework.getHeaders = vi.fn(() => ({}));
      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue(null);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
    });

    it("should handle network errors from Better Auth", async () => {
      const networkError = new Error("Network error");
      mockGetSession.mockRejectedValue(networkError);

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      const result = await middleware(mockRequest, mockContext, mockNext);

      expect(result).toEqual({ status: 401, body: { error: "test" } });
      expect(mockLogger.error).toHaveBeenCalledWith("Authentication failed", {
        error: "Network error",
      });
    });

    it("should mask session token in logs correctly", async () => {
      (
        SessionCache as unknown as {
          extractSessionToken: ReturnType<typeof vi.fn>;
        }
      ).extractSessionToken.mockReturnValue("verylongsessiontoken123456789");

      const middleware = createAuthMiddleware({
        baseURL: "http://localhost:3000",
        framework: mockFramework,
      });

      await middleware(mockRequest, mockContext, mockNext);

      expect(mockLogger.debug).toHaveBeenCalledWith("Processing session", {
        sessionToken: "verylong...",
      });
    });
  });
});
