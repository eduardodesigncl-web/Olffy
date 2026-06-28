import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  createTuuSignature,
  verifyTuuSignature,
} from "./signature";

describe("TUU signatures", () => {
  it("canonicalizes object keys recursively", () => {
    expect(
      canonicalJson({ z: 1, nested: { b: 2, a: 1 }, a: [{ y: 2, x: 1 }] }),
    ).toBe('{"a":[{"x":1,"y":2}],"nested":{"a":1,"b":2},"z":1}');
  });

  it("accepts a valid signature inside the tolerance window", () => {
    const payload = { reference: "OLFFY-1", amount: 12_990 };
    const timestamp = "1781964000";
    const secret = "test-secret";
    const signature = createTuuSignature({ payload, timestamp, secret });

    expect(
      verifyTuuSignature({
        payload,
        timestamp,
        secret,
        signature,
        now: 1_781_964_000_000,
      }),
    ).toBe(true);
  });

  it("rejects altered payloads and stale callbacks", () => {
    const payload = { reference: "OLFFY-1", amount: 12_990 };
    const timestamp = "1781964000";
    const secret = "test-secret";
    const signature = createTuuSignature({ payload, timestamp, secret });

    expect(
      verifyTuuSignature({
        payload: { ...payload, amount: 1 },
        timestamp,
        secret,
        signature,
        now: 1_781_964_000_000,
      }),
    ).toBe(false);
    expect(
      verifyTuuSignature({
        payload,
        timestamp,
        secret,
        signature,
        now: 1_781_965_000_000,
      }),
    ).toBe(false);
  });
});
