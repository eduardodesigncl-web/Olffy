import { ImageSlot } from "components/olffy/image-slot";
import { OlffyStorefront } from "src/olffy/integration/shell";
import type { ReactNode } from "react";

export const metadata = {
  title: "Nuestra historia",
};

export default function StoryPage() {
  return (
    <OlffyStorefront>
      <section className="mx-auto max-w-[1240px] px-4 py-[clamp(36px,4.5vw,56px)] lg:px-12">
        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
          NUESTRA HISTORIA
        </div>
        <h1 className="mb-3.5 font-brand text-[clamp(38px,6.5vw,76px)] font-black leading-[0.9] tracking-[-0.03em] text-olffy-ink">
          Conoce
          <br />
          <span className="text-olffy-purple">OLFFY®</span>
        </h1>
        <p className="mb-10 max-w-[580px] text-[clamp(15px,1.7vw,18px)] leading-[1.7] text-olffy-ink/70">
          Papelería ilustrada hecha a mano, pensada para organizar, crear y
          regalar con mucha magia.
        </p>

        <div className="mb-12 rounded-[22px] bg-olffy-purple p-2.5 shadow-[0_20px_44px_rgba(89,87,176,.28)]">
          <ImageSlot
            label="Foto atelier o equipo OLFFY"
            className="h-[clamp(240px,28vw,400px)] rounded-[14px]"
          />
        </div>

        <section className="mb-12">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
            PROCESO CREATIVO
          </div>
          <h2 className="mb-6 font-brand text-[clamp(26px,4vw,40px)] font-black text-olffy-ink">
            Cómo nace un producto OLFFY
          </h2>
          <div className="grid gap-[18px] md:grid-cols-4">
            <Step bg="#FFF5D9" number="01" color="#FAB405" title="Idea">
              Todo comienza con una idea, una sensación o una necesidad real de
              organizar algo bonito.
            </Step>
            <Step bg="#FFE9A8" number="02" color="#c8901a" title="Ilustración">
              Ilustramos a mano con colores cálidos y personajes únicos que
              hacen sonreír.
            </Step>
            <Step bg="#DEDDF2" number="03" color="#5957B0" title="Diseño">
              Llevamos las ilustraciones al producto final, cuidando cada
              detalle tipográfico.
            </Step>
            <Step bg="#FBD4C2" number="04" color="#E94300" title="Empaque">
              Empacamos a mano en Viña del Mar. Cada pedido sale con amor.
            </Step>
          </div>
        </section>

        <section className="mb-12">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
            EL EQUIPO
          </div>
          <h2 className="mb-[22px] font-brand text-[clamp(26px,4vw,40px)] font-black text-olffy-ink">
            Las personas detrás de OLFFY
          </h2>
          <div className="grid gap-[18px] md:grid-cols-2">
            <TeamCard
              bg="#FFF5D9"
              label="Foto fundadora"
              name="Camila"
              role="Fundadora & Diseñadora"
            >
              Detrás de OLFFY desde el primer cuaderno. Diseña, ilustra y empaca
              con mucho cariño.
            </TeamCard>
            <TeamCard
              bg="#DEDDF2"
              label="Foto ilustradora"
              name="Valentina"
              role="Ilustradora Principal"
            >
              La mente creativa detrás de los personajes y floritas que hacen
              único al universo OLFFY.
            </TeamCard>
          </div>
        </section>

        <div className="mb-12 grid grid-cols-3 gap-3">
          {["Foto galería 1", "Foto galería 2", "Foto galería 3"].map(
            (label) => (
              <ImageSlot
                key={label}
                label={label}
                className="h-[clamp(140px,18vw,240px)] rounded-[14px]"
              />
            ),
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-[22px] bg-[#fff5d9] p-[clamp(24px,4vw,40px)]">
          <div className="min-w-[260px] flex-1">
            <div className="mb-2 font-brand text-[22px] font-black text-olffy-ink">
              Encuéntranos en Viña del Mar
            </div>
            <p className="mb-3.5 text-[15px] leading-[1.6] text-olffy-ink/70">
              Visítanos en nuestra tienda. Te esperamos con muchos cuadernos.
            </p>
            <div className="flex flex-col gap-1.5 text-[13.5px] text-olffy-ink/60">
              <span>Viña del Mar, Región de Valparaíso</span>
              <span>Lunes a Viernes · 10:00 - 18:00 hrs</span>
              <span>@olffy.cl</span>
            </div>
          </div>
          <div className="grid h-[200px] min-w-[260px] flex-1 place-items-center rounded-2xl border-2 border-dashed border-olffy-purple/20 bg-olffy-purple/10 text-center text-olffy-purple">
            <div>
              <div className="text-sm font-semibold">Viña del Mar, Chile</div>
              <div className="mt-1 text-[12.5px] opacity-70">
                Ver en Google Maps →
              </div>
            </div>
          </div>
        </div>
      </section>
    </OlffyStorefront>
  );
}

function Step({
  bg,
  number,
  color,
  title,
  children,
}: {
  bg: string;
  number: string;
  color: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[18px] p-[22px]" style={{ backgroundColor: bg }}>
      <div className="mb-2 font-brand text-4xl font-black" style={{ color }}>
        {number}
      </div>
      <h3 className="mb-2 font-brand text-[19px] font-bold text-olffy-ink">
        {title}
      </h3>
      <p className="text-sm leading-[1.6] text-olffy-ink/70">{children}</p>
    </div>
  );
}

function TeamCard({
  bg,
  label,
  name,
  role,
  children,
}: {
  bg: string;
  label: string;
  name: string;
  role: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-olffy-ink/10 bg-white">
      <div className="h-[180px]" style={{ backgroundColor: bg }}>
        <ImageSlot
          label={label}
          className="h-[180px] rounded-none bg-transparent"
        />
      </div>
      <div className="p-[18px]">
        <div className="font-brand text-lg font-bold text-olffy-ink">
          {name}
        </div>
        <div className="mb-2 text-[12.5px] font-semibold text-olffy-purple">
          {role}
        </div>
        <p className="text-[13.5px] leading-[1.6] text-olffy-ink/65">
          {children}
        </p>
      </div>
    </div>
  );
}
