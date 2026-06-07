import Link from "next/link";
import { OlffyLogo } from "./brand-logo";

const footerGroups = [
  {
    title: "Tienda",
    links: ["Agendas", "Cuadernos", "Stickers", "Regalos"],
  },
  {
    title: "Ayuda",
    links: ["Envios", "Cambios", "Medios de pago", "Preguntas frecuentes"],
  },
  {
    title: "Olffy",
    links: ["Nuestra historia", "Contacto", "Comunidad", "Viña del Mar"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-olffy-ink bg-white px-5 py-12 text-olffy-ink">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_2fr_1.4fr]">
        <div>
          <OlffyLogo compact />
          <p className="mt-4 max-w-xs text-sm leading-6 text-olffy-muted">
            Papeleria chilena hecha con amor, para artistas, estudiantes y
            personas que guardan ideas en papel.
          </p>
          <div className="mt-5 flex gap-4 text-sm font-bold text-olffy-muted">
            <span>f</span>
            <span>ig</span>
            <span>x</span>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-brand text-lg font-black">{group.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-olffy-muted">
                {group.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="hover:text-olffy-orange">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-brand text-lg font-black">Newsletter</h3>
          <p className="mt-4 text-sm leading-6 text-olffy-muted">
            Una dosis de creatividad, lanzamientos y regalos bonitos.
          </p>
          <form className="mt-5 flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-[6px] border-2 border-olffy-ink px-3 text-sm"
              placeholder="Email"
              type="email"
            />
            <button className="h-10 rounded-[6px] bg-olffy-ink px-4 font-brand text-sm font-black text-white">
              Suscribirse
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
