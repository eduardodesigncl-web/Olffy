import { describe, expect, it } from "vitest";

describe("Phase 0 CI control", () => {
  it("passes after the controlled failure is corrected", () => {
    expect("ci-detects-errors").toBe("ci-detects-errors");
  });
});
