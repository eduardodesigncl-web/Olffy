import { describe, expect, it } from "vitest";
import type {
  CartItem as ShopifyCartLine,
  Product as ShopifyProduct,
  ProductVariant,
} from "lib/shopify/types";
import { toOlffyCartItems, toOlffyProduct } from "./mappers";

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "gid://shopify/ProductVariant/1",
    title: "Default Title",
    availableForSale: true,
    quantityAvailable: 5,
    selectedOptions: [{ name: "Title", value: "Default Title" }],
    price: { amount: "8990.0", currencyCode: "CLP" },
    ...overrides,
  };
}

function shopifyProduct(
  overrides: Partial<ShopifyProduct> = {},
): ShopifyProduct {
  return {
    id: "gid://shopify/Product/1",
    handle: "cuaderno-puntos",
    availableForSale: true,
    title: "Cuaderno Puntos",
    description: "Cuaderno punteado A5.",
    descriptionHtml: "<p>Cuaderno punteado A5.</p>",
    options: [{ id: "opt-1", name: "Title", values: ["Default Title"] }],
    priceRange: {
      maxVariantPrice: { amount: "8990.0", currencyCode: "CLP" },
      minVariantPrice: { amount: "8990.0", currencyCode: "CLP" },
    },
    variants: [variant()],
    featuredImage: {
      url: "https://cdn.shopify.com/img/cuaderno.jpg",
      altText: "Cuaderno",
      width: 800,
      height: 800,
    },
    images: [],
    seo: { title: "Cuaderno", description: "" },
    collections: [{ title: "Cuadernos", handle: "cuadernos" }],
    tags: [],
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("toOlffyProduct · inventario por variante", () => {
  it("usa el stock de la variante primaria, no la suma de variantes", () => {
    const product = toOlffyProduct(
      shopifyProduct({
        options: [{ id: "opt-1", name: "Color", values: ["Rojo", "Azul"] }],
        variants: [
          variant({
            id: "gid://shopify/ProductVariant/rojo",
            title: "Rojo",
            quantityAvailable: 3,
            selectedOptions: [{ name: "Color", value: "Rojo" }],
          }),
          variant({
            id: "gid://shopify/ProductVariant/azul",
            title: "Azul",
            quantityAvailable: 10,
            selectedOptions: [{ name: "Color", value: "Azul" }],
          }),
        ],
      }),
    );

    expect(product.variantId).toBe("gid://shopify/ProductVariant/rojo");
    expect(product.quantityAvailable).toBe(3);
  });

  it("no habilita una variante agotada por el stock de su hermana", () => {
    const product = toOlffyProduct(
      shopifyProduct({
        options: [{ id: "opt-1", name: "Color", values: ["Rojo", "Azul"] }],
        variants: [
          variant({
            id: "gid://shopify/ProductVariant/rojo",
            title: "Rojo",
            availableForSale: false,
            quantityAvailable: 0,
            selectedOptions: [{ name: "Color", value: "Rojo" }],
          }),
          variant({
            id: "gid://shopify/ProductVariant/azul",
            title: "Azul",
            availableForSale: false,
            quantityAvailable: 0,
            selectedOptions: [{ name: "Color", value: "Azul" }],
          }),
        ],
      }),
    );

    // Aunque la "suma" diera otra cosa, la variante mapeada está agotada.
    expect(product.availableForSale).toBe(false);
    expect(product.quantityAvailable).toBe(0);
    expect(product.tag).toBe("Agotado");
  });

  it("prefiere una variante disponible como variante por defecto", () => {
    const product = toOlffyProduct(
      shopifyProduct({
        options: [{ id: "opt-1", name: "Color", values: ["Rojo", "Azul"] }],
        variants: [
          variant({
            id: "gid://shopify/ProductVariant/rojo",
            title: "Rojo",
            availableForSale: false,
            quantityAvailable: 0,
            selectedOptions: [{ name: "Color", value: "Rojo" }],
          }),
          variant({
            id: "gid://shopify/ProductVariant/azul",
            title: "Azul",
            availableForSale: true,
            quantityAvailable: 7,
            selectedOptions: [{ name: "Color", value: "Azul" }],
          }),
        ],
      }),
    );

    expect(product.variantId).toBe("gid://shopify/ProductVariant/azul");
    expect(product.availableForSale).toBe(true);
    expect(product.quantityAvailable).toBe(7);
  });

  it("mantiene null cuando Shopify no expone cantidad (sin inventar 0)", () => {
    const product = toOlffyProduct(
      shopifyProduct({
        variants: [variant({ quantityAvailable: null })],
      }),
    );

    expect(product.quantityAvailable).toBeNull();
    expect(product.availableForSale).toBe(true);
  });

  it("marca agotado cuando la variante tiene stock 0", () => {
    const product = toOlffyProduct(
      shopifyProduct({
        variants: [variant({ availableForSale: false, quantityAvailable: 0 })],
      }),
    );

    expect(product.availableForSale).toBe(false);
    expect(product.tag).toBe("Agotado");
  });

  it("expone el resumen de variantes solo con opciones reales", () => {
    const single = toOlffyProduct(shopifyProduct());
    expect(single.variants).toBeUndefined();

    const multi = toOlffyProduct(
      shopifyProduct({
        options: [{ id: "opt-1", name: "Color", values: ["Rojo"] }],
        variants: [
          variant({
            title: "Rojo",
            selectedOptions: [{ name: "Color", value: "Rojo" }],
          }),
        ],
      }),
    );
    expect(multi.variants).toEqual([
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Rojo",
        availableForSale: true,
        quantityAvailable: 5,
        price: 8990,
        selectedOptions: [{ name: "Color", value: "Rojo" }],
      },
    ]);
  });
});

describe("toOlffyCartItems · disponibilidad real de la línea", () => {
  function cartLine(
    merchandise: Partial<ShopifyCartLine["merchandise"]> = {},
  ): ShopifyCartLine {
    return {
      id: "gid://shopify/CartLine/1",
      quantity: 2,
      cost: { totalAmount: { amount: "17980.0", currencyCode: "CLP" } },
      merchandise: {
        id: "gid://shopify/ProductVariant/1",
        title: "Rojo",
        availableForSale: true,
        quantityAvailable: 4,
        selectedOptions: [{ name: "Color", value: "Rojo" }],
        product: {
          id: "gid://shopify/Product/1",
          handle: "cuaderno-puntos",
          title: "Cuaderno Puntos",
          featuredImage: {
            url: "https://cdn.shopify.com/img/cuaderno.jpg",
            altText: "Cuaderno",
            width: 800,
            height: 800,
          },
        },
        ...merchandise,
      },
    };
  }

  const cart = (lines: ShopifyCartLine[]) => ({
    id: "gid://shopify/Cart/1",
    checkoutUrl: "https://olffy.cl/checkout",
    discountCodes: [],
    cost: {
      subtotalAmount: { amount: "17980.0", currencyCode: "CLP" },
      totalAmount: { amount: "17980.0", currencyCode: "CLP" },
      totalTaxAmount: { amount: "0.0", currencyCode: "CLP" },
    },
    lines,
    totalQuantity: 2,
  });

  it("mapea disponibilidad y stock reales de la variante de la línea", () => {
    const [item] = toOlffyCartItems(cart([cartLine()]));
    expect(item!.availableForSale).toBe(true);
    expect(item!.quantityAvailable).toBe(4);
    expect(item!.variantId).toBe("gid://shopify/ProductVariant/1");
  });

  it("no hardcodea availableForSale cuando la variante ya no está disponible", () => {
    const [item] = toOlffyCartItems(
      cart([cartLine({ availableForSale: false, quantityAvailable: 0 })]),
    );
    expect(item!.availableForSale).toBe(false);
    expect(item!.quantityAvailable).toBe(0);
  });

  it("mantiene null cuando la línea no informa cantidad", () => {
    const [item] = toOlffyCartItems(
      cart([cartLine({ quantityAvailable: undefined })]),
    );
    expect(item!.quantityAvailable).toBeNull();
  });
});
