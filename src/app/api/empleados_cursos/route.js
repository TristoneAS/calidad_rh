import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todos los enrolamientos o verificar existencia
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");
    const idCurso = searchParams.get("id_curso");
    const verificar = searchParams.get("verificar");

    // Si se solicita verificación de existencia
    if (verificar === "true" && empId && idCurso) {
      const [rows] = await conn.execute(
        "SELECT * FROM empleados_cursos WHERE emp_id = ? AND id_curso = ?",
        [empId, idCurso]
      );
      return NextResponse.json({ 
        success: true, 
        existe: rows.length > 0,
        data: rows.length > 0 ? rows[0] : null
      });
    }

    // Obtener todos los enrolamientos
    const [rows] = await conn.execute(
      "SELECT * FROM empleados_cursos ORDER BY fecha DESC"
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

// POST - Crear uno o múltiples enrolamientos
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
      if (!enrolamiento.emp_id || !enrolamiento.emp_nombre || !enrolamiento.id_curso || !enrolamiento.nombre_curso) {
        return NextResponse.json(
          { success: false, error: "Todos los campos son requeridos en cada enrolamiento" },
          { status: 400 }
        );
      }
    }

    // Insertar todos los enrolamientos
    const insertPromises = enrolamientos.map((enrolamiento) => {
      return conn.execute(
        "INSERT INTO empleados_cursos (emp_id, emp_nombre, id_curso, nombre_curso, descripcion_curso, fecha, enrolado_por) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)",
        [
          enrolamiento.emp_id,
          enrolamiento.emp_nombre,
          enrolamiento.id_curso,
          enrolamiento.nombre_curso,
          enrolamiento.descripcion_curso || "",
          enrolamiento.enrolado_por || "Alex",
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

