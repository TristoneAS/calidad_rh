// lib/db.js
import mysql from "mysql2/promise";

// Conexión a certificaciones_calidad (solicitudes, historial, etc.)
export const conn = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE_PDC,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Conexión a base de datos empleados (del_empleados)
export const connEmpleados = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE_EMP,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
