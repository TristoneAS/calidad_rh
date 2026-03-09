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

    // Insertar todos los enrolamientos (con soporte para certificaciones, vencimiento y fecha opcional)
    const insertPromises = enrolamientos.map((enrolamiento) => {
      const esCert = enrolamiento.es_certificacion ? 1 : 0;
      const fechaVenc = enrolamiento.fecha_vencimiento || null;
      const fechaEnrol = enrolamiento.fecha || null; // Fecha del archivo masivo (YYYY-MM-DD)
      return conn.execute(
        "INSERT INTO empleados_procesos (emp_id, emp_nombre, id_proceso, nombre_proceso, descripcion_proceso, fecha, enrolado_por, es_certificacion, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, COALESCE(?, CURDATE()), ?, ?, ?)",
        [
          enrolamiento.emp_id,
          enrolamiento.emp_nombre,
          enrolamiento.id_proceso,
          enrolamiento.nombre_proceso,
          enrolamiento.descripcion_proceso || "",
          fechaEnrol,
          enrolamiento.enrolado_por || "Alex",
          esCert,
          fechaVenc,
        ]
      );
    });
    await Promise.all(insertPromises);
    return NextResponse.json({
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

// PUT - Actualizar enrolamiento existente (por ejemplo, renovación de certificación)
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      emp_id,
      id_proceso,
      emp_nombre,
      nombre_proceso,
      descripcion_proceso,
      enrolado_por,
      es_certificacion,
      fecha_vencimiento,
    } = body;

    if (!emp_id || !id_proceso) {
      return NextResponse.json(
        { success: false, error: "emp_id e id_proceso son requeridos" },
        { status: 400 }
      );
    }

    const esCert = es_certificacion ? 1 : 0;
    const fechaVenc = fecha_vencimiento || null;

    await conn.execute(
      `UPDATE empleados_procesos
       SET emp_nombre = COALESCE(?, emp_nombre),
           nombre_proceso = COALESCE(?, nombre_proceso),
           descripcion_proceso = COALESCE(?, descripcion_proceso),
           enrolado_por = COALESCE(?, enrolado_por),
           es_certificacion = ?,
           fecha_vencimiento = ?
       WHERE emp_id = ? AND id_proceso = ?`,
      [
        emp_nombre || null,
        nombre_proceso || null,
        descripcion_proceso || null,
        enrolado_por || null,
        esCert,
        fechaVenc,
        emp_id,
        id_proceso,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Enrolamiento actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar enrolamiento:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el enrolamiento" },
      { status: 500 }
    );
  }
}
