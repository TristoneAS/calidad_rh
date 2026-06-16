/** Indicador mientras llega el RSC de la subruta (el shell del layout permanece montado). */
export default function DashboardLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 160,
        padding: "1.5rem",
        color: "#64748b",
        fontSize: "0.95rem",
      }}
    >
      Cargando…
    </div>
  );
}
