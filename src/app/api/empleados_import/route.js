import { NextResponse } from "next/server";
import { conn } from "@/libs/mysql";

function normalizarFecha(val) {
  if (val == null || val === "" || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  // Formato Excel (número de días desde 1900) o "YYYY-MM-DD" o "DD/MM/YYYY"
  if (typeof val === "number") {
    const fecha = new Date((val - 25569) * 86400 * 1000); // Excel epoch
    return fecha.toISOString().slice(0, 10);
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizarValor(val) {
  if (val == null || val === undefined) return null;
  const s = String(val).trim();
  return s || null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { empleados } = body;

    if (!empleados || !Array.isArray(empleados)) {
      return NextResponse.json(
        { success: false, error: "Se requiere un array 'empleados' con los datos" },
        { status: 400 }
      );
    }

    if (empleados.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay empleados para importar" },
        { status: 400 }
      );
    }

    let insertados = 0;
    let actualizados = 0;
    const errores = [];
    let usarFechaAlta = true;

    for (let i = 0; i < empleados.length; i++) {
      const row = empleados[i];
      const numEmpleado = normalizarValor(row.NUM_EMPLEADO ?? row.num_empleado);
      if (!numEmpleado) {
        errores.push({ fila: i + 2, mensaje: "NUM_EMPLEADO vacío" });
        continue;
      }

      const datos = {
        NUM_EMPLEADO: numEmpleado,
        NOMBRE: normalizarValor(row.NOMBRE ?? row.nombre) ?? null,
        APELLIDO1: normalizarValor(row.APELLIDO1 ?? row.apellido1) ?? null,
        APELLIDO2: normalizarValor(row.APELLIDO2 ?? row.apellido2) ?? null,
        FECHA_NACIMIENTO: normalizarFecha(row.FECHA_NACIMIENTO ?? row.fecha_nacimiento) ?? null,
        SEXO: normalizarValor(row.SEXO ?? row.sexo) ?? null,
        FECHA_ALTA: normalizarFecha(row.FECHA_ALTA ?? row.fecha_alta) ?? null,
        FECHA_ANTIGUEDAD: normalizarFecha(row.FECHA_ANTIGUEDAD ?? row.fecha_antiguedad) ?? null,
        CATEGORIA: normalizarValor(row.CATEGORIA ?? row.categoria) ?? null,
        ID_JEFE: normalizarValor(row.ID_JEFE ?? row.id_jefe) ?? null,
        NOMBRE_JEFE: normalizarValor(row.NOMBRE_JEFE ?? row.nombre_jefe) ?? null,
      };

      try {
        const [existe] = await conn.execute(
          "SELECT NUM_EMPLEADO FROM empleados WHERE NUM_EMPLEADO = ?",
          [datos.NUM_EMPLEADO]
        );
        const colsConFechaAlta = [
          datos.NUM_EMPLEADO,
          datos.NOMBRE,
          datos.APELLIDO1,
          datos.APELLIDO2,
          datos.FECHA_NACIMIENTO,
          datos.SEXO,
          datos.FECHA_ALTA,
          datos.FECHA_ANTIGUEDAD,
          datos.CATEGORIA,
          datos.ID_JEFE,
          datos.NOMBRE_JEFE,
        ];
        const colsSinFechaAlta = [
          datos.NUM_EMPLEADO,
          datos.NOMBRE,
          datos.APELLIDO1,
          datos.APELLIDO2,
          datos.FECHA_NACIMIENTO,
          datos.SEXO,
          datos.FECHA_ANTIGUEDAD,
          datos.CATEGORIA,
          datos.ID_JEFE,
          datos.NOMBRE_JEFE,
        ];
        const runUpsert = async () => {
          if (existe.length > 0) {
            if (usarFechaAlta) {
              await conn.execute(
                `UPDATE empleados SET
                  NOMBRE = ?, APELLIDO1 = ?, APELLIDO2 = ?,
                  FECHA_NACIMIENTO = ?, SEXO = ?, FECHA_ALTA = ?, FECHA_ANTIGUEDAD = ?,
                  CATEGORIA = ?, ID_JEFE = ?, NOMBRE_JEFE = ?, activo = 1
                  WHERE NUM_EMPLEADO = ?`,
                [
                  datos.NOMBRE,
                  datos.APELLIDO1,
                  datos.APELLIDO2,
                  datos.FECHA_NACIMIENTO,
                  datos.SEXO,
                  datos.FECHA_ALTA,
                  datos.FECHA_ANTIGUEDAD,
                  datos.CATEGORIA,
                  datos.ID_JEFE,
                  datos.NOMBRE_JEFE,
                  datos.NUM_EMPLEADO,
                ]
              );
            } else {
              await conn.execute(
                `UPDATE empleados SET
                  NOMBRE = ?, APELLIDO1 = ?, APELLIDO2 = ?,
                  FECHA_NACIMIENTO = ?, SEXO = ?, FECHA_ANTIGUEDAD = ?,
                  CATEGORIA = ?, ID_JEFE = ?, NOMBRE_JEFE = ?, activo = 1
                  WHERE NUM_EMPLEADO = ?`,
                [
                  datos.NOMBRE,
                  datos.APELLIDO1,
                  datos.APELLIDO2,
                  datos.FECHA_NACIMIENTO,
                  datos.SEXO,
                  datos.FECHA_ANTIGUEDAD,
                  datos.CATEGORIA,
                  datos.ID_JEFE,
                  datos.NOMBRE_JEFE,
                  datos.NUM_EMPLEADO,
                ]
              );
            }
            actualizados++;
          } else {
            if (usarFechaAlta) {
              await conn.execute(
                `INSERT INTO empleados (
                  NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2,
                  FECHA_NACIMIENTO, SEXO, FECHA_ALTA, FECHA_ANTIGUEDAD,
                  CATEGORIA, ID_JEFE, NOMBRE_JEFE, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                colsConFechaAlta
              );
            } else {
              await conn.execute(
                `INSERT INTO empleados (
                  NUM_EMPLEADO, NOMBRE, APELLIDO1, APELLIDO2,
                  FECHA_NACIMIENTO, SEXO, FECHA_ANTIGUEDAD,
                  CATEGORIA, ID_JEFE, NOMBRE_JEFE, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                colsSinFechaAlta
              );
            }
            insertados++;
          }
        };
        await runUpsert();
      } catch (err) {
        if (usarFechaAlta && /Unknown column 'FECHA_ALTA'/i.test(err.message)) {
          usarFechaAlta = false;
          i--;
          continue;
        }
        errores.push({ fila: i + 2, num_empleado: numEmpleado, mensaje: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${insertados} insertados, ${actualizados} actualizados${errores.length > 0 ? `, ${errores.length} errores` : ""}`,
      data: { insertados, actualizados, errores, total: empleados.length },
    });
  } catch (error) {
    console.error("Error al importar empleados:", error);
    return NextResponse.json(
      { success: false, error: "Error al importar empleados" },
      { status: 500 }
    );
  }
}
