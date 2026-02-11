import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

// GET - Obtener todos los líderes de calidad o uno por emp_id
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");

    if (empId) {
      const [rows] = await conn.execute(
        "SELECT emp_id, emp_nombre, area FROM lideres_calidad WHERE emp_id = ?",
        [empId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Líder de calidad no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: rows[0] });
    }

    const [rows] = await conn.execute(
      "SELECT emp_id, emp_nombre, area FROM lideres_calidad ORDER BY emp_nombre ASC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al obtener líderes de calidad:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los líderes de calidad" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo líder de calidad
export async function POST(request) {
  try {
    const body = await request.json();
    const { emp_id, emp_nombre, area } = body;

    if (!emp_id || !emp_nombre || !area) {
      return NextResponse.json(
        {
          success: false,
          error: "emp_id, emp_nombre y area son requeridos",
        },
        { status: 400 }
      );
    }

    await conn.execute(
      "INSERT INTO lideres_calidad (emp_id, emp_nombre, area) VALUES (?, ?, ?)",
      [emp_id, emp_nombre, area]
    );

    return NextResponse.json({
      success: true,
      message: "Líder de calidad agregado correctamente",
    });
  } catch (error) {
    console.error("Error al crear líder de calidad:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear el líder de calidad" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un líder de calidad (por emp_id)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { emp_id, emp_nombre, area } = body;

    if (!emp_id || !emp_nombre || !area) {
      return NextResponse.json(
        {
          success: false,
          error: "emp_id, emp_nombre y area son requeridos",
        },
        { status: 400 }
      );
    }

    const [result] = await conn.execute(
      "UPDATE lideres_calidad SET emp_nombre = ?, area = ? WHERE emp_id = ?",
      [emp_nombre, area, emp_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Líder de calidad no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Líder de calidad actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar líder de calidad:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el líder de calidad" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un líder de calidad por emp_id
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");

    if (!empId) {
      return NextResponse.json(
        { success: false, error: "emp_id es requerido" },
        { status: 400 }
      );
    }

    const [result] = await conn.execute(
      "DELETE FROM lideres_calidad WHERE emp_id = ?",
      [empId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Líder de calidad no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Líder de calidad eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar líder de calidad:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el líder de calidad" },
      { status: 500 }
    );
  }
}

