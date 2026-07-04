// @ts-nocheck
import Image from "next/image";

// FilmStrip — 3-image horizontal gallery from home page

interface FilmStripProps {
  images?: string[];
}

export function FilmStrip({ images = [] }: FilmStripProps) {
  return (
    <section className="px-6 md:px-16 py-12 bg-white">
      {/* Mobile: vertical stack */}
      <div className="flex flex-col gap-4 md:hidden">
        {[0, 1, 2].map((i) =>
          images[i] ? (
            <div
              key={i}
              className="relative w-full h-[220px] rounded-2xl overflow-hidden"
            >
              <Image
                src={images[i]}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div key={i} className="w-full h-[220px] rounded-2xl bg-[#eee]" />
          ),
        )}
      </div>
      {/* Desktop: horizontal row */}
      <div className="hidden md:flex gap-8 justify-center">
        {[0, 1, 2].map((i) =>
          images[i] ? (
            <div
              key={i}
              className="relative flex-1 h-[380px] rounded-2xl overflow-hidden"
            >
              <Image
                src={images[i]}
                alt=""
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div key={i} className="flex-1 h-[380px] rounded-2xl bg-[#eee]" />
          ),
        )}
      </div>
    </section>
  );
}
