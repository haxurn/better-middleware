import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthResponse, BetterAuthError, FrameworkContext } from "../types";
import { createErrorResponse, getErrorMessage } from "./error";

describe("Error Utilities", () => {
  describe("getErrorMessage", () => {
    it("should return English message for known error codes", () => {
      expect(getErrorMessage("USER_ALREADY_EXISTS")).toBe(
        "User already registered",
      );
      expect(getErrorMessage("INVALID_CREDENTIALS")).toBe(
        "Invalid email or password",
      );
      expect(getErrorMessage("UNAUTHORIZED")).toBe("Unauthorized access");
      expect(getErrorMessage("SESSION_EXPIRED")).toBe("Session has expired");
      expect(getErrorMessage("INVALID_SESSION")).toBe(
        "Invalid or missing session",
      );
    });

    it("should return Spanish message when language is specified", () => {
      expect(getErrorMessage("USER_ALREADY_EXISTS", "es")).toBe(
        "Usuario ya registrado",
      );
      expect(getErrorMessage("INVALID_CREDENTIALS", "es")).toBe(
        "Correo o contraseña inválidos",
      );
      expect(getErrorMessage("UNAUTHORIZED", "es")).toBe(
        "Acceso no autorizado",
      );
      expect(getErrorMessage("SESSION_EXPIRED", "es")).toBe(
        "La sesión ha expirado",
      );
      expect(getErrorMessage("INVALID_SESSION", "es")).toBe(
        "Sesión inválida o faltante",
      );
    });

    it("should return default message for unknown error codes", () => {
      expect(getErrorMessage("UNKNOWN_ERROR")).toBe("Unknown error");
      expect(getErrorMessage("UNKNOWN_ERROR", "es")).toBe("Unknown error");
      expect(getErrorMessage("")).toBe("Unknown error");
    });

    it("should default to English when language is not provided", () => {
      expect(getErrorMessage("USER_ALREADY_EXISTS")).toBe(
        "User already registered",
      );
    });
  });

  describe("createErrorResponse", () => {
    const mockCreateResponse = vi.fn();
    const mockContext = { test: "context" } as FrameworkContext;

    beforeEach(() => {
      mockCreateResponse.mockClear();
      mockCreateResponse.mockReturnValue({
        status: 401,
        body: { success: false, message: "test", code: "TEST" },
      });
    });

    it("should handle BetterAuthError with code", () => {
      const error: BetterAuthError = {
        message: "Custom error message",
        code: "UNAUTHORIZED",
        status: 403,
      };

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Unauthorized access",
          code: "UNAUTHORIZED",
        },
        403,
      );
    });

    it("should handle BetterAuthError without status (default to 401)", () => {
      const error: Partial<BetterAuthError> = {
        message: "Custom error message",
        code: "SESSION_EXPIRED",
      };

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Session has expired",
          code: "SESSION_EXPIRED",
        },
        401,
      );
    });

    it("should handle regular Error objects", () => {
      const error = new Error("Regular error message");

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Regular error message",
          code: "UNAUTHORIZED",
        },
        401,
      );
    });

    it("should handle errors without message", () => {
      const error = {};

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Invalid or missing session",
          code: "UNAUTHORIZED",
        },
        401,
      );
    });

    it("should handle null/undefined errors", () => {
      createErrorResponse(null, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Invalid or missing session",
          code: "UNAUTHORIZED",
        },
        401,
      );
    });

    it("should handle string errors", () => {
      const error = "String error message";

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Invalid or missing session",
          code: "UNAUTHORIZED",
        },
        401,
      );
    });

    it("should return the response from createResponse function", () => {
      const expectedResponse: AuthResponse = {
        status: 401,
        body: { success: false, message: "test", code: "UNAUTHORIZED" },
      };
      mockCreateResponse.mockReturnValue(expectedResponse);

      const error = new Error("Test error");
      const result = createErrorResponse(
        error,
        mockContext,
        mockCreateResponse,
      );

      expect(result).toBe(expectedResponse);
    });

    it("should handle complex BetterAuthError objects", () => {
      const error: BetterAuthError & { details?: unknown } = {
        message: "Complex error",
        code: "INVALID_CREDENTIALS",
        status: 422,
        details: { field: "email" },
      };

      createErrorResponse(error, mockContext, mockCreateResponse);

      expect(mockCreateResponse).toHaveBeenCalledWith(
        mockContext,
        {
          success: false,
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        422,
      );
    });
  });
});
