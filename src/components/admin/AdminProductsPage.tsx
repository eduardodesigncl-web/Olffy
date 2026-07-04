// @ts-nocheck
import { useState } from "react";
import { Search, Package } from "lucide-react";
import type { Product } from "../../contracts/product.types";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#16a34a" },
  draft: { bg: "#f3f4f6", text: "#6b7280" },
  archived: { bg: "#fee2e2", text: "#dc2626" },
};

interface AdminProductsPageProps {
  products: Product[];
}

export function AdminProductsPage({ products }: AdminProductsPageProps) {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[26px] text-black/80"
            style={{ fontFamily: T.piepie }}
          >
            Productos
          </h2>
          <p
            className="text-[14px] text-black/40 mt-1"
            style={{ fontFamily: T.poppins }}
          >
            Sincronizado con Shopify Admin API
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl text-white text-[13px] flex items-center gap-1.5"
          style={{ fontFamily: T.poppins, background: C.orange }}
          data-action="sync-shopify-products"
        >
          <Package size={14} />
          Sincronizar
        </button>
      </div>
      <div className="relative">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
        />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
          style={{ fontFamily: T.poppins }}
          data-bind="shopify-admin-products"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Producto", "Categoría", "Precio", "Stock", "Estado"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[12px] uppercase tracking-wider text-black/35 border-b border-black/8"
                    style={{ fontFamily: T.poppins }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const statusCfg =
                STATUS_CONFIG[p.status ?? "active"] ?? STATUS_CONFIG.active;
              return (
                <tr
                  key={p.id}
                  className="border-b border-black/5 hover:bg-black/2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p
                      className="text-[14px] text-black/75"
                      style={{ fontFamily: T.poppins }}
                    >
                      {p.title}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[12px] text-black/40 bg-black/5 px-2 py-0.5 rounded"
                      style={{ fontFamily: T.poppins }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[14px] text-black/70"
                      style={{ fontFamily: T.poppins }}
                    >
                      ${p.price.toLocaleString("es-CL")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[14px]"
                      style={{
                        fontFamily: T.poppins,
                        color: (p.stock ?? 0) > 5 ? "#16a34a" : "#d97706",
                      }}
                    >
                      {p.stock ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{
                        fontFamily: T.poppins,
                        background: statusCfg.bg,
                        color: statusCfg.text,
                      }}
                    >
                      {p.status ?? "active"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p
            className="text-center text-[14px] text-black/30 py-8"
            style={{ fontFamily: T.poppins }}
          >
            Sin resultados
          </p>
        )}
      </div>
    </div>
  );
}
