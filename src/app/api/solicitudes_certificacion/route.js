import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todas las solicitudes de certificación o verificar existencia
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");
    const idCertificacion = searchParams.get("id_certificacion");
    const verificar = searchParams.get("verificar");
    const statusFilter = searchParams.get("status");

    // Si se solicita verificación de existencia
    if (verificar === "true" && empId && idCertificacion) {
      // 1. Verificar solicitudes activas (pendiente, en progreso, etc.)
      const [rowsSolic] = await conn.execute(
        "SELECT * FROM solicitudes_certificacion WHERE emp_id = ? AND id_certificacion = ? AND status IN ('pendiente', 'en progreso', 'entrenamiento_aprobado', 'examen_aprobado')",
        [empId, idCertificacion]
      );
      if (rowsSolic.length > 0) {
        return NextResponse.json({
          success: true,
          existe: true,
          motivo: "solicitud_activa",
          data: rowsSolic[0],
        });
      }

      // 2. Verificar si ya tiene certificación vigente (RH asignó, no vencida)
      const [rowsCert] = await conn.execute(
        "SELECT * FROM empleados_procesos WHERE emp_id = ? AND id_proceso = ? AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento > CURDATE()",
        [empId, idCertificacion]
      );
      if (rowsCert.length > 0) {
        return NextResponse.json({
          success: true,
          existe: true,
          motivo: "certificacion_vigente",
          data: rowsCert[0],
        });
      }

      return NextResponse.json({
        success: true,
        existe: false,
        data: null,
      });
    }

    // Obtener conteos de solicitudes pendientes de acción (para notificaciones)
    if (searchParams.get("counts") === "pendientes") {
      const [pendiente] = await conn.execute(
        "SELECT COUNT(*) as total FROM solicitudes_certificacion WHERE status = 'pendiente'"
      );
      const [entrenamientoAprobado] = await conn.execute(
        "SELECT COUNT(*) as total FROM solicitudes_certificacion WHERE status = 'entrenamiento_aprobado'"
      );
      const [examenAprobado] = await conn.execute(
        "SELECT COUNT(*) as total FROM solicitudes_certificacion WHERE status = 'examen_aprobado'"
      );
      return NextResponse.json({
        success: true,
        data: {
          pendiente: pendiente[0]?.total ?? 0,
          entrenamiento_aprobado: entrenamientoAprobado[0]?.total ?? 0,
          examen_aprobado: examenAprobado[0]?.total ?? 0,
        },
      });
    }

    // Obtener todas las solicitudes (opcionalmente filtradas por status)
    let query =
      "SELECT * FROM solicitudes_certificacion ORDER BY fecha_solicitud DESC";
    let params = [];

    if (statusFilter) {
      query =
        "SELECT * FROM solicitudes_certificacion WHERE status = ? ORDER BY fecha_solicitud DESC";
      params = [statusFilter];
    }

    const [rows] = await conn.execute(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las solicitudes" },
      { status: 500 }
    );
  }
}

// POST - Crear una o múltiples solicitudes de certificación
export async function POST(request) {
  try {
    const body = await request.json();
    const { solicitudes } = body;

    // Validar que se envíen solicitudes
    if (!solicitudes || !Array.isArray(solicitudes) || solicitudes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere al menos una solicitud",
        },
        { status: 400 }
      );
    }

    // Validar cada solicitud
    for (const solicitud of solicitudes) {
      if (
        !solicitud.emp_id ||
        !solicitud.emp_nombre ||
        !solicitud.id_certificacion ||
        !solicitud.nombre_certificacion
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cada solicitud debe incluir: emp_id, emp_nombre, id_certificacion y nombre_certificacion",
          },
          { status: 400 }
        );
      }
    }

    // Insertar cada solicitud y registrar en historial
    for (const solicitud of solicitudes) {
      const [result] = await conn.execute(
        "INSERT INTO solicitudes_certificacion (emp_id, emp_nombre, id_certificacion, nombre_certificacion, status, fecha_solicitud, solicitado_por) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
        [
          solicitud.emp_id,
          solicitud.emp_nombre,
          solicitud.id_certificacion,
          solicitud.nombre_certificacion,
          solicitud.status || "pendiente",
          solicitud.solicitado_por || "Sistema",
        ]
      );
      const idSolicitud = result.insertId;
      await conn.execute(
        "INSERT INTO historial (id_solicitud, empleado, comentario, fecha) VALUES (?, ?, ?, NOW())",
        [idSolicitud, solicitud.solicitado_por || "Sistema", "solicitud creada"]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${solicitudes.length} solicitud(es) creada(s) exitosamente`,
      data: { count: solicitudes.length },
    });
  } catch (error) {
    console.error("Error al crear solicitudes:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear las solicitudes" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar el estado de una solicitud de certificación
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "ID y nuevo status son requeridos",
        },
        { status: 400 }
      );
    }

    await conn.execute(
      "UPDATE solicitudes_certificacion SET status = ? WHERE id = ?",
      [status, id]
    );

    return NextResponse.json({
      success: true,
      message: "Solicitud actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la solicitud" },
      { status: 500 }
    );
  }
}


