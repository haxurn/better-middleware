import type { AuthResponse, BetterAuthError, FrameworkContext } from "../types";

const ERROR_MESSAGES: Record<string, { en: string; es: string }> = {
  USER_ALREADY_EXISTS: {
    en: "User already registered",
    es: "Usuario ya registrado",
  },
  INVALID_CREDENTIALS: {
    en: "Invalid email or password",
    es: "Correo o contraseña inválidos",
  },
  UNAUTHORIZED: {
    en: "Unauthorized access",
    es: "Acceso no autorizado",
  },
  SESSION_EXPIRED: {
    en: "Session has expired",
    es: "La sesión ha expirado",
  },
  INVALID_SESSION: {
    en: "Invalid or missing session",
    es: "Sesión inválida o faltante",
  },
} as const;

export function getErrorMessage(
  errorCode: string,
  lang: "en" | "es" = "en",
): string {
  return ERROR_MESSAGES[errorCode]?.[lang] || "Unknown error";
}

export function createErrorResponse<TContext extends FrameworkContext>(
  error: unknown,
  ctx: TContext,
  createResponse: (
    ctx: TContext,
    body: unknown,
    status: number,
  ) => AuthResponse,
): AuthResponse {
  const code = (error as BetterAuthError)?.code || "UNAUTHORIZED";
  const message = (error as BetterAuthError)?.code
    ? getErrorMessage(code)
    : (error as Error)?.message || "Invalid or missing session";
  const status = (error as BetterAuthError)?.status || 401;
  return createResponse(ctx, { success: false, message, code }, status);
}
