// @ts-nocheck
import { Gift } from "lucide-react";
import type { Redemption } from "../../contracts/loyalty.types";
import { RedemptionCard } from "../loyalty/RedemptionCard";

const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface RedemptionsPageProps {
  redemptions: Redemption[];
}

export function RedemptionsPage({ redemptions }: RedemptionsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Mis canjes
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Tus códigos se generan automáticamente y sirven en la tienda online o
          física.
        </p>
      </div>
      {redemptions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-black/25">
          <Gift size={48} />
          <div className="text-center">
            <p
              className="text-[15px] text-black/45"
              style={{ fontFamily: T.poppins }}
            >
              No has realizado canjes
            </p>
            <p
              className="text-[13px] text-black/30 mt-1"
              style={{ fontFamily: T.poppins }}
            >
              Acumula puntos y canjéalos por descuentos
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3" data-bind="supabase-redemptions">
          {redemptions.map((r) => (
            <RedemptionCard key={r.id} redemption={r} />
          ))}
        </div>
      )}
    </div>
  );
}
