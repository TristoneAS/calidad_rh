import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// POST - Marcar empleados como inactivos (baja) por NUM_EMPLEADO
// Recibe array de números de empleado, actualiza activo=0 sin eliminar registros
export async function POST(request) {
  try {
    const body = await request.json();
    const { numeros_empleado } = body;

    if (!numeros_empleado || !Array.isArray(numeros_empleado)) {
      return NextResponse.json(
        { success: false, error: "Se requiere un array 'numeros_empleado' con los números de empleado" },
        { status: 400 }
      );
    }

    const numerosUnicos = [...new Set(
      numeros_empleado
        .map((n) => String(n ?? "").trim())
        .filter((n) => n.length > 0)
    )];

    if (numerosUnicos.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay números de empleado válidos para dar de baja" },
        { status: 400 }
      );
    }

    let actualizados = 0;
    const noEncontrados = [];

    for (const numEmpleado of numerosUnicos) {
      try {
        const [result] = await conn.execute(
          "UPDATE empleados SET activo = 0 WHERE NUM_EMPLEADO = ?",
          [numEmpleado]
        );
        if (result.affectedRows > 0) {
          actualizados++;
        } else {
          noEncontrados.push(numEmpleado);
        }
      } catch (err) {
        if (/Unknown column 'activo'/i.test(err.message)) {
          return NextResponse.json(
            { success: false, error: "La columna 'activo' no existe. Ejecute la migración migration_empleados_activo.sql" },
            { status: 500 }
          );
        }
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bajas procesadas: ${actualizados} empleados marcados como inactivos${noEncontrados.length > 0 ? `, ${noEncontrados.length} no encontrados en BD` : ""}`,
      data: {
        actualizados,
        no_encontrados: noEncontrados,
        total_procesados: numerosUnicos.length,
      },
    });
  } catch (error) {
    console.error("Error al procesar bajas:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar las bajas de empleados" },
      { status: 500 }
    );
  }
}
