import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, levels, shouldPublishLog } from "./logger";

describe("Logger Utilities", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("shouldPublishLog", () => {
    it("should return true when log level meets current level threshold", () => {
      expect(shouldPublishLog("error", "error")).toBe(true);
      expect(shouldPublishLog("error", "warn")).toBe(true);
      expect(shouldPublishLog("warn", "warn")).toBe(true);
      expect(shouldPublishLog("info", "info")).toBe(true);
    });

    it("should return false when log level is below threshold", () => {
      expect(shouldPublishLog("warn", "error")).toBe(false);
      expect(shouldPublishLog("info", "warn")).toBe(false);
      expect(shouldPublishLog("error", "debug")).toBe(false);
    });

    it("should handle success level correctly", () => {
      expect(shouldPublishLog("success", "info")).toBe(true);
      expect(shouldPublishLog("info", "success")).toBe(false);
    });
  });

  describe("createLogger", () => {
    it("should create logger with default options", () => {
      const logger = createLogger();

      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("success");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("debug");

      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should use default name when not provided", () => {
      const logger = createLogger();
      logger.error("test message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[BetterAuthMiddleware]:"),
      );
    });

    it("should use custom name when provided", () => {
      const logger = createLogger({ name: "CustomLogger" });
      logger.error("test message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[CustomLogger]:"),
      );
    });

    it("should respect disabled flag", () => {
      const logger = createLogger({ disabled: true });
      logger.error("test message");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should respect log level filtering", () => {
      const logger = createLogger({ level: "warn" });

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // With level 'warn', info and success should be published, debug and error should not
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("WARN"),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should use console.error for error level", () => {
      const logger = createLogger({ level: "error" });
      logger.error("error message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("ERROR"),
      );
    });

    it("should use console.warn for warn level", () => {
      const logger = createLogger({ level: "warn" });
      logger.warn("warn message");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("WARN"),
      );
    });

    it("should use console.log for other levels", () => {
      const logger = createLogger({ level: "debug" });
      logger.info("info message");
      logger.debug("debug message");
      logger.success("success message");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("DEBUG"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("SUCCESS"),
      );
    });

    it("should use custom log function when provided", () => {
      const customLog = vi.fn();
      const logger = createLogger({
        log: customLog,
        level: "debug",
      });

      logger.info("test message", { data: "test" });

      expect(customLog).toHaveBeenCalledWith("info", "test message", {
        data: "test",
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should convert success level to info when using custom log function", () => {
      const customLog = vi.fn();
      const logger = createLogger({
        log: customLog,
        level: "debug",
      });

      logger.success("success message");

      expect(customLog).toHaveBeenCalledWith("info", "success message");
    });

    it("should format message with timestamp and colors", () => {
      const logger = createLogger({ level: "debug" });
      logger.info("test message");

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/); // ISO timestamp
      expect(call).toContain("INFO");
      expect(call).toContain("[BetterAuthMiddleware]:");
      expect(call).toContain("test message");
    });

    it("should handle additional arguments", () => {
      const logger = createLogger({ level: "debug" });
      const testData = { key: "value" };
      logger.info("test message", testData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("test message"),
        testData,
      );
    });

    it("should handle empty arguments", () => {
      const logger = createLogger({ level: "debug" });
      logger.info("test message");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("test message"),
      );
    });
  });

  describe("log levels", () => {
    it("should have correct log levels array", () => {
      expect(levels).toEqual(["info", "success", "warn", "error", "debug"]);
    });

    it("should create all log level methods", () => {
      const logger = createLogger();

      for (const level of levels) {
        expect(logger).toHaveProperty(level);
        expect(typeof logger[level]).toBe("function");
      }
    });
  });

  describe("message formatting", () => {
    it("should include timestamp in correct format", () => {
      const logger = createLogger({ level: "debug" });
      const beforeTime = new Date();

      logger.info("test");

      const afterTime = new Date();
      const logCall = consoleLogSpy.mock.calls[0][0];
      const timestampMatch = logCall.match(
        /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/,
      );

      expect(timestampMatch).toBeTruthy();
      if (timestampMatch) {
        const logTime = new Date(timestampMatch[1]);
        expect(logTime.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime() - 1000,
        );
        expect(logTime.getTime()).toBeLessThanOrEqual(
          afterTime.getTime() + 1000,
        );
      }
    });

    it("should include correct log level in uppercase", () => {
      const logger = createLogger({ level: "debug" });

      logger.info("test");
      expect(consoleLogSpy.mock.calls[0][0]).toContain("INFO");

      logger.debug("test");
      expect(consoleLogSpy.mock.calls[1][0]).toContain("DEBUG");
    });

    it("should include logger name in brackets", () => {
      const logger = createLogger({ name: "TestLogger", level: "debug" });
      logger.info("test");

      expect(consoleLogSpy.mock.calls[0][0]).toContain("[TestLogger]:");
    });
  });
});
