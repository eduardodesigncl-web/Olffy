// Páginas públicas del storefront. Placeholder hasta que exista un router
// real (React Router u otro) — por ahora `onNavigate` cambia `currentPage`
// vía useState en App.tsx.
export type PublicPage =
  | 'home'
  | 'tienda'
  | 'novedades'
  | 'regalos'
  | 'historia'
  | 'contacto'
  | 'puntos'
  | 'checkout';

// Página interna del panel admin — fuera del set público. App.tsx maneja el
// estado de navegación como AppPage; el admin no aparece en el navbar.
export type AppPage = PublicPage | 'admin';
