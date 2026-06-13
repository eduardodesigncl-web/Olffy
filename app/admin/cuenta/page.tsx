import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  IdentificationIcon,
  LockClosedIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TicketIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { requireAdminSession } from "lib/admin/auth";
import {
  getCustomerPortalDashboard,
  type CustomerPortalRedemption,
} from "lib/admin/customer-dashboard";
import Link from "next/link";
import { connection } from "next/server";

const numberFormatter = new Intl.NumberFormat("es-CL");
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const metadata = {
  title: "Cuenta cliente",
  robots: { index: false, follow: false },
};

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminCustomerAccountPage() {
  await connection();
  await requireAdminSession();

  let dashboard: Awaited<ReturnType<typeof getCustomerPortalDashboard>> | null =
    null;
  let error: string | null = null;

  try {
    dashboard = await getCustomerPortalDashboard();
  } catch (cause) {
    console.error("Error loading customer portal dashboard:", cause);
    error =
      cause instanceof Error
        ? cause.message
        : "No fue posible cargar la cuenta cliente.";
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
            Portal de fidelizacion
          </p>
          <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
            Cuenta cliente
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Centro de control del dashboard que las clientas usan en{" "}
            <strong>/cuenta</strong>. Aqui puedes supervisar accesos, saldos,
            recompensas y solicitudes de canje.
          </p>
        </div>
        <Link
          href="/cuenta"
          target="_blank"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-olffy-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olffy-ink"
        >
          Abrir portal cliente
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : dashboard ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Clientes inscritos"
              value={dashboard.stats.customersCount}
              detail={`${dashboard.stats.activeCustomersCount} activos · ${dashboard.stats.blockedCustomersCount} bloqueados`}
              icon={UserGroupIcon}
              color="bg-purple-100 text-olffy-purple"
            />
            <Metric
              label="Acceso activado"
              value={dashboard.stats.linkedCustomersCount}
              detail={`${dashboard.stats.pendingCustomersCount} aun no han usado magic link`}
              icon={IdentificationIcon}
              color="bg-green-100 text-green-700"
            />
            <Metric
              label="Puntos disponibles"
              value={dashboard.stats.outstandingPoints}
              detail="Saldo total vigente entre clientes"
              icon={SparklesIcon}
              color="bg-yellow-100 text-yellow-700"
            />
            <Metric
              label="Canjes por gestionar"
              value={
                dashboard.stats.requestedRedemptionsCount +
                dashboard.stats.approvedRedemptionsCount
              }
              detail={`${dashboard.stats.requestedRedemptionsCount} solicitados · ${dashboard.stats.approvedRedemptionsCount} aprobados`}
              icon={TicketIcon}
              color="bg-orange-100 text-olffy-orange"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Funcionalidades disponibles
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Estado actual del dashboard de clientes.
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Primera version activa
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Feature
                  icon={LockClosedIcon}
                  title="Acceso por correo"
                  detail="Magic link y sesion separada del administrador."
                />
                <Feature
                  icon={SparklesIcon}
                  title="Resumen de puntos"
                  detail="Saldo, acumulados, usados y proxima recompensa."
                />
                <Feature
                  icon={ClockIcon}
                  title="Historial de puntos"
                  detail="Compras, canjes, ajustes, vencimientos y reversas."
                />
                <Feature
                  icon={GiftIcon}
                  title="Recompensas"
                  detail="Beneficios activos y disponibilidad segun saldo."
                />
                <Feature
                  icon={TicketIcon}
                  title="Solicitudes de canje"
                  detail="Seguimiento de solicitado, aprobado, entregado o cancelado."
                />
                <Feature
                  icon={CheckCircleIcon}
                  title="Perfil y estado"
                  detail="Nombre, correo, telefono y bloqueo de canjes."
                />
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                <ShoppingBagIcon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Proximas integraciones
              </p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                Historial de compras y pedidos
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Este espacio queda preparado para incorporar pedidos Shopify,
                detalle de compras, seguimiento y futuras preferencias de
                cliente sin alterar la base actual.
              </p>
              <div className="mt-5 space-y-2 text-sm text-gray-500">
                <p>• Pedidos online asociados</p>
                <p>• Compras fisicas TUU detalladas</p>
                <p>• Direcciones y preferencias</p>
                <p>• Notificaciones y beneficios personalizados</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <RecentCustomers customers={dashboard.recentCustomers} />
            <PendingRedemptions redemptions={dashboard.pendingRedemptions} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Gestion rapida
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <QuickLink
                href="/admin/puntos/clientes"
                title="Clientes"
                detail="Crear, buscar y revisar saldos."
              />
              <QuickLink
                href="/admin/puntos/recompensas"
                title="Recompensas"
                detail={`${dashboard.stats.activeRewardsCount} beneficios activos.`}
              />
              <QuickLink
                href="/admin/puntos/ventas"
                title="Ventas TUU"
                detail="Registrar compras y acumulacion."
              />
              <QuickLink
                href="/admin/puntos"
                title="Resumen de puntos"
                detail="Ver indicadores globales."
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof UserGroupIcon;
  color: string;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">
        {numberFormatter.format(value)}
      </p>
      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </article>
  );
}

function Feature({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof LockClosedIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-gray-100 bg-gray-50 p-4">
      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
      <div>
        <p className="flex items-center gap-2 font-medium text-gray-900">
          <Icon className="h-4 w-4 text-olffy-purple" />
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function RecentCustomers({
  customers,
}: {
  customers: Awaited<
    ReturnType<typeof getCustomerPortalDashboard>
  >["recentCustomers"];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">Clientes recientes</h2>
          <p className="mt-1 text-xs text-gray-500">
            Estado de acceso y saldo actual.
          </p>
        </div>
        <Link
          href="/admin/puntos/clientes"
          className="text-sm font-semibold text-olffy-purple"
        >
          Ver todos
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/admin/puntos/clientes/${customer.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {customer.full_name || "Sin nombre"}
              </p>
              <p className="truncate text-xs text-gray-500">{customer.email}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-olffy-purple">
                {numberFormatter.format(customer.points_balance)} pts
              </p>
              <p
                className={`mt-1 text-xs ${
                  customer.auth_user_id ? "text-green-700" : "text-amber-700"
                }`}
              >
                {customer.auth_user_id
                  ? "Acceso activado"
                  : "Sin primer acceso"}
              </p>
            </div>
          </Link>
        ))}
        {customers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            Aun no hay clientes inscritos.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PendingRedemptions({
  redemptions,
}: {
  redemptions: CustomerPortalRedemption[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">Canjes pendientes</h2>
          <p className="mt-1 text-xs text-gray-500">
            Solicitudes que requieren seguimiento.
          </p>
        </div>
        <Link
          href="/admin/puntos/clientes"
          className="text-sm font-semibold text-olffy-purple"
        >
          Gestionar
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {redemptions.map((redemption) => {
          const customer = relation(redemption.loyalty_customers);
          const reward = relation(redemption.rewards);

          return (
            <Link
              key={redemption.id}
              href={`/admin/puntos/clientes/${redemption.customer_id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {reward?.name || "Recompensa"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {customer?.full_name || customer?.email || "Cliente"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    redemption.status === "requested"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-purple-50 text-olffy-purple"
                  }`}
                >
                  {redemption.status === "requested"
                    ? "Solicitado"
                    : "Aprobado"}
                </span>
                <p className="mt-2 text-xs text-gray-500">
                  {dateFormatter.format(new Date(redemption.redeemed_at))}
                </p>
              </div>
            </Link>
          );
        })}
        {redemptions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay canjes pendientes.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-olffy-purple hover:shadow"
    >
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{detail}</p>
      <p className="mt-4 text-sm font-semibold text-olffy-purple">Abrir</p>
    </Link>
  );
}
