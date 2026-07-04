// @ts-nocheck
// StatCard — reusable stat card used in dashboard and customer views

const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}

export function StatCard({ label, value, sub, valueColor }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-2 p-5 bg-white rounded-xl border"
      style={{ borderColor: "rgba(0,0,0,0.08)" }}
    >
      <p
        className="text-[13px]"
        style={{ fontFamily: T.poppins, color: "rgba(0,0,0,0.5)" }}
      >
        {label}
      </p>
      <p
        className="text-[32px] leading-none"
        style={{
          fontFamily: T.piepie,
          color: valueColor ?? "rgba(0,0,0,0.85)",
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-[12px]"
          style={{ fontFamily: T.poppins, color: "rgba(0,0,0,0.4)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
