import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem, CartMutationResult, Product } from "../types";
import {
  CART_COALESCE_MS,
  createCartSyncEngine,
  PENDING_PREFIX,
} from "./cart-sync";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "gid://shopify/Product/1",
    handle: "cuaderno-puntos",
    name: "Cuaderno Puntos",
    cat: "Cuadernos",
    price: "$8.990",
    n: 8990,
    tag: "",
    bg: "#fff",
    colors: [],
    specs: [],
    bundle: null,
    desc: "",
    variantId: "variant-1",
    availableForSale: true,
    quantityAvailable: null,
    ...overrides,
  };
}

function serverItem(
  variantId: string,
  qty: number,
  overrides: Partial<CartItem> = {},
): CartItem {
  return {
    ...product({ variantId }),
    qty,
    lineId: `line-${variantId}`,
    ...overrides,
  };
}

const ok = (items: CartItem[]): CartMutationResult => ({ ok: true, items });

type Deferred = {
  resolve: (result: CartMutationResult) => void;
  promise: Promise<CartMutationResult>;
};

function deferred(): Deferred {
  let resolve!: (result: CartMutationResult) => void;
  const promise = new Promise<CartMutationResult>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}

function setup(coalesceMs = CART_COALESCE_MS) {
  const actions = {
    addLines:
      vi.fn<
        (input: {
          merchandiseId: string;
          quantity: number;
        }) => Promise<CartMutationResult>
      >(),
    setLineQuantity:
      vi.fn<
        (input: {
          lineId: string;
          merchandiseId: string;
          quantity: number;
        }) => Promise<CartMutationResult>
      >(),
    removeLine: vi.fn<(lineId: string) => Promise<CartMutationResult>>(),
  };
  const onItems = vi.fn<(items: CartItem[]) => void>();
  const onPending = vi.fn<(ids: string[]) => void>();
  const onError = vi.fn<(error: { code: string; message: string }) => void>();
  const engine = createCartSyncEngine(
    actions,
    { onItems, onPending, onError },
    coalesceMs,
  );
  return { engine, actions, onItems, onPending, onError };
}

const flushWindow = () => vi.advanceTimersByTimeAsync(CART_COALESCE_MS + 10);

describe("cart-sync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("agrega un producto de forma optimista e inmediata y reconcilia el lineId real", async () => {
    const { engine, actions } = setup();
    actions.addLines.mockResolvedValue(ok([serverItem("variant-1", 1)]));

    engine.add(product());

    // Respuesta visual inmediata, antes de cualquier red.
    expect(engine.getItems()).toHaveLength(1);
    expect(engine.getItems()[0]!.lineId).toBe(`${PENDING_PREFIX}variant-1`);
    expect(actions.addLines).not.toHaveBeenCalled();

    await flushWindow();

    expect(actions.addLines).toHaveBeenCalledExactlyOnceWith({
      merchandiseId: "variant-1",
      quantity: 1,
    });
    expect(engine.getItems()[0]!.lineId).toBe("line-variant-1");
    expect(engine.hasPendingOps()).toBe(false);
  });

  it("coalesce cinco clics rápidos en una sola mutación con la cantidad final", async () => {
    const { engine, actions } = setup();
    actions.setLineQuantity.mockResolvedValue(ok([serverItem("variant-1", 6)]));
    engine.hydrate([serverItem("variant-1", 1)]);

    for (let i = 0; i < 5; i++) engine.increment("line-variant-1");

    // Optimista: 6 al instante, sin llamadas todavía.
    expect(engine.getItems()[0]!.qty).toBe(6);
    expect(actions.setLineQuantity).not.toHaveBeenCalled();

    await flushWindow();

    expect(actions.setLineQuantity).toHaveBeenCalledExactlyOnceWith({
      lineId: "line-variant-1",
      merchandiseId: "variant-1",
      quantity: 6,
    });
    expect(engine.getItems()[0]!.qty).toBe(6);
  });

  it("persiste los incrementos hechos sobre una línea pending", async () => {
    const { engine, actions } = setup();
    const addResponse = deferred();
    actions.addLines.mockReturnValue(addResponse.promise);
    actions.setLineQuantity.mockResolvedValue(ok([serverItem("variant-1", 3)]));

    engine.add(product());
    await flushWindow(); // addLines(1) en vuelo

    // Dos clics más mientras la línea todavía es pending.
    engine.increment(`${PENDING_PREFIX}variant-1`);
    engine.increment(`${PENDING_PREFIX}variant-1`);
    expect(engine.getItems()[0]!.qty).toBe(3);

    // Vuelve el add: la operación quedó vieja (target cambió) → se reenvía
    // la cantidad objetivo con el lineId real recién aprendido.
    addResponse.resolve(ok([serverItem("variant-1", 1)]));
    await vi.advanceTimersByTimeAsync(0);

    expect(actions.setLineQuantity).toHaveBeenCalledExactlyOnceWith({
      lineId: "line-variant-1",
      merchandiseId: "variant-1",
      quantity: 3,
    });
    expect(engine.getItems()[0]!.qty).toBe(3);
    expect(engine.hasPendingOps()).toBe(false);
  });

  it("no deja que una respuesta vieja pise la cantidad optimista más nueva", async () => {
    const { engine, actions } = setup();
    const first = deferred();
    actions.setLineQuantity
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(ok([serverItem("variant-1", 4)]));
    engine.hydrate([serverItem("variant-1", 1)]);

    engine.increment("line-variant-1"); // objetivo 2
    await flushWindow(); // setLineQuantity(2) en vuelo

    engine.increment("line-variant-1"); // objetivo 3
    engine.increment("line-variant-1"); // objetivo 4
    expect(engine.getItems()[0]!.qty).toBe(4);

    // La respuesta del objetivo 2 llega tarde: NO debe bajar la UI a 2.
    first.resolve(ok([serverItem("variant-1", 2)]));
    await vi.advanceTimersByTimeAsync(0);
    expect(engine.getItems()[0]!.qty).toBe(4);

    await vi.advanceTimersByTimeAsync(0);
    expect(actions.setLineQuantity).toHaveBeenLastCalledWith({
      lineId: "line-variant-1",
      merchandiseId: "variant-1",
      quantity: 4,
    });
    expect(engine.getItems()[0]!.qty).toBe(4);
  });

  it("actualiza dos líneas simultáneas sin bloquearse entre sí", async () => {
    const { engine, actions } = setup();
    actions.setLineQuantity.mockImplementation(async ({ merchandiseId }) =>
      merchandiseId === "variant-1"
        ? ok([serverItem("variant-1", 2), serverItem("variant-2", 1)])
        : ok([serverItem("variant-1", 2), serverItem("variant-2", 2)]),
    );
    engine.hydrate([serverItem("variant-1", 1), serverItem("variant-2", 1)]);

    engine.increment("line-variant-1");
    engine.increment("line-variant-2");
    await flushWindow();

    expect(actions.setLineQuantity).toHaveBeenCalledTimes(2);
    const quantities = engine.getItems().map((item) => item.qty);
    expect(quantities).toEqual([2, 2]);
  });

  it("revierte al último estado confirmado y avisa cuando la red falla", async () => {
    const { engine, actions, onError } = setup();
    actions.setLineQuantity.mockRejectedValue(new Error("offline"));
    engine.hydrate([serverItem("variant-1", 2)]);

    engine.increment("line-variant-1");
    expect(engine.getItems()[0]!.qty).toBe(3);

    await flushWindow();

    // Rollback al snapshot confirmado + mensaje visible.
    expect(engine.getItems()[0]!.qty).toBe(2);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ code: "NETWORK_ERROR" }),
    );
  });

  it("reconcilia con el carrito real cuando el stock es insuficiente", async () => {
    const { engine, actions, onError } = setup();
    actions.setLineQuantity.mockResolvedValue({
      ok: false,
      items: [serverItem("variant-1", 2, { quantityAvailable: 2 })],
      code: "INSUFFICIENT_STOCK",
      message: "Solo quedan 2 unidades. Ajustamos la cantidad disponible.",
    });
    engine.hydrate([serverItem("variant-1", 3)]);

    engine.increment("line-variant-1"); // pide 4, quedan 2
    await flushWindow();

    expect(engine.getItems()[0]!.qty).toBe(2);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ code: "INSUFFICIENT_STOCK" }),
    );
  });

  it("no supera el stock conocido de la variante", async () => {
    const { engine, actions } = setup();
    engine.hydrate([serverItem("variant-1", 2, { quantityAvailable: 2 })]);

    engine.increment("line-variant-1");

    expect(engine.getItems()[0]!.qty).toBe(2);
    await flushWindow();
    expect(actions.setLineQuantity).not.toHaveBeenCalled();
  });

  it("elimina una línea pending sin llamar al servidor si aún no se creó", async () => {
    const { engine, actions } = setup();
    actions.addLines.mockResolvedValue(ok([serverItem("variant-1", 1)]));

    engine.add(product());
    engine.remove(`${PENDING_PREFIX}variant-1`);
    expect(engine.getItems()).toHaveLength(0);

    await flushWindow();
    expect(actions.addLines).not.toHaveBeenCalled();
    expect(actions.removeLine).not.toHaveBeenCalled();
    expect(engine.hasPendingOps()).toBe(false);
  });

  it("flush envía lo coalescido de inmediato y espera la confirmación", async () => {
    const { engine, actions } = setup();
    const response = deferred();
    actions.setLineQuantity.mockReturnValue(response.promise);
    engine.hydrate([serverItem("variant-1", 1)]);

    engine.increment("line-variant-1");
    expect(actions.setLineQuantity).not.toHaveBeenCalled();

    let flushed = false;
    const flushPromise = engine.flush().then(() => {
      flushed = true;
    });

    // El flush dispara la mutación sin esperar la ventana de coalescing…
    await vi.advanceTimersByTimeAsync(0);
    expect(actions.setLineQuantity).toHaveBeenCalledTimes(1);
    expect(flushed).toBe(false);

    // …y solo resuelve cuando Shopify confirmó.
    response.resolve(ok([serverItem("variant-1", 2)]));
    await vi.advanceTimersByTimeAsync(0);
    await flushPromise;
    expect(flushed).toBe(true);
    expect(engine.hasPendingOps()).toBe(false);
  });

  it("una lectura inicial tardía no pisa mutaciones en curso", async () => {
    const { engine, actions } = setup();
    actions.setLineQuantity.mockResolvedValue(ok([serverItem("variant-1", 2)]));
    engine.hydrate([serverItem("variant-1", 1)]);

    engine.increment("line-variant-1");
    // Llega una hidratación vieja (por ejemplo, la carga inicial demorada).
    engine.hydrate([serverItem("variant-1", 1)]);
    expect(engine.getItems()[0]!.qty).toBe(2);

    await flushWindow();
    expect(engine.getItems()[0]!.qty).toBe(2);
  });
});
