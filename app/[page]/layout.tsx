import { SiteFooter } from "components/olffy/site-footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
