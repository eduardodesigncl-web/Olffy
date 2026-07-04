// @ts-nocheck
const C = { purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface PointsHeroProps {
  points: number;
  nextRewardAt?: number;
}

export function PointsHero({ points, nextRewardAt = 1000 }: PointsHeroProps) {
  const progress = Math.min(100, (points / nextRewardAt) * 100);
  const remaining = Math.max(0, nextRewardAt - points);

  return (
    <div
      className="relative rounded-2xl overflow-hidden px-8 py-10 text-white"
      style={{ background: C.purple }}
    >
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at 100% 0%, white 0%, transparent 55%)",
        }}
      />
      <div className="relative flex flex-col gap-1">
        <p
          className="text-[13px] tracking-widest opacity-60 uppercase"
          style={{ fontFamily: T.poppins }}
        >
          Tus puntos
        </p>
        <p
          className="text-[64px] leading-none"
          style={{ fontFamily: T.piepie }}
        >
          {points.toLocaleString("es-CL")}
        </p>
        <p
          className="text-[14px] opacity-65 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          {remaining > 0
            ? `${remaining} puntos para tu próxima recompensa`
            : "¡Listo para canjear! 🎉"}
        </p>
        <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span
            className="text-[11px] opacity-45"
            style={{ fontFamily: T.poppins }}
          >
            0
          </span>
          <span
            className="text-[11px] opacity-45"
            style={{ fontFamily: T.poppins }}
          >
            {nextRewardAt}
          </span>
        </div>
      </div>
    </div>
  );
}
