import LayoutComponent from "@/app/components/LayoutComponent";

/**
 * Layout único del dashboard: evita remontar el shell (sidebar, MUI) en cada ruta
 * y reduce el trabajo del payload RSC al navegar.
 */
export default function DashboardLayout({ children }) {
  return <LayoutComponent>{children}</LayoutComponent>;
}
