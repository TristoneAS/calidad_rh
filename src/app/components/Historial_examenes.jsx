"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  TextField,
  Button,
  CircularProgress,
  alpha,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
  success: "#10B981",
  error: "#EF4444",
};

function Historial_examenes() {
  const [registros, setRegistros] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpId, setFiltroEmpId] = useState("");
  const [filtroExamen, setFiltroExamen] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [dialogRespuestas, setDialogRespuestas] = useState({
    open: false,
    idAplicacion: null,
    nombreExamen: "",
    descripcionExamen: "",
    empNombre: "",
    empId: "",
    calificacion: null,
    fechaCertificacion: "",
    respuestas: [],
    loading: false,
  });

  const fetchExamenes = async () => {
    try {
      const res = await axios.get("/api/examenes");
      if (res.data.success) setExamenes(res.data.data || []);
    } catch (_) {
      setExamenes([]);
    }
  };

  useEffect(() => {
    fetchExamenes();
  }, []);

  const fetchHistorial = async (filtros = {}) => {
    try {
      setLoading(true);
      const p = new URLSearchParams();
      if (filtros.empId && String(filtros.empId).trim()) {
        p.set("emp_id", String(filtros.empId).trim());
      }
      if (filtros.idExamen && String(filtros.idExamen).trim()) {
        p.set("id_examen", String(filtros.idExamen).trim());
      }
      if (filtros.fechaDesde && String(filtros.fechaDesde).trim()) {
        p.set("fecha_desde", String(filtros.fechaDesde).trim());
      }
      if (filtros.fechaHasta && String(filtros.fechaHasta).trim()) {
        p.set("fecha_hasta", String(filtros.fechaHasta).trim());
      }
      const query = p.toString() ? `?${p.toString()}` : "";
      const res = await axios.get(`/api/examenes_aplicados${query}`);
      if (res.data.success) setRegistros(res.data.data || []);
      else showAlert("Error al cargar el historial", "error");
    } catch (err) {
      showAlert("Error al cargar el historial", "error");
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial(filtrosAplicados);
  }, [filtrosAplicados]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      empId: filtroEmpId,
      idExamen: filtroExamen,
      fechaDesde: filtroFechaDesde,
      fechaHasta: filtroFechaHasta,
    });
  };

  const limpiarFiltros = () => {
    setFiltroEmpId("");
    setFiltroExamen("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setFiltrosAplicados({});
  };

  const hayFiltros = filtroEmpId || filtroExamen || filtroFechaDesde || filtroFechaHasta;

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const abrirRespuestas = async (row) => {
    const fecha = row.fecha_inicio ?? row.created_at ?? row.fecha_fin ?? "";
    setDialogRespuestas((p) => ({
      ...p,
      open: true,
      idAplicacion: row.id,
      nombreExamen: row.nombre_examen || "Examen",
      descripcionExamen: row.descripcion_examen || "",
      empNombre: row.emp_nombre || row.emp_id || "",
      empId: row.emp_id || "",
      calificacion: row.puntuacion,
      fechaCertificacion: formatearFecha(fecha),
      respuestas: [],
      loading: true,
    }));
    try {
      const res = await axios.get(`/api/examenes_aplicados/${row.id}/respuestas`);
      if (res.data.success) {
        setDialogRespuestas((p) => ({
          ...p,
          respuestas: res.data.data || [],
          loading: false,
        }));
      } else {
        showAlert("Error al cargar las respuestas", "error");
        setDialogRespuestas((p) => ({ ...p, loading: false }));
      }
    } catch (err) {
      showAlert("Error al cargar las respuestas", "error");
      setDialogRespuestas((p) => ({ ...p, loading: false }));
    }
  };

  const cerrarRespuestas = () => {
    setDialogRespuestas({
      open: false,
      idAplicacion: null,
      nombreExamen: "",
      descripcionExamen: "",
      empNombre: "",
      empId: "",
      calificacion: null,
      fechaCertificacion: "",
      respuestas: [],
      loading: false,
    });
  };

  const descargarWord = async () => {
    const { empNombre, empId, calificacion, fechaCertificacion, nombreExamen, descripcionExamen, respuestas } = dialogRespuestas;
    let logoImageRun = null;
    try {
      const logoRes = await fetch("/tristone_logo_head.png");
      const logoBuffer = await logoRes.arrayBuffer();
      logoImageRun = new ImageRun({
        type: "png",
        data: logoBuffer,
        transformation: { width: 120, height: 80 },
      });
    } catch (_) {
      // Si falla la carga del logo, continuar sin él
    }
    const children = [
      ...(logoImageRun
        ? [
            new Paragraph({
              children: [logoImageRun],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),
          ]
        : []),
      new Paragraph({
        children: [
          new TextRun({
            text: "Certificación de Examen",
            bold: true,
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Nombre: ", bold: true }),
          new TextRun(empNombre || "N/A"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Calificación: ", bold: true }),
          new TextRun(calificacion != null ? `${calificacion}%` : "N/A"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Fecha de certificación: ", bold: true }),
          new TextRun(fechaCertificacion || "N/A"),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Número de gafete: ", bold: true }),
          new TextRun(empId || "N/A"),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Examen: ${nombreExamen}`,
            bold: true,
          }),
        ],
        spacing: { after: 400 },
      }),
    ];
    respuestas.forEach((r, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${r.texto_pregunta || ""}`,
              bold: true,
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `   Respuesta: ${r.texto_respuesta_seleccionada || ""} (${r.es_correcta ? "Correcta" : "Incorrecta"})`,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
    if (descripcionExamen && String(descripcionExamen).trim()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: String(descripcionExamen).trim(),
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 600, after: 200 },
        })
      );
    }
    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });
    const blob = await Packer.toBlob(doc);
    const nombreArchivo = `Certificacion_${(empNombre || "empleado").replace(/\s+/g, "_").slice(0, 30)}_${(nombreExamen || "examen").replace(/\s+/g, "_").slice(0, 20)}.docx`;
    saveAs(blob, nombreArchivo);
  };

  const formatearFecha = (fecha) => {
    if (fecha == null || fecha === "") return "N/A";
    try {
      const fechaStr = String(fecha);
      // MySQL datetime "YYYY-MM-DD HH:mm:ss" - normalizar para compatibilidad
      const d = fechaStr.includes("T") ? new Date(fechaStr) : new Date(fechaStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "emp_id", headerName: "ID Empleado", width: 120 },
    { field: "emp_nombre", headerName: "Nombre Empleado", flex: 1, minWidth: 180 },
    { field: "nombre_examen", headerName: "Examen", flex: 1, minWidth: 200 },
    {
      field: "fecha_inicio",
      headerName: "Fecha aplicación",
      width: 160,
      renderCell: (params) => {
        const row = params.row;
        const fecha = row.fecha_inicio ?? row.created_at ?? row.fecha_fin;
        return (
          <Typography variant="body2">
            {formatearFecha(fecha)}
          </Typography>
        );
      },
    },
    {
      field: "puntuacion",
      headerName: "Puntuación",
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value != null ? `${params.value}%` : "-"}
        </Typography>
      ),
    },
    {
      field: "aprobado",
      headerName: "Resultado",
      width: 120,
      renderCell: (params) => {
        const aprobado = params.value === 1 || params.value === true;
        return (
          <Chip
            size="small"
            icon={aprobado ? <CheckCircleIcon /> : <CancelIcon />}
            label={aprobado ? "Aprobado" : "No aprobado"}
            color={aprobado ? "success" : "error"}
            variant="outlined"
          />
        );
      },
    },
    {
      field: "acciones",
      headerName: "Respuestas",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={(e) => {
            e.stopPropagation();
            abrirRespuestas(params.row);
          }}
          sx={{
            borderColor: colors.primary.main,
            color: colors.primary.main,
            "&:hover": {
              borderColor: colors.primary.dark,
              bgcolor: alpha(colors.primary.main, 0.08),
            },
          }}
        >
          Ver
        </Button>
      ),
    },
  ];

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
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <HistoryIcon
                sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
              />
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  color={colors.primary.dark}
                >
                  Historial de exámenes aplicados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consulta los exámenes presentados por los empleados
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", maxWidth: 900 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <TextField
                  label="Número de empleado"
                  placeholder="Ej: 12345"
                  value={filtroEmpId}
                  onChange={(e) => setFiltroEmpId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), aplicarFiltros())}
                  size="small"
                  sx={{ minWidth: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Examen</InputLabel>
                  <Select
                    value={filtroExamen}
                    label="Examen"
                    onChange={(e) => setFiltroExamen(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {examenes.map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Fecha desde"
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 140 }}
                />
                <TextField
                  label="Fecha hasta"
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 140 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SearchIcon />}
                  onClick={aplicarFiltros}
                  sx={{ bgcolor: colors.primary.main, "&:hover": { bgcolor: colors.primary.dark } }}
                >
                  Filtrar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={limpiarFiltros}
                  disabled={!hayFiltros}
                >
                  Limpiar
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ height: 550 }}>
            <DataGrid
              rows={registros}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              loading={loading}
              disableRowSelectionOnClick
              sx={{
                border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: alpha(colors.primary.main, 0.08),
                  fontWeight: 600,
                  fontSize: "0.9rem",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: alpha(colors.primary.main, 0.04),
                },
              }}
            />
          </Box>

          {(filtrosAplicados.empId || filtrosAplicados.idExamen || filtrosAplicados.fechaDesde || filtrosAplicados.fechaHasta) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Mostrando {registros.length} registro(s) con filtros aplicados
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogRespuestas.open}
        onClose={cerrarRespuestas}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 40px rgba(59, 130, 246, 0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" color={colors.primary.dark} fontWeight={600}>
              Respuestas del examen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dialogRespuestas.nombreExamen} — {dialogRespuestas.empNombre}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {dialogRespuestas.respuestas.length > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={descargarWord}
                sx={{
                  bgcolor: colors.primary.main,
                  "&:hover": { bgcolor: colors.primary.dark },
                }}
              >
                Descargar Word
              </Button>
            )}
            <IconButton onClick={cerrarRespuestas} size="small" aria-label="Cerrar">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dialogRespuestas.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: colors.primary.main }} />
            </Box>
          ) : dialogRespuestas.respuestas.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              No hay respuestas registradas para esta aplicación.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {dialogRespuestas.respuestas.map((r, idx) => (
                <Box
                  key={r.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(colors.primary.main, 0.04),
                    borderLeft: `4px solid ${r.es_correcta ? colors.success : colors.error}`,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                    {idx + 1}. {r.texto_pregunta}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Respuesta: {r.texto_respuesta_seleccionada}
                  </Typography>
                  <Chip
                    size="small"
                    icon={r.es_correcta ? <CheckCircleIcon /> : <CancelIcon />}
                    label={r.es_correcta ? "Correcta" : "Incorrecta"}
                    color={r.es_correcta ? "success" : "error"}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Historial_examenes;
