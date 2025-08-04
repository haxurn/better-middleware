import { LRUCache } from "lru-cache";
import type { AuthContext } from "../types";

export class SessionCache {
  private cache: LRUCache<string, AuthContext>;

  constructor(max: number = 1000, ttl: number = 300) {
    this.cache = new LRUCache({
      max,
      ttl: ttl * 1000,
      allowStale: false,
      updateAgeOnGet: true,
    });
  }

  get(key: string): AuthContext | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: AuthContext): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  static extractSessionToken(cookieString: string): string | null {
    if (!cookieString) return null;

    const sessionCookieNames = [
      "better-auth.session_token",
      "session_token",
      "session",
    ];

    for (const cookieName of sessionCookieNames) {
      const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }
}
