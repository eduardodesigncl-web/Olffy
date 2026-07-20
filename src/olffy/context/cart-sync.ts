// Motor de sincronización del carrito optimista OLFFY. Sin React: recibe
// las acciones de servidor y callbacks, y es testeable con timers falsos.
//
// Modelo: cada variante (merchandiseId) tiene a lo más UNA operación activa
// con una cantidad objetivo absoluta (0 = eliminar). Los clics rápidos se
// coalescen durante una ventana corta (no confundir con el debounce de
// 2,5 s del buscador) y por variante nunca hay dos solicitudes en vuelo:
// si el objetivo cambia mientras una viaja, al volver se reenvía la última
// cantidad. Eso hace imposibles las respuestas fuera de orden por variante
// y, junto al versionado, ninguna respuesta vieja pisa un estado nuevo.
import type { CartItem, CartMutationResult, Product } from "../types";

export const CART_COALESCE_MS = 200;

// Las líneas creadas de forma optimista todavía no existen en Shopify;
// se identifican con este prefijo hasta que llegue la reconciliación.
export const PENDING_PREFIX = "pending:";

export interface CartSyncServerActions {
  addLines(input: {
    merchandiseId: string;
    quantity: number;
  }): Promise<CartMutationResult>;
  setLineQuantity(input: {
    lineId: string;
    merchandiseId: string;
    quantity: number;
  }): Promise<CartMutationResult>;
  removeLine(lineId: string): Promise<CartMutationResult>;
}

export interface CartSyncCallbacks {
  onItems(items: CartItem[]): void;
  onPending(pendingVariantIds: string[]): void;
  onError(error: { code: string; message: string }): void;
}

interface VariantOp {
  merchandiseId: string;
  target: number; // cantidad objetivo absoluta; 0 = eliminar
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
  // Versión de la intención del usuario: si cambió mientras la solicitud
  // viajaba, la respuesta no cierra la operación y se reenvía el último
  // objetivo.
  version: number;
  sentVersion: number;
}

export interface CartSyncEngine {
  hydrate(items: CartItem[]): void;
  getItems(): CartItem[];
  add(product: Product, qty?: number): void;
  increment(lineId: string): void;
  decrement(lineId: string): void;
  remove(lineId: string): void;
  clear(): void;
  hasPendingOps(): boolean;
  // Fuerza el envío de lo coalescido y espera a que todo termine (se usa
  // antes de checkout para nunca enviar un carrito antiguo).
  flush(): Promise<void>;
}

export function createCartSyncEngine(
  actions: CartSyncServerActions,
  callbacks: CartSyncCallbacks,
  coalesceMs: number = CART_COALESCE_MS,
): CartSyncEngine {
  let items: CartItem[] = [];
  const ops = new Map<string, VariantOp>();
  // Última verdad confirmada por Shopify, para rollback ante fallas duras.
  let baseline = new Map<string, { qty: number; lineId: string }>();
  let flushWaiters: (() => void)[] = [];

  const emitItems = () => callbacks.onItems([...items]);
  const emitPending = () => callbacks.onPending([...ops.keys()]);

  const notifyIfIdle = () => {
    if (ops.size === 0) {
      const waiters = flushWaiters;
      flushWaiters = [];
      waiters.forEach((resolve) => resolve());
    }
  };

  const finishOp = (variantId: string) => {
    ops.delete(variantId);
    emitPending();
    notifyIfIdle();
  };

  const realLineIdFor = (variantId: string): string | null => {
    const item = items.find((i) => i.variantId === variantId);
    if (item && !item.lineId.startsWith(PENDING_PREFIX)) return item.lineId;
    return baseline.get(variantId)?.lineId ?? null;
  };

  // Integra el carrito devuelto por el servidor conservando el estado
  // optimista de las variantes que aún tienen operaciones activas.
  const mergeServer = (serverItems: CartItem[]) => {
    baseline = new Map(
      serverItems.map((item) => [
        item.variantId,
        { qty: item.qty, lineId: item.lineId },
      ]),
    );

    const merged: CartItem[] = [];
    for (const server of serverItems) {
      const op = ops.get(server.variantId);
      if (op) {
        if (op.target === 0) continue; // eliminación local en curso
        merged.push({ ...server, qty: op.target });
        continue;
      }
      merged.push(server);
    }

    // Líneas optimistas todavía no presentes en el carrito del servidor.
    for (const local of items) {
      if (merged.some((item) => item.variantId === local.variantId)) continue;
      const op = ops.get(local.variantId);
      if (op && op.target > 0) merged.push(local);
    }

    items = merged;
    emitItems();
  };

  const rollbackVariant = (variantId: string) => {
    const base = baseline.get(variantId);
    if (base) {
      items = items.map((item) =>
        item.variantId === variantId
          ? { ...item, qty: base.qty, lineId: base.lineId }
          : item,
      );
    } else {
      items = items.filter((item) => item.variantId !== variantId);
    }
    emitItems();
  };

  const send = async (variantId: string): Promise<void> => {
    const op = ops.get(variantId);
    if (!op || op.inFlight) return;

    const lineId = realLineIdFor(variantId);
    const target = op.target;
    op.sentVersion = op.version;

    // Línea pendiente que el usuario eliminó antes de crearse en Shopify:
    // no hay nada que mutar.
    if (!lineId && target <= 0) {
      finishOp(variantId);
      return;
    }

    op.inFlight = true;
    let result: CartMutationResult;
    try {
      if (!lineId) {
        result = await actions.addLines({
          merchandiseId: op.merchandiseId,
          quantity: target,
        });
      } else if (target <= 0) {
        result = await actions.removeLine(lineId);
      } else {
        result = await actions.setLineQuantity({
          lineId,
          merchandiseId: op.merchandiseId,
          quantity: target,
        });
      }
    } catch (error) {
      console.error("Mutación de carrito no respondió", error);
      result = {
        ok: false,
        items: null,
        code: "NETWORK_ERROR",
        message: "No pudimos actualizar el carrito. Intenta nuevamente.",
      };
    }
    op.inFlight = false;

    const stale = op.version !== op.sentVersion;

    if (stale) {
      // El objetivo cambió mientras la solicitud viajaba: se adopta lo que
      // sirva de la respuesta (lineId real, stock) sin cerrar la operación
      // y se reenvía la última cantidad de inmediato.
      if (result.items) mergeServer(result.items);
      void send(variantId);
      return;
    }

    if (result.ok) {
      finishOp(variantId);
      mergeServer(result.items);
      return;
    }

    // Error: reconciliar con el carrito real si vino; si no, rollback al
    // último estado confirmado. Siempre se comunica el motivo.
    finishOp(variantId);
    if (result.items) {
      mergeServer(result.items);
    } else {
      rollbackVariant(variantId);
    }
    callbacks.onError({ code: result.code, message: result.message });
  };

  const schedule = (
    variantId: string,
    merchandiseId: string,
    target: number,
  ) => {
    let op = ops.get(variantId);
    if (!op) {
      op = {
        merchandiseId,
        target,
        timer: null,
        inFlight: false,
        version: 0,
        sentVersion: 0,
      };
      ops.set(variantId, op);
      emitPending();
    }
    op.target = target;
    op.version += 1;

    if (op.inFlight) return; // al volver la respuesta se reenvía
    if (op.timer !== null) return; // ya hay una ventana de coalescing

    op.timer = setTimeout(() => {
      op.timer = null;
      void send(variantId);
    }, coalesceMs);
  };

  // Tope local: nunca superar el stock conocido de la variante. La
  // validación final sigue siendo del servidor.
  const capFor = (item: Pick<CartItem, "quantityAvailable">): number | null =>
    typeof item.quantityAvailable === "number" ? item.quantityAvailable : null;

  const setLocalQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      items = items.filter((item) => item.variantId !== variantId);
    } else {
      items = items.map((item) =>
        item.variantId === variantId ? { ...item, qty } : item,
      );
    }
    emitItems();
  };

  return {
    hydrate(serverItems: CartItem[]) {
      // Si hay mutaciones en curso, esta lectura inicial ya está vieja: la
      // reconciliación la hará la respuesta de la última operación.
      if (ops.size > 0) return;
      items = serverItems;
      baseline = new Map(
        serverItems.map((item) => [
          item.variantId,
          { qty: item.qty, lineId: item.lineId },
        ]),
      );
      emitItems();
    },

    getItems: () => [...items],

    add(product: Product, qty: number = 1) {
      const variantId = product.variantId;
      if (!variantId || qty <= 0) return;

      const existing = items.find((item) => item.variantId === variantId);
      const cap = capFor(existing ?? product);
      let target = (existing?.qty ?? 0) + qty;
      if (cap !== null) target = Math.min(target, cap);
      if (target <= 0 || target === existing?.qty) return;

      if (existing) {
        setLocalQty(variantId, target);
      } else {
        items = [
          ...items,
          { ...product, qty: target, lineId: `${PENDING_PREFIX}${variantId}` },
        ];
        emitItems();
      }
      schedule(variantId, variantId, target);
    },

    increment(lineId: string) {
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
      const cap = capFor(item);
      const target = cap !== null ? Math.min(item.qty + 1, cap) : item.qty + 1;
      if (target === item.qty) return; // tope de stock alcanzado
      setLocalQty(item.variantId, target);
      schedule(item.variantId, item.variantId, target);
    },

    decrement(lineId: string) {
      const item = items.find((i) => i.lineId === lineId);
      if (!item || item.qty <= 1) return;
      const target = item.qty - 1;
      setLocalQty(item.variantId, target);
      schedule(item.variantId, item.variantId, target);
    },

    remove(lineId: string) {
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
      setLocalQty(item.variantId, 0);
      schedule(item.variantId, item.variantId, 0);
    },

    clear() {
      for (const op of ops.values()) {
        if (op.timer !== null) clearTimeout(op.timer);
      }
      ops.clear();
      items = [];
      emitItems();
      emitPending();
      notifyIfIdle();
    },

    hasPendingOps: () => ops.size > 0,

    flush() {
      for (const [variantId, op] of ops) {
        if (op.timer !== null) {
          clearTimeout(op.timer);
          op.timer = null;
          void send(variantId);
        }
      }
      if (ops.size === 0) return Promise.resolve();
      return new Promise((resolve) => {
        flushWaiters.push(resolve);
      });
    },
  };
}
