import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todos los enrolamientos de procesos o verificar existencia
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");
    const idProceso = searchParams.get("id_proceso");
    const verificar = searchParams.get("verificar");

    // Si se solicita verificación de existencia
    if (verificar === "true" && empId && idProceso) {
      const [rows] = await conn.execute(
        "SELECT * FROM empleados_procesos WHERE emp_id = ? AND id_proceso = ?",
        [empId, idProceso]
      );
      return NextResponse.json({ 
        success: true, 
        existe: rows.length > 0,
        data: rows.length > 0 ? rows[0] : null
      });
    }

    // Obtener todos los enrolamientos
    const [rows] = await conn.execute(
      "SELECT * FROM empleados_procesos ORDER BY fecha DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener enrolamientos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los enrolamientos" },
      { status: 500 }
    );
  }
}

// POST - Crear uno o múltiples enrolamientos de procesos
export async function POST(request) {
  try {
    const body = await request.json();
    const { enrolamientos } = body;

    // Validar que se envíen enrolamientos
    if (!enrolamientos || !Array.isArray(enrolamientos) || enrolamientos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debe enviar al menos un enrolamiento" },
        { status: 400 }
      );
    }

    // Validar cada enrolamiento
    for (const enrolamiento of enrolamientos) {
      if (!enrolamiento.emp_id || !enrolamiento.emp_nombre || !enrolamiento.id_proceso || !enrolamiento.nombre_proceso) {
        return NextResponse.json(
          { success: false, error: "Todos los campos son requeridos en cada enrolamiento" },
          { status: 400 }
        );
      }
    }

    // Insertar todos los enrolamientos
    const insertPromises = enrolamientos.map((enrolamiento) => {
      return conn.execute(
        "INSERT INTO empleados_procesos (emp_id, emp_nombre, id_proceso, nombre_proceso, descripcion_proceso, fecha, enrolado_por) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)",
        [
          enrolamiento.emp_id,
          enrolamiento.emp_nombre,
          enrolamiento.id_proceso,
          enrolamiento.nombre_proceso,
          enrolamiento.descripcion_proceso || "",
          enrolamiento.enrolado_por || "Alex",
        ]
      );
    });    await Promise.all(insertPromises);    return NextResponse.json({
      success: true,
      message: `${enrolamientos.length} enrolamiento(s) creado(s) exitosamente`,
      data: { count: enrolamientos.length },
    });
  } catch (error) {
    console.error("Error al crear enrolamientos:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear los enrolamientos" },
      { status: 500 }
    );
  }
}
