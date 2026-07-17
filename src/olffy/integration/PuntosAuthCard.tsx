"use client";

// Panel de acceso real del Club OLFFY (diseño del frontend oficial, CSS del
// PuntosLoginMock): tabs Crear cuenta / Iniciar sesión + recuperación de
// contraseña, conectados a Supabase Auth vía las acciones de /cuenta.
import { useState, type FormEvent } from "react";
import {
  loginCustomerAction,
  registerCustomerAction,
  requestCustomerPasswordRecoveryAction,
  resendCustomerConfirmationAction,
} from "app/cuenta/actions";
import { Button } from "../components/ui";
import { PasswordInput } from "src/shared/PasswordInput";
import styles from "../components/puntos/PuntosLoginMock.module.css";

type AuthMode = "signup" | "login" | "forgot";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function PuntosAuthCard({
  initialMode = "login",
  initialError,
  initialNotice,
  returnTo,
}: {
  initialMode?: "signup" | "login";
  initialError?: string;
  initialNotice?: string;
  returnTo?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setNeedsConfirmation(false);
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (fullName.trim() === "") {
      setError("Cuéntanos tu nombre.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (password === "") {
      setError("Crea una contraseña.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await registerCustomerAction({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation: password2,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.message ??
          "Cuenta creada. Revisa tu correo para confirmar tu cuenta.",
      );
    } catch {
      setError("No pudimos completar la solicitud. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (password === "") {
      setError("Ingresa tu contraseña.");
      return;
    }

    setError(null);
    setNeedsConfirmation(false);
    setPending(true);
    try {
      const result = await loginCustomerAction({
        email: email.trim(),
        password,
      });
      if (!result.ok) {
        setError(result.error);
        setNeedsConfirmation(result.code === "email_not_confirmed");
        return;
      }
      // Una navegación completa garantiza que las cookies escritas por la
      // Server Action viajen en la primera solicitud de la cuenta protegida.
      // Con router.push() esa solicitud podía adelantarse y volver a mostrar
      // el login aunque la autenticación ya hubiera terminado correctamente.
      window.location.assign(returnTo || "/cuenta");
      return;
    } catch {
      setError("No pudimos completar la solicitud. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  };

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await requestCustomerPasswordRecoveryAction({
        email: email.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.message ??
          "Si el correo corresponde a una cuenta válida, recibirás un mensaje.",
      );
    } catch {
      setError("No pudimos completar la solicitud. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  };

  const handleResendConfirmation = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await resendCustomerConfirmationAction({
        email: email.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(result.message ?? "Te reenviamos el correo de confirmación.");
      setNeedsConfirmation(false);
    } catch {
      setError("No pudimos completar la solicitud. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  };

  if (success) {
    return (
      <div className={styles.card}>
        <div className={styles.success}>
          <span className={styles.successBadge}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12.5l5 5 11-11" />
            </svg>
          </span>
          <h3 className={styles.successTitle}>{success}</h3>
          <button
            type="button"
            className={styles.resetLink}
            onClick={() => {
              setSuccess(null);
              switchMode("login");
            }}
          >
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className={styles.card}>
        <span className={styles.cardBadge}>Recuperación</span>
        <p className={styles.intro}>
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => void handleForgot(event)}
          noValidate
        >
          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="tucorreo@ejemplo.cl"
              autoComplete="email"
            />
          </label>
          {error && <span className={styles.error}>{error}</span>}
          <Button
            type="submit"
            variant="primary"
            className={styles.submitBtn}
            disabled={pending}
          >
            {pending ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
        <div className={styles.forgotRow}>
          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => switchMode("login")}
          >
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <div className={styles.card}>
      <span className={styles.cardBadge}>Es gratis</span>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Acceso a OLFFY Puntos"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isSignup}
          className={`${styles.tab} ${isSignup ? styles.tabActive : ""}`}
          onClick={() => switchMode("signup")}
        >
          Crear cuenta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignup}
          className={`${styles.tab} ${!isSignup ? styles.tabActive : ""}`}
          onClick={() => switchMode("login")}
        >
          Iniciar sesión
        </button>
      </div>

      <p className={styles.intro}>
        {isSignup
          ? "Crea tu cuenta para empezar a acumular puntos y recompensas."
          : "Ingresa para revisar tus puntos, cupones y pedidos."}
      </p>

      {notice && (
        <p className={styles.intro} role="status">
          {notice}
        </p>
      )}

      {isSignup ? (
        <form
          className={styles.form}
          onSubmit={(event) => void handleSignup(event)}
          noValidate
        >
          <label className={styles.field}>
            <span className={styles.label}>Nombre</span>
            <input
              className={styles.input}
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError(null);
              }}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="tucorreo@ejemplo.cl"
              autoComplete="email"
            />
          </label>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="customer-signup-password">
              Contraseña
            </label>
            <PasswordInput
              id="customer-signup-password"
              className={styles.input}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
            />
          </div>
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="customer-signup-password-confirmation"
            >
              Verificar contraseña
            </label>
            <PasswordInput
              id="customer-signup-password-confirmation"
              className={styles.input}
              value={password2}
              onChange={(e) => {
                setPassword2(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
            />
          </div>
          {error && <span className={styles.error}>{error}</span>}
          <Button
            type="submit"
            variant="primary"
            className={styles.submitBtn}
            disabled={pending}
          >
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => void handleLogin(event)}
          noValidate
        >
          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="tucorreo@ejemplo.cl"
              autoComplete="email"
            />
          </label>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="customer-login-password">
              Contraseña
            </label>
            <div className={styles.passwordWrap}>
              <PasswordInput
                id="customer-login-password"
                className={`${styles.input} ${styles.passwordInput}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className={styles.forgotRow}>
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => switchMode("forgot")}
            >
              Olvidé mi contraseña
            </button>
          </div>
          {error && <span className={styles.error}>{error}</span>}
          {needsConfirmation && (
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => void handleResendConfirmation()}
              disabled={pending}
            >
              Reenviar correo de confirmación
            </button>
          )}
          <Button
            type="submit"
            variant="primary"
            className={styles.submitBtn}
            disabled={pending}
          >
            {pending ? "Ingresando…" : "Iniciar sesión"}
          </Button>
        </form>
      )}

      <p className={styles.note}>
        Al crear tu cuenta aceptas acumular puntos con tus compras OLFFY.
      </p>
    </div>
  );
}
