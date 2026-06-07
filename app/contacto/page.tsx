import { SiteFooter } from "components/olffy/site-footer";

const faqs = [
  "Cuanto tarda mi pedido?",
  "Puedo retirar en tienda?",
  "Hacen cambios o devoluciones?",
  "Como contacto por mayor?",
];

export const metadata = {
  title: "Contacto",
};

export default function ContactPage() {
  return (
    <>
      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-olffy-purple">
              Hablemos
            </p>
            <h1 className="mt-4 font-brand text-5xl font-black leading-none text-olffy-ink md:text-7xl">
              Contacto Olffy
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-olffy-muted">
              Estamos en Viña del Mar y tambien respondemos por redes sociales
              para ayudarte a elegir, regalar o resolver dudas.
            </p>
            <div className="mt-8 space-y-3 rounded-[8px] border-2 border-olffy-ink bg-white p-6">
              <p>
                <strong>Direccion:</strong> Viña del Mar, Chile
              </p>
              <p>
                <strong>Horario:</strong> Lunes a sabado, 10:30 a 19:00
              </p>
              <p>
                <strong>Email:</strong> hola@olffy.cl
              </p>
              <p>
                <strong>Instagram:</strong> @olffy.cl
              </p>
            </div>
          </div>
          <form className="rounded-[8px] border-2 border-olffy-ink bg-olffy-cream p-6 md:p-8">
            <div className="grid gap-5">
              <label className="grid gap-2 font-brand font-black">
                Nombre
                <input className="h-12 rounded-[6px] border-2 border-olffy-ink bg-white px-4 font-sans font-normal" />
              </label>
              <label className="grid gap-2 font-brand font-black">
                Email
                <input
                  type="email"
                  className="h-12 rounded-[6px] border-2 border-olffy-ink bg-white px-4 font-sans font-normal"
                />
              </label>
              <label className="grid gap-2 font-brand font-black">
                Mensaje
                <textarea className="min-h-36 rounded-[6px] border-2 border-olffy-ink bg-white p-4 font-sans font-normal" />
              </label>
              <button className="h-12 rounded-[6px] bg-olffy-ink font-brand font-black text-white">
                Enviar mensaje
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-brand text-3xl font-black text-olffy-ink">
            Preguntas frecuentes
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq}
                className="rounded-[8px] border-2 border-olffy-ink bg-white p-5"
              >
                <summary className="cursor-pointer font-brand font-black">
                  {faq}
                </summary>
                <p className="mt-3 text-sm leading-6 text-olffy-muted">
                  Esta informacion se conectara a las politicas finales de la
                  tienda en la siguiente etapa.
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
