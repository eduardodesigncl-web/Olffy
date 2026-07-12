import { describe, expect, it } from "vitest";

describe("Phase 0 CI control", () => {
  it("fails only for the controlled CI validation", () => {
    expect("ci-detects-errors").toBe("controlled-failure");
  });
});
