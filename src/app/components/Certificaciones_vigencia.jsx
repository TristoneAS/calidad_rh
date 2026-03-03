"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
  warning: "#F59E0B",
  error: "#EF4444",
  success: "#10B981",
};

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function Certificaciones_vigencia() {
  const [tabValue, setTabValue] = useState(0);
  const [porVencer, setPorVencer] = useState([]);
  const [vencidas, setVencidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [historialDialog, setHistorialDialog] = useState({
    open: false,
    empId: null,
    idProceso: null,
    registros: [],
    loading: false,
  });
  const [renovarDialog, setRenovarDialog] = useState({
    open: false,
    certificacion: null,
    loading: false,
    yaEnviada: false,
  });
  const [idsConSolicitudPendiente, setIdsConSolicitudPendiente] = useState(new Set());

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const [resPorVencer, resVencidas, resPendientes] = await Promise.all([
        axios.get("/api/certificaciones?tipo=por_vencer"),
        axios.get("/api/certificaciones?tipo=vencidas"),
        axios.get("/api/certificaciones?tipo=pendientes_keys"),
      ]);
      if (resPorVencer.data.success) setPorVencer(resPorVencer.data.data || []);
      if (resVencidas.data.success) setVencidas(resVencidas.data.data || []);

      const keys = resPendientes.data.success && Array.isArray(resPendientes.data.data)
        ? resPendientes.data.data
        : [];
      setIdsConSolicitudPendiente(new Set(keys));
    } catch (error) {
      console.error("Error al cargar certificaciones:", error);
      showAlert("Error al cargar las certificaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const abrirHistorial = async (empId, idProceso) => {
    setHistorialDialog({
      open: true,
      empId,
      idProceso,
      registros: [],
      loading: true,
    });
    try {
      const res = await axios.get(
        `/api/certificaciones?tipo=historial&emp_id=${empId}&id_proceso=${idProceso}`
      );
      if (res.data.success) {
        setHistorialDialog((p) => ({
          ...p,
          registros: res.data.data || [],
          loading: false,
        }));
      }
    } catch (error) {
      showAlert("Error al cargar historial", "error");
      setHistorialDialog((p) => ({ ...p, loading: false }));
    }
  };

  const tieneSolicitudPendiente = (empId, idProceso) => {
    const e = String(empId ?? "").trim();
    const p = String(idProceso ?? "").trim();
    return e && p && idsConSolicitudPendiente.has(`${e}-${p}`);
  };

  const abrirRenovar = (cert) => {
    const yaEnviada = tieneSolicitudPendiente(cert.emp_id, cert.id_proceso);
    setRenovarDialog({ open: true, certificacion: cert, loading: false, yaEnviada });
  };

  const confirmarRenovar = async () => {
    const { certificacion } = renovarDialog;
    if (!certificacion) return;

    try {
      setRenovarDialog((p) => ({ ...p, loading: true }));

      const resVerificar = await axios.get(
        `/api/solicitudes_certificacion?verificar=true&emp_id=${certificacion.emp_id}&id_certificacion=${certificacion.id_proceso}`
      );
      if (resVerificar.data.existe) {
        showAlert("Ya se mandó a renovación para esta certificación.", "info");
        const clave = `${String(certificacion.emp_id ?? "").trim()}-${String(certificacion.id_proceso ?? certificacion.id_certificacion ?? "").trim()}`;
        setIdsConSolicitudPendiente((prev) => new Set(prev).add(clave));
        setRenovarDialog({ open: false, certificacion: null, loading: false, yaEnviada: true });
        fetchDatos();
        return;
      }

      const storedUser = typeof window !== "undefined" && window.localStorage.getItem("user");
      let solicitadoPor = "Sistema";
      if (storedUser) {
        try {
          const data = JSON.parse(storedUser);
          const empId = data?.emp_id || data?.data?.users?.[0]?.employeeID;
          const res = await axios.get(`/api/empleados?emp_id=${empId}`);
          if (res.data.success && res.data.data) {
            const e = res.data.data;
            solicitadoPor = [e.NOMBRE || e.nombre, e.APELLIDO1 || e.apellido1].filter(Boolean).join(" ") || empId;
          }
        } catch (_) {}
      }

      await axios.post("/api/solicitudes_certificacion", {
        solicitudes: [
          {
            emp_id: certificacion.emp_id,
            emp_nombre: certificacion.emp_nombre,
            id_certificacion: certificacion.id_proceso,
            nombre_certificacion: certificacion.nombre_proceso,
            status: "pendiente",
            solicitado_por: solicitadoPor,
          },
        ],
      });

      showAlert("Solicitud de renovación creada. Irá al flujo normal para aprobación.", "success");
      const clave = `${String(certificacion.emp_id ?? "").trim()}-${String(certificacion.id_proceso ?? certificacion.id_certificacion ?? "").trim()}`;
      setIdsConSolicitudPendiente((prev) => new Set(prev).add(clave));
      setRenovarDialog({ open: false, certificacion: null, loading: false, yaEnviada: false });
      fetchDatos();
    } catch (error) {
      console.error("Error al renovar:", error);
      showAlert(error.response?.data?.error || "Error al crear solicitud de renovación", "error");
      setRenovarDialog((p) => ({ ...p, loading: false }));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ maxWidth: 1400, mx: "auto", boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3} gap={2}>
            <EventBusyIcon sx={{ fontSize: 32, color: colors.primary.main }} />
            <Typography variant="h4" fontWeight="bold">
              Certificaciones - Vigencia y Renovación
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchDatos}
              size="small"
              sx={{ ml: "auto" }}
            >
              Actualizar
            </Button>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 2 }}>
              {alert.message}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Las certificaciones asignadas por RH caducan a los 6 meses. Aquí se listan las que están por vencer y las ya vencidas para renovación.
          </Typography>

          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab
              label={`Por vencer (${porVencer.length})`}
              icon={<WarningAmberIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Vencidas (${vencidas.length})`}
              icon={<EventBusyIcon />}
              iconPosition="start"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Certificaciones que vencen en los próximos 30 días
            </Typography>
            {porVencer.length === 0 ? (
              <Alert severity="success">
                No hay certificaciones por vencer en los próximos 30 días.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(colors.warning, 0.15) }}>
                      <TableCell><strong>Empleado</strong></TableCell>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Proceso</strong></TableCell>
                      <TableCell><strong>Vence el</strong></TableCell>
                      <TableCell><strong>Días restantes</strong></TableCell>
                      <TableCell><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {porVencer.map((c) => {
                      const empId = c.emp_id ?? c.empId;
                      const idProceso = c.id_proceso ?? c.idProceso;
                      const tieneSolicitud = tieneSolicitudPendiente(empId, idProceso);
                      return (
                      <TableRow key={`${empId}-${idProceso}-${c.fecha}`}>
                        <TableCell>{c.emp_nombre}</TableCell>
                        <TableCell>{empId}</TableCell>
                        <TableCell>{c.nombre_proceso}</TableCell>
                        <TableCell>{formatearFecha(c.fecha_vencimiento)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${c.dias_restantes ?? "-"} días`}
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={tieneSolicitud ? "Ya se mandó a renovación" : ""}>
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => abrirRenovar(c)}
                                disabled={tieneSolicitud}
                                sx={{ mr: 1 }}
                              >
                                Renovar
                              </Button>
                            </span>
                          </Tooltip>
                          <Button
                            size="small"
                            startIcon={<HistoryIcon />}
                            onClick={() => abrirHistorial(empId, idProceso)}
                          >
                            Historial
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Certificaciones vencidas que pueden renovarse
            </Typography>
            {vencidas.length === 0 ? (
              <Alert severity="info">
                No hay certificaciones vencidas.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(colors.error, 0.1) }}>
                      <TableCell><strong>Empleado</strong></TableCell>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Proceso</strong></TableCell>
                      <TableCell><strong>Venció el</strong></TableCell>
                      <TableCell><strong>Días vencido</strong></TableCell>
                      <TableCell><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vencidas.map((c) => {
                      const empId = c.emp_id ?? c.empId;
                      const idProceso = c.id_proceso ?? c.idProceso;
                      const tieneSolicitud = tieneSolicitudPendiente(empId, idProceso);
                      return (
                      <TableRow key={`${empId}-${idProceso}-${c.fecha}`}>
                        <TableCell>{c.emp_nombre}</TableCell>
                        <TableCell>{empId}</TableCell>
                        <TableCell>{c.nombre_proceso}</TableCell>
                        <TableCell>{formatearFecha(c.fecha_vencimiento)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${c.dias_vencido ?? "-"} días`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={tieneSolicitud ? "Ya se mandó a renovación" : ""}>
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => abrirRenovar(c)}
                                disabled={tieneSolicitud}
                                sx={{ mr: 1 }}
                              >
                                Renovar
                              </Button>
                            </span>
                          </Tooltip>
                          <Button
                            size="small"
                            startIcon={<HistoryIcon />}
                            onClick={() => abrirHistorial(empId, idProceso)}
                          >
                            Historial
                          </Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Dialog Historial */}
      <Dialog open={historialDialog.open} onClose={() => setHistorialDialog((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de certificaciones</DialogTitle>
        <DialogContent>
          {historialDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : historialDialog.registros.length === 0 ? (
            <Typography color="text.secondary">Sin registros de certificación</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha certificación</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Tipo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialDialog.registros.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{formatearFecha(r.fecha_certificacion)}</TableCell>
                      <TableCell>{formatearFecha(r.fecha_vencimiento)}</TableCell>
                      <TableCell>
                        <Chip label={r.tipo || "nueva"} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Renovar */}
      <Dialog open={renovarDialog.open} onClose={() => setRenovarDialog({ open: false, certificacion: null })}>
        <DialogTitle>{renovarDialog.yaEnviada ? "Ya enviada a renovación" : "Renovar certificación"}</DialogTitle>
        <DialogContent>
          {renovarDialog.certificacion && (
            <Typography>
              {renovarDialog.yaEnviada ? (
                <>
                  Ya existe una solicitud de renovación pendiente para{" "}
                  <strong>{renovarDialog.certificacion.emp_nombre}</strong> ({renovarDialog.certificacion.emp_id}) en el proceso{" "}
                  <strong>{renovarDialog.certificacion.nombre_proceso}</strong>. No es necesario enviar otra.
                </>
              ) : (
                <>
                  Se creará una nueva solicitud de certificación para{" "}
                  <strong>{renovarDialog.certificacion.emp_nombre}</strong> ({renovarDialog.certificacion.emp_id}) en el proceso{" "}
                  <strong>{renovarDialog.certificacion.nombre_proceso}</strong>. La solicitud irá al flujo normal (entrenamiento, examen, asignación).
                </>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenovarDialog({ open: false, certificacion: null })}>
            {renovarDialog.yaEnviada ? "Cerrar" : "Cancelar"}
          </Button>
          {!renovarDialog.yaEnviada && (
            <Button variant="contained" onClick={confirmarRenovar} disabled={renovarDialog.loading}>
              {renovarDialog.loading ? "Creando..." : "Crear solicitud de renovación"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Certificaciones_vigencia;
