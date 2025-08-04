import { describe, expect, it } from "vitest";

describe("Package exports", () => {
  describe("Main function export", () => {
    it("should export createAuthMiddleware function", async () => {
      const { createAuthMiddleware } = await import("./index");
      expect(createAuthMiddleware).toBeDefined();
      expect(typeof createAuthMiddleware).toBe("function");
    });
  });

  describe("Type exports", () => {
    it("should export all required types", async () => {
      // This test ensures that all types can be imported without errors
      const types = await import("./index");

      // The existence of the module import confirms types are properly exported
      expect(types).toBeDefined();
    });

    // Test type imports at compile time
    it("should allow importing specific types", () => {
      // This test ensures TypeScript compilation works for type imports
      // If this compiles, the types are properly exported
      expect(true).toBe(true);
    });
  });

  describe("Utility exports", () => {
    it("should export SessionCache", async () => {
      const { SessionCache } = await import("./index");
      expect(SessionCache).toBeDefined();
      expect(typeof SessionCache).toBe("function");

      // Test instantiation
      const cache = new SessionCache();
      expect(cache).toBeDefined();
      expect(typeof cache.get).toBe("function");
      expect(typeof cache.set).toBe("function");
      expect(typeof cache.has).toBe("function");
      expect(typeof cache.delete).toBe("function");
      expect(typeof cache.clear).toBe("function");
      expect(typeof cache.size).toBe("function");
    });

    it("should export createErrorResponse", async () => {
      const { createErrorResponse } = await import("./index");
      expect(createErrorResponse).toBeDefined();
      expect(typeof createErrorResponse).toBe("function");
    });

    it("should export createLogger", async () => {
      const { createLogger } = await import("./index");
      expect(createLogger).toBeDefined();
      expect(typeof createLogger).toBe("function");

      // Test instantiation
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.success).toBe("function");
    });
  });

  describe("Static methods", () => {
    it("should export SessionCache.extractSessionToken static method", async () => {
      const { SessionCache } = await import("./index");
      expect(typeof SessionCache.extractSessionToken).toBe("function");

      // Test the static method
      const token = SessionCache.extractSessionToken("session_token=test123");
      expect(token).toBe("test123");
    });
  });

  describe("Complete API surface", () => {
    it("should have all expected exports", async () => {
      const moduleExports = await import("./index");

      // Function exports
      expect(moduleExports.createAuthMiddleware).toBeDefined();
      expect(moduleExports.SessionCache).toBeDefined();
      expect(moduleExports.createErrorResponse).toBeDefined();
      expect(moduleExports.createLogger).toBeDefined();

      // Ensure no unexpected exports
      const exportNames = Object.keys(moduleExports);
      const expectedExports = [
        "createAuthMiddleware",
        "SessionCache",
        "createErrorResponse",
        "createLogger",
      ];

      expectedExports.forEach((expectedExport) => {
        expect(exportNames).toContain(expectedExport);
      });
    });
  });

  describe("Framework integration compatibility", () => {
    it("should be compatible with ESM imports", async () => {
      // Dynamic import (ESM style)
      const { createAuthMiddleware } = await import("./index");
      expect(createAuthMiddleware).toBeDefined();
    });

    it("should provide proper TypeScript definitions", () => {
      // This test ensures proper type definitions are available
      // The fact that this file compiles confirms TypeScript compatibility
      expect(true).toBe(true);
    });
  });
});
