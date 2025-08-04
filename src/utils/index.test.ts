import { describe, expect, it } from "vitest";

describe("Utils exports", () => {
  it("should export SessionCache", async () => {
    const { SessionCache } = await import("./index");
    expect(SessionCache).toBeDefined();
    expect(typeof SessionCache).toBe("function");
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
  });

  it("should export all utilities", async () => {
    const utils = await import("./index");
    expect(Object.keys(utils)).toEqual(
      expect.arrayContaining([
        "SessionCache",
        "createErrorResponse",
        "createLogger",
      ]),
    );
  });
});
