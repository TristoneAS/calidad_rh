import React from "react";
import LayoutComponent from "@/app/components/LayoutComponent";
import Consultar_solicitudes from "@/app/components/Consultar_solicitudes";

function page() {
  return (
    <LayoutComponent>
      <Consultar_solicitudes modo="calidad-examenes" initialTab={1} />
    </LayoutComponent>
  );
}

export default page;


