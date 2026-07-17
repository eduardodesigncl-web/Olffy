"use client";

// Landing del Club OLFFY (hero morado + panel derecho) para las rutas de
// acceso: login/registro y restablecer contraseña. Es un client component
// para que los componentes del frontend oficial (con hooks) no entren al
// grafo de server components.
import Link from "next/link";
import { PuntosHero } from "../components/puntos";
import styles from "../pages/PuntosPage.module.css";
import { PuntosAuthCard } from "./PuntosAuthCard";
import { ResetPasswordCard } from "./ResetPasswordCard";

type PuntosLandingProps =
  | {
      variant: "auth";
      initialMode?: "signup" | "login";
      initialError?: string;
      initialNotice?: string;
      returnTo?: string;
    }
  | { variant: "reset" };

export function PuntosLanding(props: PuntosLandingProps) {
  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.backLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Volver a la web
      </Link>
      <PuntosHero>
        {props.variant === "auth" ? (
          <PuntosAuthCard
            initialMode={props.initialMode ?? "login"}
            {...(props.initialError ? { initialError: props.initialError } : {})}
            {...(props.initialNotice ? { initialNotice: props.initialNotice } : {})}
            {...(props.returnTo ? { returnTo: props.returnTo } : {})}
          />
        ) : (
          <ResetPasswordCard />
        )}
      </PuntosHero>
    </div>
  );
}
