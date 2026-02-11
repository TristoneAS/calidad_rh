import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener empleado por NUM_EMPLEADO o todos los empleados
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const numEmpleado =
      searchParams.get("num_empleado") || searchParams.get("emp_id");

    if (numEmpleado) {
      // Buscar empleado específico por NUM_EMPLEADO
      const [rows] = await conn.execute(
        "SELECT NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2, FECHA_NACIMIENTO, SEXO, FECHA_ANTIGUEDAD, CATEGORIA, ID_JEFE, NOMBRE_JEFE FROM empleados WHERE NUM_EMPLEADO = ?",
        [numEmpleado]
      );

      if (rows.length === 0) {
        // Devolver 200 con success: false en lugar de 404 para evitar excepciones de Axios
        return NextResponse.json(
          { success: false, error: "Empleado no encontrado", data: null },
          { status: 200 }
        );
      }

      return NextResponse.json({ success: true, data: rows[0] });
    } else {
      // Si no se proporciona NUM_EMPLEADO, retornar todos los empleados con los campos especificados
      const [rows] = await conn.execute(
        "SELECT NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2, FECHA_NACIMIENTO, SEXO, FECHA_ANTIGUEDAD, CATEGORIA, ID_JEFE, NOMBRE_JEFE FROM empleados ORDER BY NOMBRE ASC"
      );
      return NextResponse.json({ success: true, data: rows });
    }
  } catch (error) {
    console.error("Error al obtener empleado:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el empleado" },
      { status: 500 }
    );
  }
}
