import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todos los procesos
export async function GET() {
  try {
    const [rows] = await conn.execute(
      "SELECT id, nombre, descripcion, creado_por, certificable FROM procesos ORDER BY id DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener procesos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los procesos" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo proceso
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, creado_por, certificable } = body;

    // Validar campos requeridos
    if (!nombre || !descripcion || !creado_por) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Valor por defecto para certificable
    const certificableValue =
      certificable && certificable.toLowerCase() === "si" ? "si" : "no";

    const [result] = await conn.execute(
      "INSERT INTO procesos (nombre, descripcion, creado_por, certificable) VALUES (?, ?, ?, ?)",
      [nombre, descripcion, creado_por, certificableValue]
    );

    return NextResponse.json({
      success: true,
      message: "Proceso creado exitosamente",
      data: {
        id: result.insertId,
        nombre,
        descripcion,
        creado_por,
        certificable: certificableValue,
      },
    });
  } catch (error) {
    console.error("Error al crear proceso:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el proceso" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un proceso
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion, certificable } = body;

    // Validar campos requeridos
    if (!id || !nombre || !descripcion) {
      return NextResponse.json(
        { success: false, error: "ID, nombre y descripción son requeridos" },
        { status: 400 }
      );
    }

    const certificableValue =
      certificable && certificable.toLowerCase() === "si" ? "si" : "no";

    await conn.execute(
      "UPDATE procesos SET nombre = ?, descripcion = ?, certificable = ? WHERE id = ?",
      [nombre, descripcion, certificableValue, id]
    );

    return NextResponse.json({
      success: true,
      message: "Proceso actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar proceso:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el proceso" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un proceso
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del proceso es requerido" },
        { status: 400 }
      );
    }

    await conn.execute("DELETE FROM procesos WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Proceso eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar proceso:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el proceso" },
      { status: 500 }
    );
  }
}

















