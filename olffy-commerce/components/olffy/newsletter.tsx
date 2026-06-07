export function NewsletterBand() {
  return (
    <section className="bg-olffy-purple px-5 py-20 text-center text-white">
      <p className="font-brand text-2xl font-black">Unete a la comunidad Olffy</p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
        Recibe lanzamientos, descuentos y colaboraciones con artistas chilenos.
      </p>
      <form className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="tu@email.cl"
          className="h-11 flex-1 rounded-[6px] border-2 border-white bg-white px-4 text-sm text-olffy-ink placeholder:text-neutral-400"
        />
        <button className="h-11 rounded-[6px] bg-olffy-ink px-6 font-brand text-sm font-black text-white">
          Suscribirse
        </button>
      </form>
      <div className="mt-8 flex items-center justify-center gap-5 text-sm font-bold">
        <span>Facebook</span>
        <span>Instagram</span>
        <span>X</span>
      </div>
    </section>
  );
}
