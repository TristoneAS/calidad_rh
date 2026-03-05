import React from "react";
import Cargar_empleados from "@/app/components/Cargar_empleados";
import LayoutComponent from "@/app/components/LayoutComponent";

export default function page() {
  return (
    <LayoutComponent>
      <Cargar_empleados />
    </LayoutComponent>
  );
}
