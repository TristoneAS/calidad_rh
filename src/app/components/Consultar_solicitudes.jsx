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
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PendingIcon from "@mui/icons-material/Pending";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

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

  useEffect(() => {
    fetchSolicitudes();
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
        const enrolamientos = [
          {
            emp_id: empId,
            emp_nombre: empNombre,
            id_proceso: idProceso,
            nombre_proceso: nombreProceso,
            descripcion_proceso: "",
            enrolado_por: "RH - Flujo certificación",
          },
        ];

        await axios.post("/api/empleados_procesos", { enrolamientos });
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
      headerName: "ID",
      width: 80,
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
      width: 160,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "nombre_certificacion",
      headerName: "Proceso / Certificable",
      width: 260,
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
      width: 130,
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
        return (
          <Box
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "capitalize",
            }}
          >
            {params.value || "N/A"}
          </Box>
        );
      },
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
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<CheckIcon />}
                disabled={disabled}
                onClick={() =>
                  actualizarEstadoSolicitud(
                    params.row.id,
                    "entrenamiento_aprobado",
                  )
                }
              >
                Entr. ok
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                disabled={disabled}
                onClick={() =>
                  actualizarEstadoSolicitud(
                    params.row.id,
                    "entrenamiento_reprobado",
                  )
                }
              >
                Entr. no
              </Button>
            </Box>
          );
        }

        if (status === "entrenamiento_aprobado") {
          // Paso Calidad: examen
          const disabled = esModoRhEntr || esModoRhCert;
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<CheckIcon />}
                disabled={disabled}
                onClick={() =>
                  actualizarEstadoSolicitud(params.row.id, "examen_aprobado")
                }
              >
                Exam. ok
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                disabled={disabled}
                onClick={() =>
                  actualizarEstadoSolicitud(params.row.id, "examen_reprobado")
                }
              >
                Exam. no
              </Button>
            </Box>
          );
        }

        if (status === "examen_aprobado") {
          // Paso RH: asignar certificación (crea enrolamiento y cierra flujo)
          const disabled = esModoCalidad || esModoRhEntr;
          return (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<WorkspacePremiumIcon />}
              disabled={disabled}
              onClick={() => asignarCertificacion(params.row)}
            >
              Asignar cert.
            </Button>
          );
        }

        return null;
      },
    },
  ];

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
                    columns={columns}
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
                    columns={columns}
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
                    columns={columns}
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
    </Box>
  );
}

export default Consultar_solicitudes;
