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

// PUT - Actualizar un examen (nombre, descripción, preguntas y opciones)
export async function PUT(request) {
  const pool = conn;
  let connection;
  try {
    const body = await request.json();
    const { id: idRaw, nombre, descripcion, preguntas } = body;
    const idExamen = Number(idRaw);

    if (!Number.isFinite(idExamen) || idExamen < 1) {
      return NextResponse.json(
        { success: false, error: "ID del examen es requerido" },
        { status: 400 }
      );
    }
    if (!nombre?.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del examen es requerido" },
        { status: 400 }
      );
    }

    const [examenRows] = await pool.execute(
      "SELECT id FROM examenes WHERE id = ? AND activo = 1",
      [idExamen]
    );
    if (examenRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Examen no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const listaPreguntas =
      preguntas && Array.isArray(preguntas) ? preguntas : [];
    const preguntasNorm = [];

    for (let i = 0; i < listaPreguntas.length; i++) {
      const p = listaPreguntas[i];
      const opcionesFiltradas = (p.opciones || [])
        .filter((o) => o.texto_opcion?.trim())
        .map((o, j) => ({
          id: o.id != null ? Number(o.id) : undefined,
          texto_opcion: o.texto_opcion.trim(),
          es_correcta: !!o.es_correcta,
          orden: j,
        }));
      const texto = p.texto_pregunta?.trim();
      if (!texto || opcionesFiltradas.length < 2) continue;

      const tieneCorrecta = opcionesFiltradas.some((o) => o.es_correcta);
      if (!tieneCorrecta) {
        return NextResponse.json(
          {
            success: false,
            error: `La pregunta ${i + 1} debe tener al menos una opción marcada como correcta`,
          },
          { status: 400 }
        );
      }

      preguntasNorm.push({
        id:
          p.id != null && Number(p.id) > 0 ? Number(p.id) : undefined,
        texto_pregunta: texto,
        orden: i,
        es_puntuada: p.es_puntuada !== false ? 1 : 0,
        opciones: opcionesFiltradas,
      });
    }

    if (preguntasNorm.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Debe enviar al menos una pregunta con 2+ opciones y una marcada como correcta",
        },
        { status: 400 }
      );
    }

    const claimedPreguntaIds = preguntasNorm
      .map((p) => p.id)
      .filter((pid) => pid != null && Number(pid) > 0);

    const uniqPregunta = new Set(claimedPreguntaIds.map(Number));
    if (uniqPregunta.size !== claimedPreguntaIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Hay IDs de pregunta duplicados en el envío",
        },
        { status: 400 }
      );
    }

    if (claimedPreguntaIds.length > 0) {
      const ph = claimedPreguntaIds.map(() => "?").join(",");
      const [existingP] = await pool.execute(
        `SELECT id FROM preguntas_examen WHERE id_examen = ? AND id IN (${ph})`,
        [idExamen, ...claimedPreguntaIds.map(Number)]
      );
      if (existingP.length !== claimedPreguntaIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Uno o más IDs de pregunta no pertenecen a este examen",
          },
          { status: 400 }
        );
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      "UPDATE examenes SET nombre = ?, descripcion = ? WHERE id = ? AND activo = 1",
      [nombre.trim(), descripcion?.trim() || "", idExamen]
    );

    const preguntasConId = preguntasNorm.filter((p) => p.id !== undefined);

    const idsToRetain = preguntasConId.map((p) => p.id).filter(Number.isFinite);
    if (idsToRetain.length > 0) {
      const ph = idsToRetain.map(() => "?").join(",");
      await connection.execute(
        `DELETE FROM preguntas_examen WHERE id_examen = ? AND id NOT IN (${ph})`,
        [idExamen, ...idsToRetain]
      );
    } else {
      await connection.execute(
        "DELETE FROM preguntas_examen WHERE id_examen = ?",
        [idExamen]
      );
    }

    for (let pi = 0; pi < preguntasNorm.length; pi++) {
      const p = preguntasNorm[pi];
      let idPregunta = p.id;

      if (
        idPregunta !== undefined &&
        Number.isFinite(idPregunta) &&
        idPregunta > 0
      ) {
        const [belongs] = await connection.execute(
          "SELECT id FROM preguntas_examen WHERE id = ? AND id_examen = ?",
          [idPregunta, idExamen]
        );
        if (belongs.length > 0) {
          await connection.execute(
            "UPDATE preguntas_examen SET texto_pregunta = ?, orden = ?, es_puntuada = ? WHERE id = ? AND id_examen = ?",
            [
              p.texto_pregunta,
              p.orden,
              p.es_puntuada,
              idPregunta,
              idExamen,
            ]
          );
        } else {
          idPregunta = undefined;
        }
      }

      if (idPregunta === undefined) {
        const [insP] = await connection.execute(
          "INSERT INTO preguntas_examen (id_examen, texto_pregunta, orden, es_puntuada) VALUES (?, ?, ?, ?)",
          [idExamen, p.texto_pregunta, p.orden, p.es_puntuada]
        );
        idPregunta = insP.insertId;
      }

      const opts = p.opciones || [];
      const optIdsRetain = opts
        .filter((o) => o.id != null && Number(o.id) > 0 && Number.isFinite(o.id))
        .map((o) => Number(o.id));

      if (optIdsRetain.length > 0) {
        const oph = optIdsRetain.map(() => "?").join(",");
        await connection.execute(
          `DELETE FROM opciones_respuesta WHERE id_pregunta = ? AND id NOT IN (${oph})`,
          [idPregunta, ...optIdsRetain]
        );
      } else {
        await connection.execute(
          "DELETE FROM opciones_respuesta WHERE id_pregunta = ?",
          [idPregunta]
        );
      }

      for (let oi = 0; oi < opts.length; oi++) {
        const op = opts[oi];
        const textoOp = op.texto_opcion;
        const corr = op.es_correcta ? 1 : 0;

        if (op.id != null && Number(op.id) > 0 && Number.isFinite(Number(op.id))) {
          const [own] = await connection.execute(
            "SELECT id FROM opciones_respuesta WHERE id = ? AND id_pregunta = ?",
            [Number(op.id), idPregunta]
          );
          if (own.length > 0) {
            await connection.execute(
              "UPDATE opciones_respuesta SET texto_opcion = ?, es_correcta = ?, orden = ? WHERE id = ? AND id_pregunta = ?",
              [textoOp, corr, oi, Number(op.id), idPregunta]
            );
            continue;
          }
        }

        await connection.execute(
          "INSERT INTO opciones_respuesta (id_pregunta, texto_opcion, es_correcta, orden) VALUES (?, ?, ?, ?)",
          [idPregunta, textoOp, corr, oi]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Examen actualizado correctamente",
      data: { id: idExamen, nombre: nombre.trim() },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("Error al actualizar examen:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el examen" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
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
