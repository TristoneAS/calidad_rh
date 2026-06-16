import React from "react";
import Consultar_solicitudes from "@/app/components/Consultar_solicitudes";

function page() {
  return (
    <Consultar_solicitudes modo="rh-entrenamientos" initialTab={0} />
  );
}

export default page;


