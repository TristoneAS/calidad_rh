import { NextResponse } from "next/server";
import { connEmpleados } from "@/libs/mysql";

// GET - Obtener empleado por emp_id desde BD empleados, tabla del_empleados
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId =
      searchParams.get("num_empleado") || searchParams.get("emp_id");

    if (empId) {
      // Buscar empleado en BD empleados, tabla del_empleados por emp_id (campo emp_nombre)
      const [rows] = await connEmpleados.execute(
        "SELECT emp_id, emp_nombre FROM del_empleados WHERE emp_id = ?",
        [empId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Empleado no encontrado", data: null },
          { status: 200 }
        );
      }

      const emp = rows[0];
      const nombreCompleto = emp.emp_nombre || "";
      return NextResponse.json({
        success: true,
        data: {
          emp_id: emp.emp_id,
          NUM_EMPLEADO: emp.emp_id,
          NOMBRE: nombreCompleto,
          APELLIDO1: "",
          emp_nombre: nombreCompleto,
        },
      });
    } else {
      // Listar todos los empleados de del_empleados
      const [rows] = await connEmpleados.execute(
        "SELECT emp_id, emp_nombre FROM del_empleados ORDER BY emp_nombre ASC"
      );
      return NextResponse.json({
        success: true,
        data: rows.map((emp) => {
          const nombreCompleto = emp.emp_nombre || "";
          return {
            emp_id: emp.emp_id,
            NUM_EMPLEADO: emp.emp_id,
            NOMBRE: nombreCompleto,
            APELLIDO1: "",
            emp_nombre: nombreCompleto,
          };
        }),
      });
    }
  } catch (error) {
    console.error("Error al obtener empleado:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el empleado" },
      { status: 500 }
    );
  }
}
