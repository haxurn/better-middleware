import { createAuthClient } from "better-auth/client";
import type {
  AuthContext,
  AuthMiddlewareOptions,
  AuthResponse,
  BetterAuthSessionResponse,
  FrameworkContext,
  FrameworkRequest,
} from "./types";
import { createErrorResponse, createLogger, SessionCache } from "./utils";

export type {
  AuthContext,
  AuthMiddlewareOptions,
  AuthResponse,
  BetterAuthError,
  BetterAuthSession,
  BetterAuthUser,
  CacheOptions,
  FrameworkContext,
  FrameworkRequest,
} from "./types";

export { createErrorResponse, createLogger, SessionCache } from "./utils";

export function createAuthMiddleware<TContext extends FrameworkContext>(
  options: AuthMiddlewareOptions<TContext>,
) {
  const {
    baseURL,
    fetchOptions,
    cache,
    onError,
    logger: customLogger,
    framework,
  } = options;

  const logger = customLogger || createLogger({ name: "BetterAuthMiddleware" });

  const authClient = createAuthClient({
    baseURL,
    fetchOptions: {
      credentials: "include",
      ...fetchOptions,
    },
  });

  const sessionCache = cache?.enabled
    ? new SessionCache(cache.max || 1000, cache.ttl || 300)
    : null;

  return async (
    req: FrameworkRequest,
    ctx: TContext,
    next: () => Promise<void>,
  ): Promise<AuthResponse | undefined> => {
    try {
      const headers = framework.getHeaders(req);
      const cookieString = headers.cookie || "";

      const sessionToken = SessionCache.extractSessionToken(cookieString);

      if (!sessionToken) {
        logger.debug("No session token found in request");
        throw new Error("No session token found");
      }

      const maskedToken = `${sessionToken.slice(0, 8)}...`;
      logger.debug("Processing session", { sessionToken: maskedToken });

      if (sessionCache?.has(sessionToken)) {
        const cached = sessionCache.get(sessionToken);
        if (cached) {
          logger.debug("Cache hit for session", { sessionToken: maskedToken });
          framework.setContext(ctx, "user", cached.user);
          framework.setContext(ctx, "session", cached.session);
          await next();
          return;
        }
      }

      const sessionResponse = (await authClient.getSession({
        fetchOptions: { headers },
      })) as unknown as BetterAuthSessionResponse;

      if (sessionResponse.error) {
        logger.error("Session validation failed", {
          error: sessionResponse.error.message,
          code: sessionResponse.error.code,
        });
        throw sessionResponse.error;
      }

      if (!sessionResponse.data?.session || !sessionResponse.data?.user) {
        logger.error("Invalid session response structure");
        throw new Error("Invalid session response");
      }

      const authContext: AuthContext = {
        user: sessionResponse.data.user,
        session: sessionResponse.data.session,
      };

      logger.info("Session validated successfully", {
        userId: authContext.user.id,
        sessionId: authContext.session.id,
      });

      if (sessionCache) {
        sessionCache.set(sessionToken, authContext);
        logger.debug("Session cached", {
          sessionToken: maskedToken,
          cacheSize: sessionCache.size(),
        });
      }

      framework.setContext(ctx, "user", authContext.user);
      framework.setContext(ctx, "session", authContext.session);

      await next();
      return;
    } catch (error) {
      logger.error("Authentication failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      if (onError) {
        return await onError(error, ctx);
      }

      return createErrorResponse(error, ctx, framework.createResponse);
    }
  };
}
