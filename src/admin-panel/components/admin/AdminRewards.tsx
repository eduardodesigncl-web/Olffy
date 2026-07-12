// @ts-nocheck
import { useState } from "react";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminRewardCard, type AdminReward } from "./AdminRewardCard";
import { AdminRewardForm, type CreatedRewardResult } from "./AdminRewardForm";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminRewards.module.css";

// Sección Recompensas del panel admin.
// AdminRewards MOCK: en producción debe operar con Supabase, permisos internos
// y auditoría. Nada aquí modifica datos (acciones y formulario son simulados).

const MOCK_MESSAGE = "Acción disponible en próxima fase.";

// Orquesta la vista de Recompensas: header + métricas + (recompensas |
// formulario) + solicitudes de canje. Un aviso compartido responde a las
// acciones mock, que no modifican ningún dato.
export function AdminRewards() {
  const [notice, setNotice] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<AdminReward | null>(null);
  const showMockNotice = () => setNotice(MOCK_MESSAGE);
  const runtime = adminPanelRuntime.data;
  const [rewards, setRewards] = useState<AdminReward[]>(() =>
    [...(runtime?.rewards ?? [])].sort((a, b) => {
      const rank = (reward: AdminReward) =>
        reward.rewardType === "discount" && reward.estado === "Activa"
          ? 0
          : reward.estado === "Activa"
            ? 1
            : 2;
      return rank(a) - rank(b) || a.puntos - b.puntos;
    }),
  );
  const handleCreated = (result: CreatedRewardResult) => {
    const saved: AdminReward = {
      id: result.reward.id,
      nombre: result.reward.name,
      puntos: result.reward.points_cost,
      estado: result.reward.is_active ? "Activa" : "Pausada",
      descripcion:
        result.reward.description || "Recompensa sincronizada desde Supabase.",
      shopifyCode: result.shopifyCode ?? undefined,
      rewardType: result.reward.reward_type,
      discountAmountClp: Number(result.reward.discount_amount_clp ?? 0),
      minimumPurchaseClp: Number(result.reward.minimum_purchase_clp ?? 0),
      validityDays: Number(result.reward.validity_days ?? 30),
    };
    setRewards((current) =>
      current.some((reward) => reward.id === saved.id)
        ? current.map((reward) => (reward.id === saved.id ? saved : reward))
        : [saved, ...current],
    );
    setNotice(currentMessageForSave(currentHasReward(rewards, saved.id)));
  };
  const startEditing = (reward: AdminReward) => {
    setEditingReward(reward);
    setNotice(null);
    window.requestAnimationFrame(() => {
      document
        .getElementById("reward-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const planRewards = rewards.filter(
    (reward) => reward.estado === "Activa" && reward.rewardType === "discount",
  );
  const metrics: AdminMetricCardData[] = [
    {
      label: "Recompensas activas",
      value: rewards.filter((reward) => reward.estado === "Activa").length,
      tone: "morado",
    },
    {
      label: "Emisión de códigos",
      value: "Automática",
      tone: "verde",
    },
    { label: "Canjes aprobados", value: 0, tone: "verde" },
    { label: "Canjes usados", value: 0, tone: "morado" },
    {
      label: "Puntos promedio",
      value: planRewards.length
        ? Math.round(
            planRewards.reduce((sum, reward) => sum + reward.puntos, 0) /
              planRewards.length,
          )
        : 0,
      tone: "amarillo",
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Recompensas</h1>
        <p className={styles.subtitle}>
          Gestiona beneficios canjeables. Los códigos se emiten automáticamente
          al cliente cuando cumple los puntos requeridos.
        </p>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} metric={m} />
        ))}
      </div>

      {notice && (
        <div className={styles.notice}>
          <svg
            className={styles.noticeIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16.5h.01" />
          </svg>
          <span className={styles.noticeText}>{notice}</span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.columns}>
        <div className={styles.rewardsPanel}>
          <h2 className={styles.panelTitle}>Recompensas disponibles</h2>
          <div className={styles.rewardsGrid}>
            {rewards.map((reward) => (
              <AdminRewardCard
                key={reward.id}
                reward={reward}
                onEdit={startEditing}
                onMockAction={showMockNotice}
              />
            ))}
          </div>
        </div>

        <AdminRewardForm
          onCreated={handleCreated}
          editingReward={editingReward}
          onCancelEdit={() => setEditingReward(null)}
        />
      </div>
    </div>
  );
}

function currentHasReward(rewards: AdminReward[], id: number) {
  return rewards.some((reward) => reward.id === id);
}

function currentMessageForSave(wasEditing: boolean) {
  return wasEditing
    ? "Recompensa actualizada correctamente."
    : "Recompensa creada correctamente.";
}
