import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Listar todos los exámenes o obtener uno por id con preguntas y opciones
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const paraAplicar = searchParams.get("para_aplicar") === "1";

    if (id) {
      // Obtener un examen con sus preguntas y opciones
      const [examenRows] = await conn.execute(
        "SELECT * FROM examenes WHERE id = ? AND activo = 1",
        [id]
      );
      if (examenRows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Examen no encontrado" },
          { status: 404 }
        );
      }
      const examen = examenRows[0];

      const [preguntasRows] = await conn.execute(
        "SELECT * FROM preguntas_examen WHERE id_examen = ? ORDER BY orden ASC, id ASC",
        [id]
      );

      const preguntas = [];
      for (const p of preguntasRows) {
        const selectCols = paraAplicar ? "id, texto_opcion, orden" : "*";
        const [opcionesRows] = await conn.execute(
          `SELECT ${selectCols} FROM opciones_respuesta WHERE id_pregunta = ? ORDER BY orden ASC, id ASC`,
          [p.id]
        );
        preguntas.push({
          ...p,
          opciones: opcionesRows,
        });
      }

      return NextResponse.json({
        success: true,
        data: { ...examen, preguntas },
      });
    }

    // Listar todos los exámenes activos
    const [rows] = await conn.execute(
      "SELECT id, nombre, descripcion, creado_por, activo, created_at FROM examenes WHERE activo = 1 ORDER BY id DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener exámenes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los exámenes" },
      { status: 500 }
    );
  }
}

// POST - Crear un examen con preguntas y opciones
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, creado_por, preguntas } = body;

    if (!nombre?.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del examen es requerido" },
        { status: 400 }
      );
    }

    const [resultExamen] = await conn.execute(
      "INSERT INTO examenes (nombre, descripcion, creado_por) VALUES (?, ?, ?)",
      [nombre.trim(), descripcion?.trim() || "", creado_por || "Sistema"]
    );
    const idExamen = resultExamen.insertId;

    if (preguntas && Array.isArray(preguntas) && preguntas.length > 0) {
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const textoPregunta = p.texto_pregunta?.trim();
        if (!textoPregunta) continue;

        const esPuntuada = p.es_puntuada !== false ? 1 : 0;
        const [resultPreg] = await conn.execute(
          "INSERT INTO preguntas_examen (id_examen, texto_pregunta, orden, es_puntuada) VALUES (?, ?, ?, ?)",
          [idExamen, textoPregunta, p.orden ?? i, esPuntuada]
        );
        const idPregunta = resultPreg.insertId;

        const opciones = p.opciones || [];
        for (let j = 0; j < opciones.length; j++) {
          const op = opciones[j];
          const textoOpcion = op.texto_opcion?.trim();
          if (!textoOpcion) continue;

          await conn.execute(
            "INSERT INTO opciones_respuesta (id_pregunta, texto_opcion, es_correcta, orden) VALUES (?, ?, ?, ?)",
            [idPregunta, textoOpcion, op.es_correcta ? 1 : 0, op.orden ?? j]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Examen creado exitosamente",
      data: { id: idExamen, nombre: nombre.trim() },
    });
  } catch (error) {
    console.error("Error al crear examen:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el examen" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar (desactivar) un examen
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del examen es requerido" },
        { status: 400 }
      );
    }

    await conn.execute("UPDATE examenes SET activo = 0 WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Examen dado de baja exitosamente",
    });
  } catch (error) {
    console.error("Error al dar de baja examen:", error);
    return NextResponse.json(
      { success: false, error: "Error al dar de baja el examen" },
      { status: 500 }
    );
  }
}
