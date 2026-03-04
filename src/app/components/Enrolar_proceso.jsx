"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
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
  Divider,
  TextField,
  Button,
} from "@mui/material";
import axios from "axios";
import PersonIcon from "@mui/icons-material/Person";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
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

function Enrolar_proceso() {
  const [modo, setModo] = useState("empleado"); // "empleado" o "proceso"
  const [procesos, setProcesos] = useState([]);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState(null);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState("");
  const [procesosSeleccionados, setProcesosSeleccionados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [loadingProcesos, setLoadingProcesos] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [enroladoPor, setEnroladoPor] = useState(""); // emp_nombre del usuario de sesión

  // Cargar procesos y usuario de sesión al montar
  useEffect(() => {
    fetchProcesos();
  }, []);

  // Obtener emp_id y emp_nombre del usuario de sesión actual
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchUsuarioSesion = async () => {
      try {
        const storedUser = window.localStorage.getItem("user");
        const usuario = window.localStorage.getItem("usuario");
        let empId = usuario;
        if (storedUser) {
          try {
            const data = JSON.parse(storedUser);
            empId = data?.emp_id || data?.data?.users?.[0]?.employeeID || empId;
          } catch (_) {}
        }
        if (!empId) {
          setEnroladoPor("Sistema");
          return;
        }
        const res = await axios.get(`/api/empleados?emp_id=${encodeURIComponent(empId)}`);
        if (res.data.success && res.data.data) {
          const emp = res.data.data;
          const nombre = emp.emp_nombre || emp.NOMBRE || emp.nombre || String(empId);
          setEnroladoPor(nombre);
        } else {
          setEnroladoPor(String(empId));
        }
      } catch (_) {
        const usuario = window.localStorage.getItem("usuario");
        setEnroladoPor(usuario || "Sistema");
      }
    };
    fetchUsuarioSesion();
  }, []);

  const fetchProcesos = async () => {
    try {
      setLoadingProcesos(true);
      const response = await axios.get("/api/procesos");
      if (response.data.success) {
        setProcesos(response.data.data);
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

  const buscarEmpleado = async () => {
    if (!empIdInput.trim()) {
      showAlert("Por favor ingresa un ID de empleado", "error");
      return;
    }

    try {
      setLoadingEmpleado(true);
      const response = await axios.get(
        `/api/empleados?emp_id=${empIdInput.trim()}`
      );

      if (response.data.success && response.data.data) {
        setEmpleadoEncontrado(response.data.data);
        showAlert("Empleado encontrado", "success");
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

  const handleModoChange = (event, newModo) => {
    if (newModo !== null) {
      setModo(newModo);
      // Limpiar selecciones al cambiar de modo
      setEmpIdInput("");
      setEmpleadoEncontrado(null);
      setProcesoSeleccionado("");
      setProcesosSeleccionados([]);
      setEmpleadosSeleccionados([]);
    }
  };

  // Función para verificar si existe un enrolamiento
  const verificarEnrolamientoExistente = async (empId, idProceso) => {
    try {
      const response = await axios.get(
        `/api/empleados_procesos?verificar=true&emp_id=${empId}&id_proceso=${idProceso}`
      );
      return response.data.existe || false;
    } catch (error) {
      console.error("Error al verificar enrolamiento existente:", error);
      return false;
    }
  };

  // Modo 1: Primero empleado, luego procesos
  const handleAgregarProceso = async () => {
    if (!procesoSeleccionado) {
      showAlert("Por favor selecciona un proceso", "error");
      return;
    }

    if (!empleadoEncontrado) {
      showAlert("Por favor busca un empleado primero", "error");
      return;
    }

    const proceso = procesos.find(
      (p) => p.id.toString() === procesoSeleccionado
    );

    if (!proceso) return;

    // Verificar si ya está agregado en la lista actual
    if (procesosSeleccionados.some((p) => p.id === proceso.id)) {
      showAlert("Este proceso ya está agregado", "warning");
      return;
    }

    // Verificar si ya existe un enrolamiento
    const empId = empleadoEncontrado.NUM_EMPLEADO || empleadoEncontrado.num_empleado || empleadoEncontrado.emp_id || empleadoEncontrado.id;
    const existeEnrolamiento = await verificarEnrolamientoExistente(
      empId.toString(),
      proceso.id.toString()
    );

    if (existeEnrolamiento) {
      showAlert(
        `Ya existe un enrolamiento para el empleado ${empId} y el proceso ${proceso.nombre}`,
        "error"
      );
      return;
    }

    setProcesosSeleccionados([...procesosSeleccionados, proceso]);
    setProcesoSeleccionado("");
  };

  const handleEliminarProceso = (id) => {
    setProcesosSeleccionados(procesosSeleccionados.filter((p) => p.id !== id));
  };

  // Modo 2: Primero proceso, luego empleados
  const handleAgregarEmpleado = async () => {
    if (!empleadoEncontrado) {
      showAlert("Por favor busca un empleado primero", "error");
      return;
    }

    if (!procesoSeleccionado) {
      showAlert("Por favor selecciona un proceso primero", "error");
      return;
    }

    // Verificar si ya está agregado en la lista actual
    const empId = empleadoEncontrado.NUM_EMPLEADO || empleadoEncontrado.num_empleado || empleadoEncontrado.emp_id || empleadoEncontrado.id;
    if (empleadosSeleccionados.some((e) => {
      const eId = e.NUM_EMPLEADO || e.num_empleado || e.emp_id || e.id;
      return eId === empId;
    })) {
      showAlert("Este empleado ya está agregado", "warning");
      return;
    }

    // Verificar si ya existe un enrolamiento
    const proceso = procesos.find(
      (p) => p.id.toString() === procesoSeleccionado
    );

    if (!proceso) {
      showAlert("Proceso no encontrado", "error");
      return;
    }

    const existeEnrolamiento = await verificarEnrolamientoExistente(
      empId.toString(),
      proceso.id.toString()
    );

    if (existeEnrolamiento) {
      showAlert(
        `Ya existe un enrolamiento para el empleado ${empId} y el proceso ${proceso.nombre}`,
        "error"
      );
      return;
    }

    setEmpleadosSeleccionados([...empleadosSeleccionados, empleadoEncontrado]);
    setEmpIdInput("");
    setEmpleadoEncontrado(null);
  };

  const handleEliminarEmpleado = (id) => {
    setEmpleadosSeleccionados(
      empleadosSeleccionados.filter((e) => {
        const eId = e.NUM_EMPLEADO || e.num_empleado || e.emp_id || e.id;
        return eId !== id;
      })
    );
  };

  const handleGuardar = async () => {
    let enrolamientos = [];

    if (modo === "empleado") {
      // Modo: Empleado -> Procesos
      if (!empleadoEncontrado) {
        showAlert("Por favor busca y selecciona un empleado", "error");
        return;
      }

      if (procesosSeleccionados.length === 0) {
        showAlert("Por favor agrega al menos un proceso", "error");
        return;
      }

      const empId = empleadoEncontrado.NUM_EMPLEADO || empleadoEncontrado.num_empleado || empleadoEncontrado.emp_id || empleadoEncontrado.id;
      const empNombre =
        empleadoEncontrado.NOMBRE ||
        empleadoEncontrado.nombre ||
        empleadoEncontrado.emp_nombre ||
        "Sin nombre";

      // Verificar una última vez antes de guardar
      const verificaciones = await Promise.all(
        procesosSeleccionados.map((proceso) =>
          verificarEnrolamientoExistente(
            empId.toString(),
            proceso.id.toString()
          )
        )
      );

      const procesosDuplicados = procesosSeleccionados.filter(
        (proceso, index) => verificaciones[index]
      );

      if (procesosDuplicados.length > 0) {
        showAlert(
          `No se pueden crear enrolamientos duplicados. Ya existen enrolamientos para: ${procesosDuplicados
            .map((p) => p.nombre)
            .join(", ")}`,
          "error"
        );
        return;
      }

      enrolamientos = procesosSeleccionados.map((proceso) => {
        const esCertificable =
          proceso.certificable &&
          proceso.certificable.toString().toLowerCase() === "si";
        const vencimiento = esCertificable ? new Date() : null;
        if (vencimiento) vencimiento.setMonth(vencimiento.getMonth() + 6);
        return {
          emp_id: empId,
          emp_nombre: empNombre,
          id_proceso: proceso.id,
          nombre_proceso: proceso.nombre,
          descripcion_proceso: proceso.descripcion || "",
          enrolado_por: enroladoPor || "Sistema",
          es_certificacion: esCertificable,
          fecha_vencimiento: esCertificable
            ? vencimiento.toISOString().split("T")[0]
            : null,
        };
      });
    } else {
      // Modo: Proceso -> Empleados
      if (!procesoSeleccionado) {
        showAlert("Por favor selecciona un proceso", "error");
        return;
      }

      if (empleadosSeleccionados.length === 0) {
        showAlert("Por favor agrega al menos un empleado", "error");
        return;
      }

      const proceso = procesos.find(
        (p) => p.id.toString() === procesoSeleccionado
      );

      if (!proceso) {
        showAlert("Proceso no encontrado", "error");
        return;
      }

      // Verificar una última vez antes de guardar
      const verificaciones = await Promise.all(
        empleadosSeleccionados.map((emp) =>
          verificarEnrolamientoExistente(
            (emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id).toString(),
            proceso.id.toString()
          )
        )
      );

      const empleadosDuplicados = empleadosSeleccionados.filter(
        (emp, index) => verificaciones[index]
      );

      if (empleadosDuplicados.length > 0) {
        showAlert(
          `No se pueden crear enrolamientos duplicados. Ya existen enrolamientos para: ${empleadosDuplicados
            .map((e) => e.NOMBRE || e.nombre || e.emp_nombre || e.NUM_EMPLEADO || e.num_empleado || e.emp_id || e.id)
            .join(", ")}`,
          "error"
        );
        return;
      }

      const esCertificable =
        proceso.certificable &&
        proceso.certificable.toString().toLowerCase() === "si";
      const vencimiento = esCertificable ? new Date() : null;
      if (vencimiento) vencimiento.setMonth(vencimiento.getMonth() + 6);

      enrolamientos = empleadosSeleccionados.map((emp) => ({
        emp_id: emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id,
        emp_nombre: emp.NOMBRE || emp.nombre || emp.emp_nombre || "Sin nombre",
        id_proceso: proceso.id,
        nombre_proceso: proceso.nombre,
        descripcion_proceso: proceso.descripcion || "",
        enrolado_por: enroladoPor || "Sistema",
        es_certificacion: esCertificable,
        fecha_vencimiento: esCertificable
          ? vencimiento.toISOString().split("T")[0]
          : null,
      }));
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/empleados_procesos", {
        enrolamientos,
      });

      if (response.data.success) {
        // Registrar en certificaciones_historial solo los que son certificación (6 meses vigencia)
        const certificadosPor = enroladoPor || "Sistema";
        for (const e of enrolamientos) {
          if (e.es_certificacion && e.fecha_vencimiento) {
            try {
              await axios.post("/api/certificaciones", {
                emp_id: e.emp_id,
                emp_nombre: e.emp_nombre,
                id_proceso: e.id_proceso,
                nombre_proceso: e.nombre_proceso,
                fecha_vencimiento: e.fecha_vencimiento,
                tipo: "nueva",
                certificado_por: certificadosPor,
              });
            } catch (errHist) {
              console.error("Error al registrar en historial:", errHist);
            }
          }
        }
        showAlert(
          response.data.message || "Enrolamientos creados exitosamente",
          "success"
        );
        // Limpiar formulario
        setEmpIdInput("");
        setEmpleadoEncontrado(null);
        setProcesoSeleccionado("");
        setProcesosSeleccionados([]);
        setEmpleadosSeleccionados([]);
      } else {
        showAlert(
          response.data.error || "Error al crear los enrolamientos",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al crear enrolamientos:", error);
      showAlert(
        error.response?.data?.error || "Error al crear los enrolamientos",
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
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
            <Box display="flex" alignItems="center">
              <RequestQuoteIcon
                sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
              />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Enrolar Proceso
              </Typography>
            </Box>
            {enroladoPor && (
              <Typography variant="body2" color="text.secondary">
                Enrolando como: <strong>{enroladoPor}</strong>
              </Typography>
            )}
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Selector de modo */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Selecciona el modo de enrolamiento:
            </Typography>
            <ToggleButtonGroup
              value={modo}
              exclusive
              onChange={handleModoChange}
              aria-label="modo de enrolamiento"
              fullWidth
              sx={{ mt: 2 }}
            >
              <ToggleButton value="empleado" aria-label="modo empleado">
                <PersonIcon sx={{ mr: 1 }} />
                Primero Empleado
              </ToggleButton>
              <ToggleButton value="proceso" aria-label="modo proceso">
                <RequestQuoteIcon sx={{ mr: 1 }} />
                Primero Proceso
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Modo 1: Empleado -> Procesos */}
          {modo === "empleado" && (
            <Box>
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
                    Empleado Encontrado:
                  </Typography>
                  <Typography variant="body1">
                    <strong>Número Empleado:</strong>{" "}
                    {empleadoEncontrado.NUM_EMPLEADO || empleadoEncontrado.num_empleado || empleadoEncontrado.emp_id || empleadoEncontrado.id}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Nombre:</strong>{" "}
                    {empleadoEncontrado.NOMBRE ||
                      empleadoEncontrado.nombre ||
                      empleadoEncontrado.emp_nombre ||
                      "Sin nombre"}
                  </Typography>
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
                        {procesos.map((proceso) => {
                          const esCertificable =
                            proceso.certificable &&
                            proceso.certificable.toString().toLowerCase() ===
                              "si";
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
                        {procesosSeleccionados.map((proceso) => (
                          <ListItem key={proceso.id}>
                            <ListItemText primary={proceso.nombre} />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() =>
                                  handleEliminarProceso(proceso.id)
                                }
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Modo 2: Proceso -> Empleados */}
          {modo === "proceso" && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Paso 1: Selecciona un Proceso
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Proceso</InputLabel>
                <Select
                  value={procesoSeleccionado}
                  label="Proceso"
                  onChange={(e) => setProcesoSeleccionado(e.target.value)}
                >
                  {procesos.map((proceso) => {
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

              {procesoSeleccionado && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
                    Paso 2: Busca y Agrega Empleados
                  </Typography>
                  <Box display="flex" gap={2} mb={2}>
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
                        mb: 2,
                        bgcolor: colors.primary.light,
                        color: "white",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Empleado Encontrado:
                      </Typography>
                      <Typography variant="body1">
                        <strong>ID:</strong>{" "}
                        {empleadoEncontrado.emp_id || empleadoEncontrado.id}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Nombre:</strong>{" "}
                        {empleadoEncontrado.emp_nombre ||
                          empleadoEncontrado.nombre ||
                          "Sin nombre"}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleAgregarEmpleado}
                        sx={{
                          mt: 2,
                          bgcolor: colors.secondary.main,
                          "&:hover": { bgcolor: colors.secondary.dark },
                        }}
                      >
                        Agregar Empleado
                      </Button>
                    </Paper>
                  )}

                  {empleadosSeleccionados.length > 0 && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Empleados seleccionados:
                      </Typography>
                      <List>
                        {empleadosSeleccionados.map((emp) => {
                          const empId = emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id;
                          const empNombre =
                            emp.NOMBRE || emp.nombre || emp.emp_nombre || "Sin nombre";
                          return (
                            <ListItem key={empId}>
                              <ListItemText
                                primary={empNombre}
                                secondary={`ID: ${empId}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleEliminarEmpleado(empId)}
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
            </Box>
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
              {loading ? "Guardando..." : "Guardar Enrolamientos"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Enrolar_proceso;











