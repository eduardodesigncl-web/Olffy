// Páginas públicas del storefront. Placeholder hasta que exista un router
// real (React Router u otro) — por ahora `onNavigate` cambia `currentPage`
// vía useState en App.tsx.
export type PublicPage =
  | "home"
  | "tienda"
  | "novedades"
  | "regalos"
  | "historia"
  | "contacto"
  | "puntos"
  | "checkout";
