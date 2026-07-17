import { redirect } from "next/navigation";

// El panel nuevo de /cuenta unifica todo en pestañas; esta ruta se conserva
// como enlace profundo hacia la pestaña correspondiente.
export default function AccountLegacyRoute() {
  redirect("/cuenta?tab=recompensas");
}
