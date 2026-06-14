import {
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  SparklesIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { getCustomerAccountState } from "lib/customer/auth";
import { hasSupabasePublicConfig } from "lib/supabase/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registerCustomerAction, requestMagicLinkAction } from "../actions";

export const metadata = {
  title: "Entrar a mi cuenta",
  robots: { index: false, follow: false },
};

function errorText(error?: string) {
  if (!error) return null;
  if (error === "no-inscrita") {
    return "Este correo aún no tiene una cuenta. Puedes crearla desde la opción Crear cuenta.";
  }
  return error;
}

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    signedOut?: string;
    mode?: string;
    verification?: string;
  }>;
}) {
  const params = await searchParams;
  const configured = hasSupabasePublicConfig();
  const isRegister = params.mode === "register";

  if (configured) {
    const state = await getCustomerAccountState();
    if (state.status === "ready") {
      redirect("/cuenta");
    }
  }

  return (
    <div className="px-5 py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[10px] border-2 border-olffy-ink bg-white shadow-[8px_8px_0_#343434] lg:grid-cols-[1fr_0.9fr]">
        <section className="bg-olffy-purple px-7 py-10 text-white md:px-12 md:py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-olffy-yellow text-olffy-ink">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
            OLFFY Puntos
          </p>
          <h1 className="mt-3 font-brand text-4xl font-black leading-tight md:text-5xl">
            Tus puntos, claritos y a mano.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-white/80">
            Revisa tu saldo, entiende cada movimiento y descubre las recompensas
            que ya puedes pedir.
          </p>
          <div className="mt-10 space-y-4 text-sm text-white/85">
            <p className="flex items-center gap-3">
              <LockClosedIcon className="h-5 w-5 text-olffy-yellow" />
              Acceso privado con correo y contraseña.
            </p>
            <p className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-olffy-yellow" />
              Sin esperas: entra directamente a tu dashboard.
            </p>
          </div>
        </section>

        <section className="px-7 py-10 md:px-12 md:py-14">
          <p className="text-sm font-bold text-olffy-orange">
            {isRegister ? "NUEVA CUENTA" : "MI CUENTA"}
          </p>
          <h2 className="mt-2 font-brand text-3xl font-black text-olffy-ink">
            {isRegister ? "Únete a OLFFY Puntos" : "Entra a tu cuenta"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-olffy-muted">
            {isRegister
              ? "Crea tu cuenta gratis. Te enviaremos un correo para verificarla antes de entrar."
              : "Ingresa con el correo y la contraseña de tu cuenta OLFFY."}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-[7px] border-2 border-olffy-ink bg-olffy-cream p-1">
            <Link
              href="/cuenta/login?mode=login"
              className={`flex items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 text-sm font-bold transition ${
                !isRegister
                  ? "bg-olffy-ink text-white"
                  : "text-olffy-ink hover:bg-white"
              }`}
            >
              <LockClosedIcon className="h-4 w-4" />
              Iniciar sesión
            </Link>
            <Link
              href="/cuenta/login?mode=register"
              className={`flex items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 text-sm font-bold transition ${
                isRegister
                  ? "bg-olffy-purple text-white"
                  : "text-olffy-ink hover:bg-white"
              }`}
            >
              <UserPlusIcon className="h-4 w-4" />
              Crear cuenta
            </Link>
          </div>

          {params.signedOut ? (
            <div className="mt-6 rounded-[6px] border border-olffy-purple/30 bg-olffy-purple/5 p-4 text-sm text-olffy-purple">
              Cerraste tu sesion correctamente.
            </div>
          ) : null}
          {params.verification === "sent" ? (
            <div className="mt-6 rounded-[6px] border border-olffy-purple/30 bg-olffy-purple/5 p-4 text-sm text-olffy-purple">
              Revisa tu correo y confirma tu cuenta antes de ingresar. Si ya
              tenías una cuenta, ingresa o recupera tu contraseña.
            </div>
          ) : null}
          {errorText(params.error) ? (
            <div className="mt-6 rounded-[6px] border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
              {errorText(params.error)}
            </div>
          ) : null}
          {!configured ? (
            <div className="mt-6 rounded-[6px] border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              La cuenta cliente esta lista, pero faltan las variables publicas
              de Supabase en este entorno.
            </div>
          ) : null}

          <form
            action={
              isRegister ? registerCustomerAction : requestMagicLinkAction
            }
            className="mt-7 space-y-4"
          >
            {isRegister ? (
              <>
                <label className="block">
                  <span className="text-sm font-bold text-olffy-ink">
                    Nombre completo
                  </span>
                  <input
                    required
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Tu nombre"
                    disabled={!configured}
                    className="mt-2 h-12 w-full rounded-[6px] border-2 border-olffy-ink bg-white px-4 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-olffy-ink">
                    Teléfono
                  </span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+56 9 1234 5678"
                    disabled={!configured}
                    className="mt-2 h-12 w-full rounded-[6px] border-2 border-olffy-ink bg-white px-4 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </label>
              </>
            ) : null}
            <label className="block">
              <span className="text-sm font-bold text-olffy-ink">Correo</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                placeholder="hola@ejemplo.cl"
                disabled={!configured}
                className="mt-2 h-12 w-full rounded-[6px] border-2 border-olffy-ink bg-white px-4 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-olffy-ink">
                Contraseña
              </span>
              <input
                required
                minLength={8}
                type="password"
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="Mínimo 8 caracteres"
                disabled={!configured}
                className="mt-2 h-12 w-full rounded-[6px] border-2 border-olffy-ink bg-white px-4 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </label>
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-bold text-olffy-ink">
                  Repetir contraseña
                </span>
                <input
                  required
                  minLength={8}
                  type="password"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  disabled={!configured}
                  className="mt-2 h-12 w-full rounded-[6px] border-2 border-olffy-ink bg-white px-4 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </label>
            ) : null}
            <button
              disabled={!configured}
              className="h-12 w-full rounded-[6px] bg-olffy-ink px-5 font-brand font-black text-white transition hover:bg-olffy-purple disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isRegister
                ? "Crear cuenta y verificar correo"
                : "Entrar a mi cuenta"}
              <ArrowRightIcon className="ml-2 inline h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-olffy-muted">
            {isRegister
              ? "Al crear tu cuenta aceptas que OLFFY use estos datos para administrar tus puntos y beneficios."
              : "Usa el correo con el que compraste o te registraste. Si necesitas ayuda, "}
            {!isRegister ? (
              <Link href="/contacto" className="font-bold text-olffy-purple">
                contáctanos
              </Link>
            ) : null}
          </p>
        </section>
      </div>
    </div>
  );
}
