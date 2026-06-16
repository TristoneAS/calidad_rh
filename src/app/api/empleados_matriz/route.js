import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener empleados desde tabla empleados (certificaciones_calidad)
// Con emp_id: devuelve un empleado (para solicitudes con validación de antigüedad)
// Sin emp_id: devuelve todos (para Matriz de Habilidades)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id") || searchParams.get("num_empleado");

    if (empId) {
      const [rows] = await conn.execute(
        "SELECT NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2, FECHA_NACIMIENTO, SEXO, FECHA_ANTIGUEDAD, CATEGORIA, ID_JEFE, NOMBRE_JEFE, activo FROM empleados WHERE NUM_EMPLEADO = ? AND activo = 1",
        [empId]
      );
      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Empleado no encontrado", data: null },
          { status: 200 }
        );
      }
      const emp = { ...rows[0], emp_id: rows[0].NUM_EMPLEADO };
      return NextResponse.json({ success: true, data: emp });
    }

    const [rows] = await conn.execute(
      "SELECT NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2, FECHA_NACIMIENTO, SEXO, FECHA_ANTIGUEDAD, CATEGORIA, ID_JEFE, NOMBRE_JEFE, activo FROM empleados WHERE activo = 1 ORDER BY NOMBRE ASC"
    );
    const data = rows.map((emp) => ({
      ...emp,
      emp_id: emp.NUM_EMPLEADO,
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los empleados" },
      { status: 500 }
    );
  }
}
