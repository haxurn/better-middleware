export interface BetterAuthUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  [key: string]: unknown;
}

export interface BetterAuthError {
  message: string;
  code: string;
  status: number;
}

export interface BetterAuthSessionResponse {
  data?: {
    user: BetterAuthUser;
    session: BetterAuthSession;
  };
  error?: BetterAuthError;
}

export interface AuthContext {
  user: BetterAuthUser;
  session: BetterAuthSession;
}

export interface AuthResponse {
  status: number;
  body: unknown;
}

export type FrameworkContext = unknown;
export type FrameworkRequest = unknown;

export interface CacheOptions {
  enabled: boolean;
  ttl?: number; // Time to live in seconds, defaults to 300 (5 minutes)
  max?: number; // Maximum number of entries, defaults to 1000
}

export interface AuthMiddlewareOptions<
  TContext extends FrameworkContext = FrameworkContext,
> {
  baseURL: string;
  fetchOptions?: RequestInit;
  cache?: CacheOptions;
  onError?: (
    error: unknown,
    ctx: TContext,
  ) => AuthResponse | Promise<AuthResponse>;
  logger?: {
    info: (message: string, data?: Record<string, unknown>) => void;
    error: (message: string, data?: Record<string, unknown>) => void;
    debug: (message: string, data?: Record<string, unknown>) => void;
  };
  framework: {
    getHeaders: (req: FrameworkRequest) => Record<string, string>;
    getCookies: (req: FrameworkRequest) => Record<string, string>;
    setContext: (
      ctx: TContext,
      key: "user" | "session",
      value: BetterAuthUser | BetterAuthSession,
    ) => void;
    createResponse: (
      ctx: TContext,
      body: unknown,
      status: number,
    ) => AuthResponse;
  };
}
