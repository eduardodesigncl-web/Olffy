import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import { formatPrice } from "components/olffy/data";
import { getOlffyProducts } from "components/olffy/shopify-products";
import { SiteFooter } from "components/olffy/site-footer";

export const metadata = {
  title: "Carrito",
};

export default async function CartPage() {
  const cartItems = (await getOlffyProducts())
    .slice(0, 4)
    .map((product, index) => ({
      product,
      quantity: index === 1 ? 2 : 1,
    }));
  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const shipping = 2990;
  const total = subtotal + shipping;

  return (
    <>
      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <h1 className="font-brand text-5xl font-black text-olffy-ink">
              Carrito de compra
            </h1>
            <div className="mt-8 divide-y-2 divide-olffy-ink border-y-2 border-olffy-ink">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="grid gap-5 py-6 sm:grid-cols-[160px_1fr_auto]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[6px] border-2 border-olffy-ink">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-brand text-2xl font-black">
                      {item.product.name}
                    </h2>
                    <p className="mt-1 font-semibold">
                      {formatPrice(item.product.price)}
                    </p>
                    <p className="mt-3 text-sm text-olffy-muted">
                      Tamaño / formato unico
                    </p>
                    <div className="mt-8 inline-flex h-10 items-center rounded-[6px] border-2 border-olffy-ink bg-white font-brand font-black">
                      <button className="h-full px-4">-</button>
                      <span className="px-3">{item.quantity}</span>
                      <button className="h-full px-4">+</button>
                    </div>
                  </div>
                  <button aria-label="Eliminar producto" className="self-end">
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <aside className="h-max rounded-[8px] border-2 border-olffy-ink bg-white p-6">
            <h2 className="font-brand text-3xl font-black text-olffy-ink">
              Resumen del pedido
            </h2>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Envio estimado</span>
                <strong>{formatPrice(shipping)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Descuento</span>
                <strong>{formatPrice(0)}</strong>
              </div>
              <div className="flex justify-between border-t-2 border-olffy-ink pt-4 text-lg">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <button className="mt-8 h-12 w-full rounded-[6px] bg-olffy-ink font-brand font-black text-white">
              Finalizar compra
            </button>
            <div className="mt-8 border-t-2 border-olffy-ink pt-5">
              <label className="font-brand text-sm font-black">
                Codigo de descuento
              </label>
              <div className="mt-2 flex gap-3">
                <input className="h-11 min-w-0 flex-1 rounded-[6px] border-2 border-olffy-ink px-3" />
                <button className="rounded-[6px] bg-olffy-ink px-4 font-brand font-black text-white">
                  Aplicar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
