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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import SafeButton from "@/app/components/common/SafeButton";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PendingIcon from "@mui/icons-material/Pending";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import HistoryIcon from "@mui/icons-material/History";

// Colores profesionales
const colors = {
  primary: {
    main: "#3B82F6",
    light: "#60A5FA",
    dark: "#2563EB",
  },
  secondary: {
    main: "#FDBA74",
    light: "#FED7AA",
    dark: "#FB923C",
  },
};

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Consultar_solicitudes({ modo = "full", initialTab = 0 }) {
  const [tabValue, setTabValue] = useState(initialTab);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [empleado, setEmpleado] = useState("");
  const [usuarioNombre, setUsuarioNombre] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [comentarioDialog, setComentarioDialog] = useState({
    open: false,
    comentario: "",
    pendingAction: null,
  });
  const [historialDialog, setHistorialDialog] = useState({
    open: false,
    idSolicitud: null,
    registros: [],
    loading: false,
  });

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Obtener emp_id, nombre completo (NOMBRE + APELLIDO1) y rol del usuario loggeado
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchUsuario = async () => {
      try {
        const storedUser = window.localStorage.getItem("user");
        const usuario = window.localStorage.getItem("usuario");
        if (storedUser) {
          const data = JSON.parse(storedUser);
          const empId =
            data?.emp_id ||
            data?.data?.users?.[0]?.employeeID ||
            usuario ||
            "Sistema";
          setEmpleado(String(empId));

          const cn = data?.data?.groups?.[0]?.cn;
          const validRoles = ["Admin", "Calidad", "RH"];
          let userRole = null;
          if (cn && typeof cn === "string") {
            const parts = cn.trim().split(/[\s._-]+/).filter(Boolean);
            const lastWord = parts.length ? parts[parts.length - 1] : "";
            if (validRoles.includes(lastWord)) userRole = lastWord;
          }
          if (!userRole && data?.role === "lider_calidad") userRole = "Calidad";
          setIsAdmin(userRole === "Admin");

          const response = await axios.get(
            `/api/empleados?emp_id=${encodeURIComponent(empId)}`
          );
          if (response.data.success && response.data.data) {
            const emp = response.data.data;
            const nombre = (emp.NOMBRE || emp.nombre || "").trim();
            const apellido1 = (emp.APELLIDO1 || emp.apellido1 || "").trim();
            const nombreCompleto = [nombre, apellido1].filter(Boolean).join(" ");
            setUsuarioNombre(nombreCompleto || String(empId));
          } else {
            setUsuarioNombre(String(empId));
          }
        } else {
          setEmpleado(usuario || "Sistema");
          setUsuarioNombre(usuario || "Sistema");
        }
      } catch (err) {
        const usuario = window.localStorage.getItem("usuario");
        setEmpleado(usuario || "Sistema");
        setUsuarioNombre(usuario || "Sistema");
      }
    };
    fetchUsuario();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      // Endpoint de solicitudes basado ahora en procesos certificables
      const response = await axios.get("/api/solicitudes_certificacion");
      if (response.data.success) {
        setSolicitudes(response.data.data);
      } else {
        showAlert("Error al cargar las solicitudes", "error");
      }
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      showAlert("Error al cargar las solicitudes", "error");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Helpers de estado
  const normalizarStatus = (status) =>
    (status || "").toString().toLowerCase().trim();

  const etiquetaEstado = (status) => {
    const st = normalizarStatus(status);
    const map = {
      examen_aprobado: "auditoría aprobada",
      examen_reprobado: "auditoría reprobada",
    };
    return map[st] || (status || "N/A").replace(/_/g, " ");
  };

  // Filtrar solicitudes por status, agrupando estados nuevos en las pestañas existentes
  const solicitudesPendientes = solicitudes.filter((s) => {
    const st = normalizarStatus(s.status);
    return st === "pendiente";
  });

  const solicitudesEnProgreso = solicitudes.filter((s) => {
    const st = normalizarStatus(s.status);
    // Consideramos "en progreso" todo lo que sigue en el flujo pero aún no está finalizado
    return [
      "en progreso",
      "entrenamiento_aprobado",
      "examen_aprobado",
    ].includes(st);
  });

  const solicitudesFinalizadas = solicitudes.filter((s) => {
    const st = normalizarStatus(s.status);
    // Finalizadas: finalizado antiguo, reprobados o certificación asignada
    return [
      "finalizado",
      "entrenamiento_reprobado",
      "examen_reprobado",
      "certificacion_asignada",
    ].includes(st);
  });

  const actualizarEstadoSolicitud = async (id, nuevoStatus) => {
    try {
      await axios.put("/api/solicitudes_certificacion", {
        id,
        status: nuevoStatus,
      });
      await fetchSolicitudes();
      showAlert("Solicitud actualizada correctamente", "success");
    } catch (error) {
      console.error("Error al actualizar solicitud:", error);
      showAlert("Error al actualizar la solicitud", "error");
    }
  };

  const guardarHistorial = async (idSolicitud, comentario) => {
    await axios.post("/api/historial", {
      id_solicitud: idSolicitud,
      empleado: usuarioNombre || empleado,
      comentario: comentario || "",
    });
  };

  const abrirDialogComentario = (pendingAction) => {
    setComentarioDialog({
      open: true,
      comentario: "",
      pendingAction,
    });
  };

  const cerrarDialogComentario = () => {
    setComentarioDialog({
      open: false,
      comentario: "",
      pendingAction: null,
    });
  };

  const abrirHistorial = async (idSolicitud) => {
    setHistorialDialog((prev) => ({
      ...prev,
      open: true,
      idSolicitud,
      registros: [],
      loading: true,
    }));
    try {
      const response = await axios.get(
        `/api/historial?id_solicitud=${idSolicitud}`
      );
      if (response.data.success) {
        setHistorialDialog((prev) => ({
          ...prev,
          registros: response.data.data || [],
          loading: false,
        }));
      } else {
        showAlert("Error al cargar el historial", "error");
        setHistorialDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
      showAlert("Error al cargar el historial", "error");
      setHistorialDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const cerrarHistorial = () => {
    setHistorialDialog({
      open: false,
      idSolicitud: null,
      registros: [],
      loading: false,
    });
  };

  const confirmarComentario = async () => {
    const { comentario, pendingAction } = comentarioDialog;
    if (!pendingAction) return;

    try {
      await guardarHistorial(pendingAction.id, comentario);
      if (pendingAction.tipo === "actualizar") {
        await actualizarEstadoSolicitud(pendingAction.id, pendingAction.nuevoStatus);
      } else if (pendingAction.tipo === "asignar") {
        await asignarCertificacion(pendingAction.solicitud);
      }
      cerrarDialogComentario();
    } catch (error) {
      console.error("Error al guardar comentario o ejecutar acción:", error);
      showAlert("Error al procesar la acción", "error");
    }
  };

  const verificarEnrolamientoProceso = async (empId, idProceso) => {
    try {
      const response = await axios.get(
        `/api/empleados_procesos?verificar=true&emp_id=${empId}&id_proceso=${idProceso}`,
      );
      return response.data.existe || false;
    } catch (error) {
      console.error("Error al verificar enrolamiento de proceso:", error);
      return false;
    }
  };

  const asignarCertificacion = async (solicitud) => {
    const empId = solicitud.emp_id;
    const empNombre = solicitud.emp_nombre;
    const idProceso = solicitud.id_proceso || solicitud.id_certificacion;
    const nombreProceso =
      solicitud.nombre_proceso || solicitud.nombre_certificacion;

    if (!empId || !empNombre || !idProceso || !nombreProceso) {
      showAlert(
        "No se pudo asignar la certificación: datos incompletos en la solicitud",
        "error",
      );
      return;
    }

    try {
      // Verificar si ya existe enrolamiento
      const yaExiste = await verificarEnrolamientoProceso(empId, idProceso);
      if (yaExiste) {
        showAlert(
          "El empleado ya tiene asignado este proceso. No se creó otra certificación.",
          "warning",
        );
      } else {
        const hoy = new Date();
        const vencimiento = new Date(hoy);
        vencimiento.setMonth(vencimiento.getMonth() + 6);
        const fechaVencimiento = vencimiento.toISOString().split("T")[0];

        const enrolamientos = [
          {
            emp_id: empId,
            emp_nombre: empNombre,
            id_proceso: idProceso,
            nombre_proceso: nombreProceso,
            descripcion_proceso: "",
            enrolado_por: usuarioNombre || "RH - Flujo certificación",
            es_certificacion: true,
            fecha_vencimiento: fechaVencimiento,
          },
        ];

        await axios.post("/api/empleados_procesos", { enrolamientos });

        // Verificar si es renovación (había cert vencida)
        let esRenovacion = false;
        try {
          const resHist = await axios.get(
            `/api/certificaciones?tipo=historial&emp_id=${empId}&id_proceso=${idProceso}`
          );
          if (resHist.data.success && resHist.data.data?.length > 0) {
            esRenovacion = true;
          }
        } catch (_) {}

        // Registrar en historial de certificaciones (caducidad 6 meses)
        await axios.post("/api/certificaciones", {
          emp_id: empId,
          emp_nombre: empNombre,
          id_proceso: idProceso,
          nombre_proceso: nombreProceso,
          fecha_vencimiento: fechaVencimiento,
          id_solicitud: solicitud.id,
          tipo: esRenovacion ? "renovacion" : "nueva",
          certificado_por: usuarioNombre || "RH",
        });
      }

      // Actualizar estado de la solicitud a certificacion_asignada
      await actualizarEstadoSolicitud(solicitud.id, "certificacion_asignada");
    } catch (error) {
      console.error("Error al asignar certificación:", error);
      showAlert("Error al asignar la certificación", "error");
    }
  };

  // Columnas para la tabla
  const columns = [
    {
      field: "id",
      headerName: "Id_solicitud",
      width: 110,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "emp_id",
      headerName: "ID Empleado",
      width: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "emp_nombre",
      headerName: "Nombre Empleado",
      width: 200,
      flex: 1,
    },
    {
      field: "id_certificacion",
      headerName: "ID Proceso / Certificable",
      renderHeader: () => (
        <Box sx={{ whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.3 }}>
          ID Proceso
          {"\n"}
          Certificable
        </Box>
      ),
      width: 95,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "nombre_certificacion",
      headerName: "Proceso / Certificable",
      renderHeader: () => (
        <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.3 }}>
          Proceso
          {"\n"}
          Certificable
        </Box>
      ),
      width: 200,
      flex: 1,
    },
    {
      field: "fecha_solicitud",
      headerName: "Fecha Solicitud",
      width: 180,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) return "N/A";
        const date = new Date(params.value);
        return date.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      field: "solicitado_por",
      headerName: "Solicitado Por",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "status",
      headerName: "Estado",
      width: 220,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = normalizarStatus(params.value);
        let color = colors.secondary.main;
        if (status === "pendiente") {
          color = "#F59E0B";
        } else if (status === "en progreso") {
          color = "#3B82F6";
        } else if (
          status === "finalizado" ||
          status === "examen_aprobado" ||
          status === "certificacion_asignada" ||
          status === "entrenamiento_aprobado"
        ) {
          color = "#10B981";
        } else if (
          status === "entrenamiento_reprobado" ||
          status === "examen_reprobado"
        ) {
          color = "#EF4444";
        }
        const turnoText =
          status === "pendiente"
            ? "(RH)"
            : status === "entrenamiento_aprobado"
              ? "(Calidad)"
              : status === "examen_aprobado"
                ? "(RH)"
                : status === "entrenamiento_reprobado" ||
                    status === "examen_reprobado" ||
                    status === "certificacion_asignada" ||
                    status === "finalizado"
                  ? "(Finalizado)"
                  : "";
        const displayValue = etiquetaEstado(params.value);
        return (
          <Box
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "0.7rem",
              textTransform: "capitalize",
              whiteSpace: "pre-line",
              textAlign: "center",
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {displayValue}
            {turnoText && (
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.65rem",
                  opacity: 0.9,
                  mt: 0.25,
                }}
              >
                {turnoText}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "historial",
      headerName: "Historial",
      width: 100,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver historial">
          <SafeButton
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => abrirHistorial(params.row.id)}
            sx={{
              minWidth: "auto",
              px: 1,
              "& .MuiButton-startIcon": { mr: 0.5 },
            }}
          >
            Ver
          </SafeButton>
        </Tooltip>
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 260,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => {
        const status = normalizarStatus(params.row.status);
        const esModoCalidad = modo === "calidad-examenes";
        const esModoRhEntr = modo === "rh-entrenamientos";
        const esModoRhCert = modo === "rh-asignar-certificacion";

        if (status === "pendiente") {
          // Paso RH: resultado de entrenamiento
          const disabled = esModoCalidad || esModoRhCert;
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <SafeButton
                variant="contained"
                size="small"
                color="success"
                startIcon={<CheckIcon />}
                disabled={disabled}
                onClick={() =>
                  abrirDialogComentario({
                    tipo: "actualizar",
                    id: params.row.id,
                    nuevoStatus: "entrenamiento_aprobado",
                  })
                }
              >
                Entr. ok
              </SafeButton>
              <SafeButton
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                disabled={disabled}
                onClick={() =>
                  abrirDialogComentario({
                    tipo: "actualizar",
                    id: params.row.id,
                    nuevoStatus: "entrenamiento_reprobado",
                  })
                }
              >
                Entr. no
              </SafeButton>
            </Box>
          );
        }

        if (status === "entrenamiento_aprobado") {
          // Paso Calidad: examen
          const disabled = esModoRhEntr || esModoRhCert;
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <SafeButton
                variant="contained"
                size="small"
                color="primary"
                startIcon={<CheckIcon />}
                disabled={disabled}
                onClick={() =>
                  abrirDialogComentario({
                    tipo: "actualizar",
                    id: params.row.id,
                    nuevoStatus: "examen_aprobado",
                  })
                }
              >
                Aud. ok
              </SafeButton>
              <SafeButton
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                disabled={disabled}
                onClick={() =>
                  abrirDialogComentario({
                    tipo: "actualizar",
                    id: params.row.id,
                    nuevoStatus: "examen_reprobado",
                  })
                }
              >
                Aud. no
              </SafeButton>
            </Box>
          );
        }

        if (status === "examen_aprobado") {
          // Paso RH: asignar certificación (crea enrolamiento y cierra flujo)
          const disabled = esModoCalidad || esModoRhEntr;
          return (
            <SafeButton
              variant="contained"
              size="small"
              color="success"
              startIcon={<WorkspacePremiumIcon />}
              disabled={disabled}
              onClick={() =>
                abrirDialogComentario({
                  tipo: "asignar",
                  id: params.row.id,
                  solicitud: params.row,
                })
              }
            >
              Asignar cert.
            </SafeButton>
          );
        }

        return null;
      },
    },
  ];

  // En modo consultas no se muestran los botones de acción (excepto para administradores)
  const columnsToShow =
    modo === "consultas" && !isAdmin
      ? columns.filter((c) => c.field !== "acciones")
      : columns;

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card
        sx={{
          maxWidth: 1600,
          mx: "auto",
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <RequestQuoteIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Consultar Solicitudes de Certificación
            </Typography>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="tabs de solicitudes"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  minHeight: 60,
                },
                "& .Mui-selected": {
                  color: colors.primary.main,
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: colors.primary.main,
                  height: 3,
                },
              }}
            >
              <Tab
                icon={<PendingIcon sx={{ mb: 0.5 }} />}
                iconPosition="start"
                label={`Pendientes (${solicitudesPendientes.length})`}
              />
              <Tab
                icon={<HourglassEmptyIcon sx={{ mb: 0.5 }} />}
                iconPosition="start"
                label={`En Progreso (${solicitudesEnProgreso.length})`}
              />
              <Tab
                icon={<CheckCircleIcon sx={{ mb: 0.5 }} />}
                iconPosition="start"
                label={`Finalizadas (${solicitudesFinalizadas.length})`}
              />
            </Tabs>
          </Box>

          {/* Tab Panel: Pendientes */}
          <TabPanel value={tabValue} index={0}>
            <Card
              sx={{
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: colors.primary.dark,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <PendingIcon sx={{ mr: 1, fontSize: 24, color: "#F59E0B" }} />
                  Solicitudes Pendientes
                </Typography>

                <Box sx={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={solicitudesPendientes}
                    columns={columnsToShow}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: alpha("#F59E0B", 0.1),
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      },
                      "& .MuiDataGrid-row:hover": {
                        bgcolor: alpha("#F59E0B", 0.05),
                      },
                      "& .MuiDataGrid-cell:focus": {
                        outline: "none",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab Panel: En Progreso */}
          <TabPanel value={tabValue} index={1}>
            <Card
              sx={{
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: colors.primary.dark,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <HourglassEmptyIcon
                    sx={{ mr: 1, fontSize: 24, color: colors.primary.main }}
                  />
                  Solicitudes En Progreso
                </Typography>

                <Box sx={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={solicitudesEnProgreso}
                    columns={columnsToShow}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: alpha(colors.primary.main, 0.1),
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      },
                      "& .MuiDataGrid-row:hover": {
                        bgcolor: alpha(colors.primary.main, 0.05),
                      },
                      "& .MuiDataGrid-cell:focus": {
                        outline: "none",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab Panel: Finalizadas */}
          <TabPanel value={tabValue} index={2}>
            <Card
              sx={{
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: colors.primary.dark,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CheckCircleIcon
                    sx={{ mr: 1, fontSize: 24, color: "#10B981" }}
                  />
                  Solicitudes Finalizadas
                </Typography>

                <Box sx={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={solicitudesFinalizadas}
                    columns={columnsToShow}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: alpha("#10B981", 0.1),
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      },
                      "& .MuiDataGrid-row:hover": {
                        bgcolor: alpha("#10B981", 0.05),
                      },
                      "& .MuiDataGrid-cell:focus": {
                        outline: "none",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Diálogo para agregar comentario antes de ejecutar acción */}
      <Dialog
        open={comentarioDialog.open}
        onClose={cerrarDialogComentario}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Añadir comentario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comentario"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comentarioDialog.comentario}
            onChange={(e) =>
              setComentarioDialog((prev) => ({
                ...prev,
                comentario: e.target.value,
              }))
            }
            placeholder="Escribe un comentario para el historial..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SafeButton onClick={cerrarDialogComentario} color="inherit">
            Cancelar
          </SafeButton>
          <SafeButton
            onClick={confirmarComentario}
            variant="contained"
            color="primary"
          >
            Guardar y continuar
          </SafeButton>
        </DialogActions>
      </Dialog>

      {/* Diálogo para visualizar historial */}
      <Dialog
        open={historialDialog.open}
        onClose={cerrarHistorial}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon />
          Historial - Solicitud #{historialDialog.idSolicitud}
        </DialogTitle>
        <DialogContent>
          {historialDialog.loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : historialDialog.registros.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No hay registros en el historial para esta solicitud.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {historialDialog.registros.map((reg, idx) => (
                <Box
                  key={reg.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(colors.primary.main, 0.06),
                    border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.primary.dark,
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    {reg.fecha
                      ? new Date(reg.fecha).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "N/A"}{" "}
                    — {reg.empleado}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary" }}>
                    {reg.comentario || "—"}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SafeButton onClick={cerrarHistorial} variant="contained">
            Cerrar
          </SafeButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Consultar_solicitudes;
