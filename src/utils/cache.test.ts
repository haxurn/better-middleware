import { beforeEach, describe, expect, it } from "vitest";
import type { AuthContext } from "../types";
import { SessionCache } from "./cache";

describe("SessionCache", () => {
  let cache: SessionCache;
  const mockAuthContext: AuthContext = {
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

  beforeEach(() => {
    cache = new SessionCache(100, 60); // 100 entries, 60 seconds TTL
  });

  describe("constructor", () => {
    it("should create cache with default values", () => {
      const defaultCache = new SessionCache();
      expect(defaultCache.size()).toBe(0);
    });

    it("should create cache with custom values", () => {
      const customCache = new SessionCache(500, 120);
      expect(customCache.size()).toBe(0);
    });
  });

  describe("basic operations", () => {
    it("should set and get values", () => {
      const key = "test-key";
      cache.set(key, mockAuthContext);

      const result = cache.get(key);
      expect(result).toEqual(mockAuthContext);
    });

    it("should return undefined for non-existent keys", () => {
      const result = cache.get("non-existent");
      expect(result).toBeUndefined();
    });

    it("should check if key exists", () => {
      const key = "test-key";
      expect(cache.has(key)).toBe(false);

      cache.set(key, mockAuthContext);
      expect(cache.has(key)).toBe(true);
    });

    it("should delete entries", () => {
      const key = "test-key";
      cache.set(key, mockAuthContext);
      expect(cache.has(key)).toBe(true);

      cache.delete(key);
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeUndefined();
    });

    it("should clear all entries", () => {
      cache.set("key1", mockAuthContext);
      cache.set("key2", mockAuthContext);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });

    it("should track cache size", () => {
      expect(cache.size()).toBe(0);

      cache.set("key1", mockAuthContext);
      expect(cache.size()).toBe(1);

      cache.set("key2", mockAuthContext);
      expect(cache.size()).toBe(2);

      cache.delete("key1");
      expect(cache.size()).toBe(1);
    });
  });

  describe("TTL behavior", () => {
    it("should expire entries after TTL", async () => {
      const shortTtlCache = new SessionCache(100, 0.1); // 100ms TTL
      const key = "test-key";

      shortTtlCache.set(key, mockAuthContext);
      expect(shortTtlCache.has(key)).toBe(true);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortTtlCache.has(key)).toBe(false);
      expect(shortTtlCache.get(key)).toBeUndefined();
    });
  });

  describe("extractSessionToken", () => {
    it("should extract better-auth session token", () => {
      const cookieString =
        "better-auth.session_token=abc123; other_cookie=value";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("abc123");
    });

    it("should extract generic session_token", () => {
      const cookieString = "session_token=xyz789; other_cookie=value";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("xyz789");
    });

    it("should extract generic session cookie", () => {
      const cookieString = "session=def456; other_cookie=value";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("def456");
    });

    it("should return first matching token when multiple present", () => {
      const cookieString =
        "better-auth.session_token=first; session_token=second";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("first");
    });

    it("should handle tokens with special characters", () => {
      const cookieString = "better-auth.session_token=abc-123_def.xyz";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("abc-123_def.xyz");
    });

    it("should handle tokens that end with semicolon", () => {
      const cookieString = "better-auth.session_token=abc123;";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBe("abc123");
    });

    it("should return null for empty cookie string", () => {
      const token = SessionCache.extractSessionToken("");
      expect(token).toBeNull();
    });

    it("should return null when no session tokens found", () => {
      const cookieString = "other_cookie=value; another=test";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBeNull();
    });

    it("should return null for malformed cookies", () => {
      const cookieString = "session_token=; empty_token=";
      const token = SessionCache.extractSessionToken(cookieString);
      expect(token).toBeNull();
    });
  });

  describe("LRU behavior", () => {
    it("should evict least recently used entries when max size exceeded", () => {
      const smallCache = new SessionCache(2, 300); // Only 2 entries

      smallCache.set("key1", mockAuthContext);
      smallCache.set("key2", mockAuthContext);
      expect(smallCache.size()).toBe(2);

      // Adding third entry should evict first
      smallCache.set("key3", mockAuthContext);
      expect(smallCache.size()).toBe(2);
      expect(smallCache.has("key1")).toBe(false);
      expect(smallCache.has("key2")).toBe(true);
      expect(smallCache.has("key3")).toBe(true);
    });

    it("should update access order on get", () => {
      const smallCache = new SessionCache(2, 300);

      smallCache.set("key1", mockAuthContext);
      smallCache.set("key2", mockAuthContext);

      // Access key1 to make it recently used
      smallCache.get("key1");

      // Add key3, should evict key2 (least recently used)
      smallCache.set("key3", mockAuthContext);
      expect(smallCache.has("key1")).toBe(true);
      expect(smallCache.has("key2")).toBe(false);
      expect(smallCache.has("key3")).toBe(true);
    });
  });
});
