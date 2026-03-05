import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// POST - Aplicar un examen (enviar respuestas y calcular puntuación)
export async function POST(request) {
  try {
    const body = await request.json();
    const { id_examen, emp_id, emp_nombre, respuestas, fecha_aplicacion } = body;

    if (!id_examen || !emp_id || !respuestas || !Array.isArray(respuestas)) {
      return NextResponse.json(
        {
          success: false,
          error: "id_examen, emp_id y respuestas (array) son requeridos",
        },
        { status: 400 }
      );
    }

    const fechaInicio = fecha_aplicacion && String(fecha_aplicacion).trim()
      ? String(fecha_aplicacion).trim().replace("T", " ").slice(0, 19)
      : null;

    const [resultAplicacion] = await conn.execute(
      fechaInicio
        ? "INSERT INTO examenes_aplicados (id_examen, emp_id, emp_nombre, fecha_inicio) VALUES (?, ?, ?, ?)"
        : "INSERT INTO examenes_aplicados (id_examen, emp_id, emp_nombre, fecha_inicio) VALUES (?, ?, ?, NOW())",
      fechaInicio
        ? [id_examen, emp_id, emp_nombre || "Empleado", fechaInicio]
        : [id_examen, emp_id, emp_nombre || "Empleado"]
    );
    const idAplicacion = resultAplicacion.insertId;

    const [preguntasRows] = await conn.execute(
      "SELECT p.id, COALESCE(p.es_puntuada, 1) as es_puntuada FROM preguntas_examen p WHERE p.id_examen = ?",
      [id_examen]
    );
    const preguntasMap = new Map(preguntasRows.map((r) => [r.id, r.es_puntuada === 1]));
    const totalPuntuadas = preguntasRows.filter((r) => r.es_puntuada === 1).length;

    let correctas = 0;

    for (const r of respuestas) {
      const { id_pregunta, id_opcion_seleccionada } = r;
      if (!id_pregunta || !id_opcion_seleccionada) continue;

      await conn.execute(
        "INSERT INTO respuestas_aplicacion (id_aplicacion, id_pregunta, id_opcion_seleccionada) VALUES (?, ?, ?)",
        [idAplicacion, id_pregunta, id_opcion_seleccionada]
      );

      if (!preguntasMap.get(id_pregunta)) continue;

      const [opcionRows] = await conn.execute(
        "SELECT es_correcta FROM opciones_respuesta WHERE id = ?",
        [id_opcion_seleccionada]
      );
      if (opcionRows.length > 0 && opcionRows[0].es_correcta === 1) {
        correctas++;
      }
    }

    const total = totalPuntuadas;
    const puntuacion = total > 0 ? Math.round((correctas / total) * 100) : 0;
    const aprobado = puntuacion >= 70 ? 1 : 0;

    await conn.execute(
      fechaInicio
        ? "UPDATE examenes_aplicados SET fecha_fin = ?, puntuacion = ?, aprobado = ? WHERE id = ?"
        : "UPDATE examenes_aplicados SET fecha_fin = NOW(), puntuacion = ?, aprobado = ? WHERE id = ?",
      fechaInicio
        ? [fechaInicio, puntuacion, aprobado, idAplicacion]
        : [puntuacion, aprobado, idAplicacion]
    );

    return NextResponse.json({
      success: true,
      message: "Examen enviado correctamente",
      data: {
        id_aplicacion: idAplicacion,
        puntuacion,
        correctas,
        total,
        aprobado: aprobado === 1,
      },
    });
  } catch (error) {
    console.error("Error al aplicar examen:", error);
    return NextResponse.json(
      { success: false, error: "Error al aplicar el examen" },
      { status: 500 }
    );
  }
}
