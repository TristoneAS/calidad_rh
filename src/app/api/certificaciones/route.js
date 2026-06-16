import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// Filtra registros dejando solo aquellos cuyo emp_id está activo en tabla empleados
async function filtrarPorEmpleadosActivos(conn, rows) {
  if (!rows || rows.length === 0) return rows;
  const empIds = [
    ...new Set(rows.map((r) => String(r.emp_id ?? "").trim()).filter(Boolean)),
  ];
  if (empIds.length === 0) return rows;
  try {
    const placeholders = empIds.map(() => "?").join(", ");
    const [activos] = await conn.execute(
      `SELECT NUM_EMPLEADO FROM empleados WHERE NUM_EMPLEADO IN (${placeholders}) AND activo = 1`,
      empIds,
    );
    const setActivos = new Set(
      activos.map((a) => String(a.NUM_EMPLEADO ?? "").trim()),
    );
    return rows.filter((r) => setActivos.has(String(r.emp_id ?? "").trim()));
  } catch (err) {
    return rows;
  }
}

// GET - Certificaciones vigentes, por vencer, vencidas, historial o verificar vigente
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // vigente, por_vencer, vencidas, historial
    const empId = searchParams.get("emp_id");
    const idProceso = searchParams.get("id_proceso");
    const verificar = searchParams.get("verificar");

    // Verificar si existe certificación vigente (fecha_vencimiento > hoy)
    if (verificar === "true" && empId && idProceso) {
      const [rows] = await conn.execute(
        `SELECT ep.* FROM empleados_procesos ep 
         WHERE ep.emp_id = ? AND ep.id_proceso = ? 
         AND ep.fecha_vencimiento IS NOT NULL 
         AND ep.fecha_vencimiento > CURDATE()`,
        [empId, idProceso],
      );
      return NextResponse.json({
        success: true,
        vigente: rows.length > 0,
        data: rows.length > 0 ? rows[0] : null,
      });
    }

    // Obtener claves (emp_id-id_proceso) de solicitudes activas para deshabilitar Renovar
    if (tipo === "pendientes_keys") {
      const [rows] = await conn.execute(
        `SELECT emp_id, id_certificacion as id_proceso FROM solicitudes_certificacion 
         WHERE status IN ('pendiente', 'en progreso', 'entrenamiento_aprobado', 'examen_aprobado')`,
      );
      const keys = rows
        .map(
          (r) =>
            `${String(r.emp_id || "").trim()}-${String(r.id_proceso || r.id_certificacion || "").trim()}`,
        )
        .filter((k) => k !== "-");
      return NextResponse.json({ success: true, data: keys });
    }

    // Listar certificaciones por vencer (próximos 30 días) - excluir empleados dados de baja
    if (tipo === "por_vencer") {
      const [rows] = await conn.execute(
        `SELECT ep.*, 
          DATEDIFF(ep.fecha_vencimiento, CURDATE()) as dias_restantes
         FROM empleados_procesos ep 
         WHERE ep.fecha_vencimiento IS NOT NULL 
         AND ep.fecha_vencimiento > CURDATE()
         AND ep.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         ORDER BY ep.fecha_vencimiento ASC`,
      );
      const filtrados = await filtrarPorEmpleadosActivos(conn, rows);
      return NextResponse.json({ success: true, data: filtrados });
    }

    // Listar certificaciones vencidas (incluye las que vencen hoy) - excluir empleados dados de baja
    if (tipo === "vencidas") {
      const [rows] = await conn.execute(
        `SELECT ep.*, DATEDIFF(CURDATE(), ep.fecha_vencimiento) as dias_vencido
         FROM empleados_procesos ep 
         WHERE ep.fecha_vencimiento IS NOT NULL 
         AND ep.fecha_vencimiento <= CURDATE()
         ORDER BY ep.fecha_vencimiento DESC`,
      );
      const filtrados = await filtrarPorEmpleadosActivos(conn, rows);
      return NextResponse.json({ success: true, data: filtrados });
    }

    // Historial de certificaciones (por emp_id y/o id_proceso)
    if (tipo === "historial") {
      let query = "SELECT * FROM certificaciones_historial WHERE 1=1";
      const params = [];
      if (empId) {
        query += " AND emp_id = ?";
        params.push(empId);
      }
      if (idProceso) {
        query += " AND id_proceso = ?";
        params.push(idProceso);
      }
      query += " ORDER BY fecha_certificacion DESC";
      const [rows] = await conn.execute(query, params);
      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Parámetro tipo requerido: vigente, por_vencer, vencidas, historial",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error en API certificaciones:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST - Registrar en historial (nueva o renovación) - usado al asignar/renovar
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      emp_id,
      emp_nombre,
      id_proceso,
      nombre_proceso,
      fecha_vencimiento,
      fecha_certificacion,
      id_solicitud,
      id_enrolamiento,
      tipo = "nueva",
      renovacion_de_id,
      certificado_por,
    } = body;

    if (
      !emp_id ||
      !emp_nombre ||
      !id_proceso ||
      !nombre_proceso ||
      !fecha_vencimiento
    ) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    const fechaCert =
      typeof fecha_certificacion === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha_certificacion.trim())
        ? fecha_certificacion.trim()
        : new Date().toISOString().split("T")[0];
    await conn.execute(
      `INSERT INTO certificaciones_historial 
       (emp_id, emp_nombre, id_proceso, nombre_proceso, fecha_certificacion, fecha_vencimiento, id_solicitud, id_enrolamiento, tipo, renovacion_de_id, certificado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp_id,
        emp_nombre,
        id_proceso,
        nombre_proceso,
        fechaCert,
        fecha_vencimiento,
        id_solicitud || null,
        id_enrolamiento || null,
        tipo,
        renovacion_de_id || null,
        certificado_por || null,
      ],
    );

    return NextResponse.json({
      success: true,
      message: "Registro de historial creado",
    });
  } catch (error) {
    console.error("Error al registrar historial de certificación:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

function toYMD(val) {
  if (val == null || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// DELETE - Eliminar certificación activa y registrar en historial
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { emp_id, id_proceso, eliminado_por } = body;

    if (!emp_id || !id_proceso) {
      return NextResponse.json(
        { success: false, error: "emp_id e id_proceso son requeridos" },
        { status: 400 },
      );
    }

    const [rows] = await conn.execute(
      "SELECT * FROM empleados_procesos WHERE emp_id = ? AND id_proceso = ?",
      [emp_id, id_proceso],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No existe enrolamiento para este empleado y proceso" },
        { status: 404 },
      );
    }

    const ep = rows[0];
    const esCert =
      ep.es_certificacion === 1 ||
      ep.es_certificacion === true ||
      ep.es_certificacion === "1";
    const fechaVencEp = toYMD(ep.fecha_vencimiento);

    if (!esCert && !fechaVencEp) {
      return NextResponse.json(
        {
          success: false,
          error: "Este enrolamiento no tiene certificación activa que eliminar",
        },
        { status: 400 },
      );
    }

    const fechaCertHist = toYMD(ep.fecha) || new Date().toISOString().split("T")[0];
    const fechaVencHist =
      fechaVencEp || fechaCertHist;
    const hoy = new Date().toISOString().split("T")[0];

    await conn.execute(
      `INSERT INTO certificaciones_historial 
       (emp_id, emp_nombre, id_proceso, nombre_proceso, fecha_certificacion, fecha_vencimiento, id_solicitud, id_enrolamiento, tipo, renovacion_de_id, certificado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'eliminacion', NULL, ?)`,
      [
        ep.emp_id,
        ep.emp_nombre,
        ep.id_proceso,
        ep.nombre_proceso,
        hoy,
        fechaVencHist,
        null,
        ep.id ?? null,
        eliminado_por || "Sistema",
      ],
    );

    await conn.execute(
      "DELETE FROM empleados_procesos WHERE emp_id = ? AND id_proceso = ?",
      [emp_id, id_proceso],
    );

    return NextResponse.json({
      success: true,
      message: "Certificación eliminada y registrada en historial",
    });
  } catch (error) {
    console.error("Error al eliminar certificación:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
