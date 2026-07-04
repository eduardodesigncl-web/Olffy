// @ts-nocheck
import { TrendingUp, Gift, ShoppingBag } from "lucide-react";
import { StatCard } from "../shared/StatCard";

const C = { orange: "#e94300" };
const T = { poppins: "'Poppins', sans-serif" };

interface PointsStatsProps {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
}

export function PointsStats({
  totalEarned,
  totalRedeemed,
  currentBalance,
}: PointsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Puntos acumulados"
        value={totalEarned}
        sub="En total"
        valueColor={C.orange}
      />
      <StatCard
        label="Puntos canjeados"
        value={totalRedeemed}
        sub="Historial"
      />
      <StatCard
        label="Saldo actual"
        value={currentBalance}
        sub="Disponibles"
        valueColor="#5957b0"
      />
    </div>
  );
}
