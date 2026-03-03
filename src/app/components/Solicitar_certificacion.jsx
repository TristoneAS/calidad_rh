"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
} from "@mui/material";
import axios from "axios";
import PersonIcon from "@mui/icons-material/Person";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";

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

function Solicitar_certificacion() {
  const [procesosCertificables, setProcesosCertificables] = useState([]);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState(null);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState("");
  const [procesosSeleccionados, setProcesosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [loadingProcesos, setLoadingProcesos] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [usuarioEmpId, setUsuarioEmpId] = useState("");
  const [usuarioNombre, setUsuarioNombre] = useState("");

  // Obtener emp_id del usuario loggeado y consultar nombre (NOMBRE + APELLIDO1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchUsuario = async () => {
      try {
        const storedUser = window.localStorage.getItem("user");
        if (!storedUser) return;

        const data = JSON.parse(storedUser);
        const empId =
          data?.emp_id ||
          data?.data?.users?.[0]?.employeeID ||
          null;

        if (!empId) return;

        setUsuarioEmpId(String(empId));

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
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
        const storedUsuario = window.localStorage.getItem("usuario");
        if (storedUsuario) setUsuarioNombre(storedUsuario);
      }
    };
    fetchUsuario();
  }, []);

  // Cargar procesos certificables al montar el componente
  useEffect(() => {
    fetchProcesosCertificables();
  }, []);

  const fetchProcesosCertificables = async () => {
    try {
      setLoadingProcesos(true);
      const response = await axios.get("/api/procesos");
      if (response.data.success) {
        // Cargar todos los procesos (certificables y no certificables)
        setProcesosCertificables(response.data.data);
      } else {
        showAlert("Error al cargar los procesos", "error");
      }
    } catch (error) {
      console.error("Error al obtener procesos:", error);
      showAlert("Error al cargar los procesos", "error");
    } finally {
      setLoadingProcesos(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Calcular días de antigüedad desde FECHA_ANTIGUEDAD
  const calcularDiasAntiguedad = (fechaAntiguedad) => {
    if (!fechaAntiguedad) return null;
    const fecha = new Date(fechaAntiguedad);
    if (isNaN(fecha.getTime())) return null;
    const hoy = new Date();
    const diff = hoy.getTime() - fecha.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const buscarEmpleado = async () => {
    if (!empIdInput.trim()) {
      showAlert("Por favor ingresa un ID de empleado", "error");
      return;
    }

    try {
      setLoadingEmpleado(true);
      const response = await axios.get(
        `/api/empleados_matriz?emp_id=${empIdInput.trim()}`
      );

      if (response.data.success && response.data.data) {
        const emp = response.data.data;
        const fechaAntig = emp.FECHA_ANTIGUEDAD || emp.fecha_antiguedad;
        const diasAntiguedad = calcularDiasAntiguedad(fechaAntig);

        if (!fechaAntig) {
          showAlert(
            "No se puede verificar la antigüedad del empleado. Falta FECHA_ANTIGUEDAD en el registro.",
            "error"
          );
          setEmpleadoEncontrado(null);
        } else if (diasAntiguedad < 30) {
          showAlert(
            `El empleado no cumple con la antigüedad requerida. Tiene ${diasAntiguedad} días (mínimo 30 días)`,
            "error"
          );
          setEmpleadoEncontrado(null);
        } else {
          setEmpleadoEncontrado(emp);
          showAlert("Empleado encontrado", "success");
        }
      } else {
        showAlert("Empleado no encontrado", "error");
        setEmpleadoEncontrado(null);
      }
    } catch (error) {
      console.error("Error al buscar empleado:", error);
      if (error.response?.status === 404) {
        showAlert("Empleado no encontrado", "error");
      } else {
        showAlert("Error al buscar el empleado", "error");
      }
      setEmpleadoEncontrado(null);
    } finally {
      setLoadingEmpleado(false);
    }
  };

  // Verificar si existe solicitud activa o certificación vigente (RH ya asignó)
  const verificarSolicitudExistente = async (empId, idProceso) => {
    try {
      const response = await axios.get(
        `/api/solicitudes_certificacion?verificar=true&emp_id=${empId}&id_certificacion=${idProceso}`
      );
      return {
        existe: response.data.existe || false,
        motivo: response.data.motivo || null,
      };
    } catch (error) {
      console.error("Error al verificar:", error);
      return { existe: false, motivo: null };
    }
  };

  const handleAgregarProceso = async () => {
    if (!procesoSeleccionado) {
      showAlert("Por favor selecciona un proceso", "error");
      return;
    }

    if (!empleadoEncontrado) {
      showAlert("Por favor busca un empleado primero", "error");
      return;
    }

    const proceso = procesosCertificables.find(
      (p) => p.id.toString() === procesoSeleccionado
    );

    if (!proceso) return;

    // Verificar si ya está agregado en la lista actual
    if (procesosSeleccionados.some((p) => p.id === proceso.id)) {
      showAlert("Este proceso ya está agregado", "warning");
      return;
    }

    // Verificar si ya existe solicitud activa o certificación vigente asignada por RH
    const empId =
      empleadoEncontrado.NUM_EMPLEADO ||
      empleadoEncontrado.num_empleado ||
      empleadoEncontrado.emp_id ||
      empleadoEncontrado.id;
    const { existe, motivo } = await verificarSolicitudExistente(
      empId.toString(),
      proceso.id.toString()
    );

    if (existe) {
      const msg =
        motivo === "certificacion_vigente"
          ? `El empleado ya tiene la certificación "${proceso.nombre}" asignada por RH (vigente). No se puede solicitar de nuevo.`
          : `Ya existe una solicitud pendiente o en progreso para el empleado ${empId} y ${proceso.nombre}`;
      showAlert(msg, "error");
      return;
    }

    setProcesosSeleccionados([...procesosSeleccionados, proceso]);
    setProcesoSeleccionado("");
  };

  const handleEliminarProceso = (id) => {
    setProcesosSeleccionados(
      procesosSeleccionados.filter((p) => p.id !== id)
    );
  };

  const handleGuardar = async () => {
    if (!empleadoEncontrado) {
      showAlert("Por favor busca y selecciona un empleado", "error");
      return;
    }

    if (procesosSeleccionados.length === 0) {
      showAlert("Por favor agrega al menos un proceso", "error");
      return;
    }

    if (!usuarioEmpId || !usuarioNombre) {
      showAlert("No se encontró el usuario en el sistema", "error");
      return;
    }

    const empId =
      empleadoEncontrado.NUM_EMPLEADO ||
      empleadoEncontrado.num_empleado ||
      empleadoEncontrado.emp_id ||
      empleadoEncontrado.id;
    const empNombre = [
      empleadoEncontrado.NOMBRE || empleadoEncontrado.nombre,
      empleadoEncontrado.APELLIDO1 || empleadoEncontrado.apellido1,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Sin nombre";

    // Verificar una última vez antes de guardar
    const verificaciones = await Promise.all(
      procesosSeleccionados.map((proceso) =>
        verificarSolicitudExistente(empId.toString(), proceso.id.toString())
      )
    );

    const procesosDuplicados = procesosSeleccionados.filter(
      (proceso, index) => verificaciones[index]?.existe
    );

    if (procesosDuplicados.length > 0) {
      showAlert(
        `No se pueden crear solicitudes duplicadas. Ya existen solicitudes para: ${procesosDuplicados
          .map((p) => p.nombre)
          .join(", ")}`,
        "error"
      );
      return;
    }

    const solicitudes = procesosSeleccionados.map((proceso) => ({
      emp_id: empId,
      emp_nombre: empNombre,
      id_certificacion: proceso.id,
      nombre_certificacion: proceso.nombre,
      status: "pendiente",
      solicitado_por: usuarioNombre,
    }));

    try {
      setLoading(true);
      const response = await axios.post("/api/solicitudes_certificacion", {
        solicitudes,
      });

      if (response.data.success) {
        showAlert("Solicitud Realizada", "success");
        // Limpiar formulario
        setEmpIdInput("");
        setEmpleadoEncontrado(null);
        setProcesoSeleccionado("");
        setProcesosSeleccionados([]);
      } else {
        showAlert(
          response.data.error || "Error al crear las solicitudes",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al crear solicitudes:", error);
      showAlert(
        error.response?.data?.error || "Error al crear las solicitudes",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProcesos) {
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
          maxWidth: 1200,
          mx: "auto",
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <WorkspacePremiumIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Solicitar Certificación
            </Typography>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Paso 1: Busca un Empleado por ID
          </Typography>
          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              label="ID de Empleado (emp_id)"
              value={empIdInput}
              onChange={(e) => setEmpIdInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  buscarEmpleado();
                }
              }}
              placeholder="Ingresa el ID del empleado"
            />
            <Button
              variant="contained"
              onClick={buscarEmpleado}
              disabled={loadingEmpleado}
              startIcon={
                loadingEmpleado ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon />
                )
              }
              sx={{
                bgcolor: colors.primary.main,
                "&:hover": { bgcolor: colors.primary.dark },
                minWidth: 150,
              }}
            >
              {loadingEmpleado ? "Buscando..." : "Buscar"}
            </Button>
          </Box>

          {empleadoEncontrado && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: colors.primary.light,
                color: "white",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
              >
                Empleado Encontrado (antigüedad ≥ 30 días)
              </Typography>
              <Typography variant="body1">
                <strong>Número Empleado:</strong>{" "}
                {empleadoEncontrado.NUM_EMPLEADO ||
                  empleadoEncontrado.num_empleado ||
                  empleadoEncontrado.emp_id ||
                  empleadoEncontrado.id}
              </Typography>
              <Typography variant="body1">
                <strong>Nombre:</strong>{" "}
                {[
                  empleadoEncontrado.NOMBRE || empleadoEncontrado.nombre,
                  empleadoEncontrado.APELLIDO1 || empleadoEncontrado.apellido1,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Sin nombre"}
              </Typography>
              {empleadoEncontrado.FECHA_ANTIGUEDAD && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                  Antigüedad: {calcularDiasAntiguedad(empleadoEncontrado.FECHA_ANTIGUEDAD || empleadoEncontrado.fecha_antiguedad)} días
                </Typography>
              )}
            </Paper>
          )}

          {empleadoEncontrado && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
                Paso 2: Agrega Procesos
              </Typography>
              <Box display="flex" gap={2} mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Proceso</InputLabel>
                  <Select
                    value={procesoSeleccionado}
                    label="Proceso"
                    onChange={(e) => setProcesoSeleccionado(e.target.value)}
                  >
                    {procesosCertificables
                      .filter(
                        (proceso) =>
                          !procesosSeleccionados.some(
                            (p) => p.id === proceso.id
                          )
                      )
                      .map((proceso) => {
                        const esCertificable =
                          proceso.certificable &&
                          proceso.certificable.toString().toLowerCase() === "si";
                        return (
                          <MenuItem
                            key={proceso.id}
                            value={proceso.id.toString()}
                          >
                            {proceso.nombre}
                            {esCertificable ? " (Certificable)" : ""}
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAgregarProceso}
                  sx={{
                    bgcolor: colors.secondary.main,
                    "&:hover": { bgcolor: colors.secondary.dark },
                    minWidth: 150,
                  }}
                >
                  Agregar
                </Button>
              </Box>

              {procesosSeleccionados.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Procesos seleccionados:
                  </Typography>
                  <List>
                    {procesosSeleccionados.map((proceso) => {
                      const esCertificable =
                        proceso.certificable &&
                        proceso.certificable.toString().toLowerCase() === "si";
                      return (
                        <ListItem key={proceso.id}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <span>{proceso.nombre}</span>
                                {esCertificable && (
                                  <Box
                                    sx={{
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: 1,
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      bgcolor: "rgba(34, 197, 94, 0.1)",
                                      color: "#15803d",
                                    }}
                                  >
                                    Certificable
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleEliminarProceso(proceso.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              )}
            </>
          )}

          {/* Botón de guardar */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGuardar}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <SaveIcon />
              }
              sx={{
                bgcolor: colors.primary.main,
                "&:hover": { bgcolor: colors.primary.dark },
                px: 4,
              }}
            >
              {loading ? "Guardando..." : "Guardar Solicitudes"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Solicitar_certificacion;


