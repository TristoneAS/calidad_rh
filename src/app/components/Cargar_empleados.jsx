"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import axios from "axios";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
  success: "#10B981",
  error: "#EF4444",
};

const HEADERS_ESPERADOS = [
  "NUM_EMPLEADO",
  "NOMBRE",
  "APELLIDO1",
  "APELLIDO2",
  "FECHA_NACIMIENTO",
  "SEXO",
  "FECHA_ALTA",
  "FECHA_ANTIGUEDAD",
  "CATEGORIA",
  "ID_JEFE",
  "NOMBRE_JEFE",
];

function Cargar_empleados() {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [resultado, setResultado] = useState(null);
  const fileInputRef = useRef(null);

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 6000);
  };

  const normalizarHeaders = (headers) => {
    return headers.map((h) =>
      String(h || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
    );
  };

  const parsearArchivo = (file) => {
    const ext = (file?.name || "").toLowerCase();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;

          let workbook;
          if (ext.endsWith(".csv")) {
            const text = typeof data === "string" ? data : new TextDecoder().decode(data);
            workbook = XLSX.read(text, { type: "string", raw: false });
          } else {
            workbook = XLSX.read(data, { type: "array", raw: false });
          }

          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

          if (json.length === 0) {
            reject(new Error("El archivo no contiene filas de datos"));
            return;
          }

          const headersOriginales = Object.keys(json[0]);
          const headersNorm = normalizarHeaders(headersOriginales);
          const mapeo = {};
          headersOriginales.forEach((h, i) => {
            mapeo[headersNorm[i]] = h;
          });

          const filas = json.map((row, idx) => {
            const obj = {};
            HEADERS_ESPERADOS.forEach((campo) => {
              const valor = row[mapeo[campo]] ?? row[campo] ?? row[campo.toLowerCase()] ?? "";
              obj[campo] = valor;
            });
            return obj;
          });

          resolve(filas);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));

      if (ext.endsWith(".csv")) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const ext = (file.name || "").toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
      showAlert("Formato no válido. Use Excel (.xlsx, .xls) o CSV (.csv)", "error");
      return;
    }

    setResultado(null);
    setEmpleados([]);

    try {
      const datos = await parsearArchivo(file);
      setEmpleados(datos);
      if (datos.length > 0) {
        showAlert(`Archivo cargado: ${datos.length} empleados listos para importar.`, "success");
      }
    } catch (err) {
      showAlert(err.message || "Error al procesar el archivo", "error");
    }

    e.target.value = "";
  };

  const handleImportar = async () => {
    if (empleados.length === 0) {
      showAlert("Primero cargue un archivo Excel o CSV", "warning");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const res = await axios.post("/api/empleados_import", { empleados });
      if (res.data.success) {
        setResultado(res.data.data);
        showAlert(res.data.message, "success");
      } else {
        showAlert(res.data.error || "Error al importar", "error");
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Error al importar empleados", "error");
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Card
        sx={{
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            }}
          >
            <PeopleIcon sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight={600} color={colors.primary.dark}>
                Cargar empleados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Importe empleados desde archivo Excel (.xlsx, .xls) o CSV con los headers requeridos
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Headers requeridos:{" "}
            <Box component="span" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
              {HEADERS_ESPERADOS.join(", ")}
            </Box>
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              component="a"
              href="/Formato empleados.xlsx"
              download="Formato empleados.xlsx"
              startIcon={<DownloadIcon />}
              sx={{
                borderColor: colors.primary.main,
                color: colors.primary.main,
                "&:hover": { borderColor: colors.primary.dark, color: colors.primary.dark },
              }}
            >
              Descargar formato
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                bgcolor: colors.primary.main,
                "&:hover": { bgcolor: colors.primary.dark },
              }}
            >
              Seleccionar archivo
            </Button>
            <Button
              variant="contained"
              disabled={loading || empleados.length === 0}
              onClick={handleImportar}
              sx={{
                bgcolor: colors.secondary.main,
                "&:hover": { bgcolor: colors.secondary.dark },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  Importando...
                </>
              ) : (
                "Importar empleados"
              )}
            </Button>
          </Box>

          {resultado && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Total procesados: {resultado.total} | Insertados: {resultado.insertados} |
                Actualizados: {resultado.actualizados}
                {resultado.errores?.length > 0 && ` | Errores: ${resultado.errores.length}`}
              </Typography>
              {resultado.errores?.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {resultado.errores.slice(0, 5).map((e, i) => (
                    <span key={i}>
                      Fila {e.fila}: {e.mensaje}
                      <br />
                    </span>
                  ))}
                  {resultado.errores.length > 5 && `... y ${resultado.errores.length - 5} más`}
                </Typography>
              )}
            </Alert>
          )}

          {empleados.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Vista previa ({empleados.length} empleados — mostrando hasta 15)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400, border: `1px solid ${alpha(colors.primary.main, 0.2)}` }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {HEADERS_ESPERADOS.map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, bgcolor: alpha(colors.primary.main, 0.08) }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empleados.slice(0, 15).map((row, i) => (
                      <TableRow key={i}>
                        {HEADERS_ESPERADOS.map((campo) => (
                          <TableCell key={campo}>{row[campo] ?? "-"}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Cargar_empleados;
