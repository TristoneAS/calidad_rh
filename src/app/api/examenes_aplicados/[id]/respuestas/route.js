import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener las respuestas de una aplicación de examen
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const idAplicacion = parseInt(id, 10);
    if (isNaN(idAplicacion)) {
      return NextResponse.json(
        { success: false, error: "ID de aplicación inválido" },
        { status: 400 }
      );
    }

    const [rows] = await conn.execute(
      `SELECT
        ra.id,
        ra.id_pregunta,
        ra.id_opcion_seleccionada,
        pe.texto_pregunta,
        pe.orden as orden_pregunta,
        o.texto_opcion as texto_respuesta_seleccionada,
        o.es_correcta
      FROM respuestas_aplicacion ra
      JOIN preguntas_examen pe ON pe.id = ra.id_pregunta
      JOIN opciones_respuesta o ON o.id = ra.id_opcion_seleccionada
      WHERE ra.id_aplicacion = ?
      ORDER BY pe.orden ASC, ra.id ASC`,
      [idAplicacion]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener respuestas de aplicación:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las respuestas" },
      { status: 500 }
    );
  }
}
