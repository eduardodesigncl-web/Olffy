import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(name: string) {
  return readFileSync(new URL(name, import.meta.url), "utf8");
}

describe("admin mock action containment", () => {
  it("keeps reward mutations visibly disabled", () => {
    const card = source("./AdminRewardCard.tsx");
    const requests = source("./AdminRewardRequests.tsx");

    expect(card).not.toContain("onMockAction");
    expect(card.match(/disabled/g)?.length).toBeGreaterThanOrEqual(3);
    expect(requests).not.toContain("onMockAction");
    expect(requests.match(/disabled/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("does not persist a fake team or featured products locally", () => {
    const team = source("./AdminTeamSettings.tsx");
    const products = source("./AdminProducts.tsx");

    expect(team).not.toMatch(/localStorage|SEED_TEAM|<form/);
    expect(products).not.toMatch(
      /FEATURED_STORAGE_KEY|localStorage|handleToggleFeatured/,
    );
    expect(products).not.toContain("Catálogo actualizado desde Shopify");
  });

  it("does not expose mock or featured catalog filters", () => {
    const filters = source("./AdminProductFilters.tsx");
    expect(filters).not.toContain('id: "mock"');
    expect(filters).not.toContain('id: "featured"');
  });
});
