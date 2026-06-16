import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Historial de exámenes aplicados (filtrable por emp_id)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");
    const idExamen = searchParams.get("id_examen");
    const fechaDesde = searchParams.get("fecha_desde");
    const fechaHasta = searchParams.get("fecha_hasta");

    let query = `
      SELECT ea.id, ea.id_examen, ea.emp_id, ea.emp_nombre,
             ea.fecha_inicio, ea.fecha_fin, ea.created_at, ea.puntuacion, ea.aprobado,
             e.nombre as nombre_examen, e.descripcion as descripcion_examen
      FROM examenes_aplicados ea
      LEFT JOIN examenes e ON ea.id_examen = e.id
      WHERE 1=1
    `;
    const params = [];

    if (empId && String(empId).trim()) {
      query += " AND ea.emp_id LIKE ?";
      params.push(`%${String(empId).trim()}%`);
    }
    if (idExamen && String(idExamen).trim()) {
      query += " AND ea.id_examen = ?";
      params.push(String(idExamen).trim());
    }
    if (fechaDesde && String(fechaDesde).trim()) {
      query += " AND DATE(ea.fecha_inicio) >= ?";
      params.push(String(fechaDesde).trim());
    }
    if (fechaHasta && String(fechaHasta).trim()) {
      query += " AND DATE(ea.fecha_inicio) <= ?";
      params.push(String(fechaHasta).trim());
    }

    query += " ORDER BY ea.fecha_inicio DESC";

    const [rows] = await conn.execute(query, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener historial de exámenes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el historial" },
      { status: 500 }
    );
  }
}
