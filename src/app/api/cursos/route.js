import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todos los cursos
export async function GET() {
  try {
    const [rows] = await conn.execute(
      "SELECT id, nombre, descripcion, creado_por FROM cursos ORDER BY id DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los cursos" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo curso
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, creado_por } = body;

    // Validar campos requeridos
    if (!nombre || !descripcion || !creado_por) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const [result] = await conn.execute(
      "INSERT INTO cursos (nombre, descripcion, creado_por) VALUES (?, ?, ?)",
      [nombre, descripcion, creado_por]
    );

    return NextResponse.json({
      success: true,
      message: "Curso creado exitosamente",
      data: { id: result.insertId, nombre, descripcion, creado_por },
    });
  } catch (error) {
    console.error("Error al crear curso:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el curso" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un curso
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion } = body;

    // Validar campos requeridos
    if (!id || !nombre || !descripcion) {
      return NextResponse.json(
        { success: false, error: "ID, nombre y descripción son requeridos" },
        { status: 400 }
      );
    }

    await conn.execute(
      "UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?",
      [nombre, descripcion, id]
    );

    return NextResponse.json({
      success: true,
      message: "Curso actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el curso" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un curso
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del curso es requerido" },
        { status: 400 }
      );
    }

    await conn.execute("DELETE FROM cursos WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Curso eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el curso" },
      { status: 500 }
    );
  }
}
