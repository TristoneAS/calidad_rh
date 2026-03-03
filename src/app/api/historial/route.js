import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener historial por id_solicitud
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idSolicitud = searchParams.get("id_solicitud");

    if (!idSolicitud) {
      return NextResponse.json(
        { success: false, error: "id_solicitud es requerido" },
        { status: 400 }
      );
    }

    const [rows] = await conn.execute(
      "SELECT id, id_solicitud, empleado, comentario, fecha FROM historial WHERE id_solicitud = ? ORDER BY fecha ASC",
      [idSolicitud]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el historial" },
      { status: 500 }
    );
  }
}

// POST - Insertar un registro en historial
export async function POST(request) {
  try {
    const body = await request.json();
    const { id_solicitud, empleado, comentario } = body;

    if (!id_solicitud || !empleado || comentario === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "id_solicitud, empleado y comentario son requeridos",
        },
        { status: 400 }
      );
    }

    await conn.execute(
      "INSERT INTO historial (id_solicitud, empleado, comentario, fecha) VALUES (?, ?, ?, NOW())",
      [id_solicitud, empleado, comentario || ""]
    );

    return NextResponse.json({
      success: true,
      message: "Registro de historial guardado correctamente",
    });
  } catch (error) {
    console.error("Error al guardar historial:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar en historial" },
      { status: 500 }
    );
  }
}
