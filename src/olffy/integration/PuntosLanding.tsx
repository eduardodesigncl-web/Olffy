"use client";

// Landing del Club OLFFY (hero morado + panel derecho) para las rutas de
// acceso: login/registro y restablecer contraseña. Es un client component
// para que los componentes del frontend oficial (con hooks) no entren al
// grafo de server components.
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
