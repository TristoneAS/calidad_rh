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
import PersonOffIcon from "@mui/icons-material/PersonOff";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import * as XLSX from "xlsx";
import axios from "axios";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
  error: "#EF4444",
  success: "#10B981",
};

const HEADERS_NUM_EMPLEADO = ["NUM_EMPLEADO", "NUMERO_EMPLEADO", "EMP_ID", "ID_EMPLEADO", "NO_EMPLEADO"];

function Cargar_bajas() {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [numerosEmpleado, setNumerosEmpleado] = useState([]);
  const [resultado, setResultado] = useState(null);
  const fileInputRef = useRef(null);

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 6000);
  };

  const normalizarHeaders = (headers) =>
    headers.map((h) =>
      String(h || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
    );

  const encontrarColumnaNumEmpleado = (headersNorm, headersOriginales) => {
    for (const candidato of HEADERS_NUM_EMPLEADO) {
      const idx = headersNorm.findIndex((h) => h === candidato);
      if (idx >= 0) return headersOriginales[idx];
    }
    return headersOriginales[0] || "NUM_EMPLEADO";
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
          const colNumEmpleado = encontrarColumnaNumEmpleado(headersNorm, headersOriginales);
          const numeros = json
            .map((row) => String(row[colNumEmpleado] ?? "").trim())
            .filter((n) => n.length > 0);
          resolve([...new Set(numeros)]);
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
    setNumerosEmpleado([]);
    try {
      const numeros = await parsearArchivo(file);
      setNumerosEmpleado(numeros);
      if (numeros.length > 0) {
        showAlert(`${numeros.length} empleado(s) listos para dar de baja.`, "success");
      } else {
        showAlert("No se encontraron números de empleado en el archivo.", "warning");
      }
    } catch (err) {
      showAlert(err.message || "Error al procesar el archivo", "error");
    }
    e.target.value = "";
  };

  const handleProcesarBajas = async () => {
    if (numerosEmpleado.length === 0) {
      showAlert("Primero cargue un archivo con números de empleado", "warning");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await axios.post("/api/empleados_bajas", {
        numeros_empleado: numerosEmpleado,
      });
      if (res.data.success) {
        setResultado(res.data.data);
        showAlert(res.data.message, "success");
      } else {
        showAlert(res.data.error || "Error al procesar bajas", "error");
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Error al procesar las bajas", "error");
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
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
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
              borderBottom: `2px solid ${alpha(colors.error, 0.2)}`,
            }}
          >
            <PersonOffIcon sx={{ fontSize: 32, color: colors.error, mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight={600} color={colors.error}>
                Bajas de empleados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cargue un archivo Excel o CSV con números de empleado. Se marcarán como inactivos (activo=0) sin eliminar registros.
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El archivo debe tener una columna con el número de empleado (NUM_EMPLEADO, EMP_ID, etc.). Solo se procesará esa columna.
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
              color="error"
              disabled={loading || numerosEmpleado.length === 0}
              onClick={handleProcesarBajas}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  Procesando...
                </>
              ) : (
                "Procesar bajas"
              )}
            </Button>
          </Box>

          {resultado && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Marcados como inactivos: {resultado.actualizados} | No encontrados: {resultado.no_encontrados?.length || 0}
                {resultado.no_encontrados?.length > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    No encontrados: {resultado.no_encontrados.slice(0, 10).join(", ")}
                    {resultado.no_encontrados.length > 10 && ` ... y ${resultado.no_encontrados.length - 10} más`}
                  </Typography>
                )}
              </Typography>
            </Alert>
          )}

          {numerosEmpleado.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Vista previa ({numerosEmpleado.length} números — mostrando hasta 20)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300, border: `1px solid ${alpha(colors.error, 0.2)}` }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: alpha(colors.error, 0.08) }}>
                        NUM_EMPLEADO
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {numerosEmpleado.slice(0, 20).map((num, i) => (
                      <TableRow key={i}>
                        <TableCell>{num}</TableCell>
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

export default Cargar_bajas;
