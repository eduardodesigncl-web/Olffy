import { useState } from 'react';
import {
  PuntosTabs,
  PointsSummaryCard,
  NumberBadge,
  TransactionsPanel,
  RewardsPanel,
  RedemptionsPanel,
  OrdersPanel,
} from '../components/puntos';
import { OlffyPointsSummary, AccountSettings } from '../components/account';
import type { AccountSettingsResult } from '../components/account';
import type {
  PuntosTab,
  PointsSummary,
  Transaction,
  RewardTier,
  Redemption,
  Order,
} from '../components/puntos';
import { GiftIcon, type GiftIconName } from '../components/storefront';
import styles from './PuntosPage.module.css';

// ── Datos reales del cliente (backend Supabase + Shopify) ──────────────────

export interface PuntosCustomerData {
  nombre: string;
  email: string;
  telefono: string;
  estado: 'activa' | 'bloqueada';
  creadaEl: string;
  saldo: number;
  acumulados: number;
  usados: number;
}

export interface PuntosRuleInfo {
  earning: string; // ej. "$200 gastados equivalen a 1 punto."
  validity: string; // ej. "Los puntos vencen a los 6 meses…"
}

interface PuntosPageProps {
  customer: PuntosCustomerData;
  transactions: Transaction[];
  orders: Order[];
  rewards: RewardTier[];
  redemptions: Redemption[];
  rules: string[];
  ruleInfo: PuntosRuleInfo;
  expiringNotice?: { points: number; dateLabel: string | null } | null;
  initialTab?: PuntosTab;
  onRedeem: (reward: RewardTier) => Promise<{ ok: boolean; error?: string }>;
  onSignOut: () => void | Promise<void>;
  onUpdateProfile: (input: {
    fullName: string;
    phone: string;
  }) => Promise<AccountSettingsResult>;
  onChangePassword: (input: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<AccountSettingsResult>;
}

const RULE_STEPS: { icon: GiftIconName; title: string; text: string }[] = [
  { icon: 'store', title: 'Compra', text: 'En la tienda online o física.' },
  { icon: 'star', title: 'Acumula', text: 'Cada compra suma puntos.' },
  { icon: 'gift', title: 'Canjea', text: 'Solicita tu recompensa.' },
  { icon: 'tag', title: 'Usa tu cupón', text: 'Aplícalo en tu próximo pedido.' },
];

const HELP_STEPS = [
  { title: 'Compra', text: 'Cada compra en tienda o web suma puntos automáticamente.' },
  { title: 'Acumula', text: 'Tu saldo crece y avanzas hacia la siguiente recompensa.' },
  { title: 'Canjea', text: 'Solicita tu recompensa y úsala en tu próximo pedido.' },
];

// OLFFY Puntos (cliente) — cuenta de fidelización con tabs: resumen, pedidos +
// movimientos, recompensas con solicitud de canje real, mis canjes,
// configuración y reglas. Los datos y acciones llegan de la integración
// (Supabase + Shopify); esta página solo pinta el diseño oficial.
export function PuntosPage({
  customer,
  transactions,
  orders,
  rewards,
  redemptions,
  rules,
  ruleInfo,
  expiringNotice,
  initialTab,
  onRedeem,
  onSignOut,
  onUpdateProfile,
  onChangePassword,
}: PuntosPageProps) {
  const [activeTab, setActiveTab] = useState<PuntosTab>(initialTab ?? 'resumen');
  const [signingOut, setSigningOut] = useState(false);

  const saldo = customer.saldo;
  const tiers = rewards.map((reward) => ({
    puntos: reward.puntos,
    label: reward.label,
  }));
  const nextTier =
    tiers.find((t) => t.puntos > saldo) ?? tiers[tiers.length - 1] ?? null;

  const summary: PointsSummary = {
    saldo,
    acumulados: customer.acumulados,
    usados: customer.usados,
    nextRewardPoints: nextTier?.puntos ?? 0,
    nextRewardLabel: nextTier?.label ?? 'Sin recompensas activas',
    tiers,
  };

  const handleSignOut = () => {
    setSigningOut(true);
    void onSignOut();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.greeting}>
        <div>
          <div className={styles.greetingEyebrow}>OLFFY PUNTOS</div>
          <h1 className={styles.greetingTitle}>Hola, {customer.nombre}</h1>
          <p className={styles.greetingEmail}>{customer.email}</p>
        </div>
        <div className={styles.greetingRight}>
          <button
            type="button"
            className={styles.logoutLink}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Cerrando sesión…' : 'Salir'}
          </button>
        </div>
      </div>

      <PuntosTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Sección de puntos persistente (dos cards): visible en todas las tabs. */}
      <OlffyPointsSummary
        points={saldo}
        rewardGoal={summary.nextRewardPoints}
        nextReward={summary.nextRewardLabel}
      />

      {expiringNotice && expiringNotice.points > 0 && (
        <p className={styles.greetingEmail} role="status">
          ⏳ Tienes {expiringNotice.points.toLocaleString('es-CL')} puntos por
          vencer{expiringNotice.dateLabel ? ` el ${expiringNotice.dateLabel}` : ' pronto'}.
          Úsalos antes para no perderlos.
        </p>
      )}

      {activeTab === 'resumen' && (
        <div className={styles.tabContent}>
          <PointsSummaryCard summary={summary} />

          <div className={styles.resumenGrid}>
            <div className={styles.panelBlock}>
              <h2 className={styles.blockTitle}>Últimos movimientos</h2>
              <TransactionsPanel transactions={transactions} limit={3} />
            </div>

            <div className={styles.helpCard}>
              <h2 className={styles.blockTitle}>Cómo funciona</h2>
              <ul className={styles.helpList}>
                {HELP_STEPS.map((step, idx) => (
                  <li key={step.title} className={styles.helpItem}>
                    <NumberBadge n={idx + 1} size={38} />
                    <div>
                      <div className={styles.helpItemTitle}>{step.title}</div>
                      <div className={styles.helpItemText}>{step.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className={styles.tabContent}>
          <div>
            <h2 className={styles.blockTitle}>Mis pedidos</h2>
            <OrdersPanel orders={orders} />
          </div>
          <div>
            <h2 className={styles.blockTitle}>Movimientos de puntos</h2>
            <TransactionsPanel transactions={transactions} />
          </div>
        </div>
      )}

      {activeTab === 'recompensas' && (
        <div className={styles.tabContent}>
          <h2 className={styles.blockTitle}>Recompensas disponibles</h2>
          <RewardsPanel rewards={rewards} saldo={saldo} onRedeem={onRedeem} />
        </div>
      )}

      {activeTab === 'canjes' && (
        <div className={styles.tabContent}>
          <h2 className={styles.blockTitle}>Mis canjes</h2>
          <RedemptionsPanel redemptions={redemptions} />
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className={styles.tabContent}>
          <AccountSettings
            nombre={customer.nombre}
            email={customer.email}
            telefono={customer.telefono}
            estado={customer.estado}
            creadaEl={customer.creadaEl}
            saldo={saldo}
            nextReward={summary.nextRewardLabel}
            ruleEarning={ruleInfo.earning}
            ruleValidity={ruleInfo.validity}
            onGoToReglas={() => setActiveTab('reglas')}
            onUpdateProfile={onUpdateProfile}
            onChangePassword={onChangePassword}
          />
        </div>
      )}

      {activeTab === 'reglas' && (
        <div className={styles.tabContent}>
          <div>
            <h2 className={styles.blockTitle}>Así funciona el programa</h2>
            <div className={styles.stepsStrip}>
              {RULE_STEPS.map((step) => (
                <div key={step.title} className={styles.stepItem}>
                  <span className={styles.stepIcon}>
                    <GiftIcon name={step.icon} size={20} color="var(--olffy-morado)" />
                  </span>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepText}>{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={styles.blockTitle}>Reglas del programa</h2>
            <ul className={styles.rulesList}>
              {rules.map((rule, idx) => (
                <li key={rule} className={styles.ruleItem}>
                  <NumberBadge n={idx + 1} size={40} />
                  <span className={styles.ruleText}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
