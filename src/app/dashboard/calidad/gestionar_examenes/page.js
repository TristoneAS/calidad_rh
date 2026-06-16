import React from "react";
import Consultar_solicitudes from "@/app/components/Consultar_solicitudes";

function page() {
  return (
    <Consultar_solicitudes modo="calidad-examenes" initialTab={1} />
  );
}

export default page;


