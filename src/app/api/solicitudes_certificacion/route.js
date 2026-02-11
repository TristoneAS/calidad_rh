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
      // Considerar como "activas" las solicitudes que aún están en flujo
      // (pendiente, en progreso, entrenamiento_aprobado, examen_aprobado)
      const [rows] = await conn.execute(
        "SELECT * FROM solicitudes_certificacion WHERE emp_id = ? AND id_certificacion = ? AND status IN ('pendiente', 'en progreso', 'entrenamiento_aprobado', 'examen_aprobado')",
        [empId, idCertificacion]
      );
      return NextResponse.json({
        success: true,
        existe: rows.length > 0,
        data: rows.length > 0 ? rows[0] : null,
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

    // Insertar todas las solicitudes
    const insertPromises = solicitudes.map((solicitud) => {
      return conn.execute(
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
    });

    await Promise.all(insertPromises);

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


