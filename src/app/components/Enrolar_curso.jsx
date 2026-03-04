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
import SchoolIcon from "@mui/icons-material/School";
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

function Enrolar_curso() {
  const [modo, setModo] = useState("empleado"); // "empleado" o "curso"
  const [cursos, setCursos] = useState([]);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Cargar cursos al montar el componente
  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoadingCursos(true);
      const response = await axios.get("/api/cursos");
      if (response.data.success) {
        setCursos(response.data.data);
      } else {
        showAlert("Error al cargar los cursos", "error");
      }
    } catch (error) {
      console.error("Error al obtener cursos:", error);
      showAlert("Error al cargar los cursos", "error");
    } finally {
      setLoadingCursos(false);
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
        // La API ahora devuelve success: false cuando no encuentra el empleado
        showAlert(
          response.data?.error || "Empleado no encontrado",
          "error"
        );
        setEmpleadoEncontrado(null);
      }
    } catch (error) {
      // Manejar errores de conexión u otros errores inesperados
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error("Error del servidor al buscar empleado:", error.response.status, error.response.data);
        showAlert(
          error.response.data?.error || "Error al buscar el empleado",
          "error"
        );
        setEmpleadoEncontrado(null);
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error("No se recibió respuesta del servidor:", error.request);
        showAlert("No se pudo conectar con el servidor. Verifica tu conexión.", "error");
        setEmpleadoEncontrado(null);
      } else {
        // Algo pasó al configurar la petición
        console.error("Error al configurar la petición:", error.message);
        showAlert("Error al buscar el empleado", "error");
        setEmpleadoEncontrado(null);
      }
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
      setCursoSeleccionado("");
      setCursosSeleccionados([]);
      setEmpleadosSeleccionados([]);
    }
  };

  // Función para verificar si existe un enrolamiento
  const verificarEnrolamientoExistente = async (empId, idCurso) => {
    try {
      const response = await axios.get(
        `/api/empleados_cursos?verificar=true&emp_id=${empId}&id_curso=${idCurso}`
      );
      return response.data.existe || false;
    } catch (error) {
      console.error("Error al verificar enrolamiento existente:", error);
      return false;
    }
  };

  // Modo 1: Primero empleado, luego cursos
  const handleAgregarCurso = async () => {
    if (!cursoSeleccionado) {
      showAlert("Por favor selecciona un curso", "error");
      return;
    }

    if (!empleadoEncontrado) {
      showAlert("Por favor busca un empleado primero", "error");
      return;
    }

    const curso = cursos.find(
      (c) => c.id.toString() === cursoSeleccionado
    );

    if (!curso) return;

    // Verificar si ya está agregado en la lista actual
    if (cursosSeleccionados.some((c) => c.id === curso.id)) {
      showAlert("Este curso ya está agregado", "warning");
      return;
    }

    // Verificar si ya existe un enrolamiento
    const empId = empleadoEncontrado.NUM_EMPLEADO || empleadoEncontrado.num_empleado || empleadoEncontrado.emp_id || empleadoEncontrado.id;
    const existeEnrolamiento = await verificarEnrolamientoExistente(
      empId.toString(),
      curso.id.toString()
    );

    if (existeEnrolamiento) {
      showAlert(
        `Ya existe un enrolamiento para el empleado ${empId} y el curso ${curso.nombre}`,
        "error"
      );
      return;
    }

    setCursosSeleccionados([
      ...cursosSeleccionados,
      curso,
    ]);
    setCursoSeleccionado("");
  };

  const handleEliminarCurso = (id) => {
    setCursosSeleccionados(
      cursosSeleccionados.filter((c) => c.id !== id)
    );
  };

  // Modo 2: Primero curso, luego empleados
  const handleAgregarEmpleado = async () => {
    if (!empleadoEncontrado) {
      showAlert("Por favor busca un empleado primero", "error");
      return;
    }

    if (!cursoSeleccionado) {
      showAlert("Por favor selecciona un curso primero", "error");
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
    const curso = cursos.find(
      (c) => c.id.toString() === cursoSeleccionado
    );

    if (!curso) {
      showAlert("Curso no encontrado", "error");
      return;
    }

    const existeEnrolamiento = await verificarEnrolamientoExistente(
      empId.toString(),
      curso.id.toString()
    );

    if (existeEnrolamiento) {
      showAlert(
        `Ya existe un enrolamiento para el empleado ${empId} y el curso ${curso.nombre}`,
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
      // Modo: Empleado -> Cursos
      if (!empleadoEncontrado) {
        showAlert("Por favor busca y selecciona un empleado", "error");
        return;
      }

      if (cursosSeleccionados.length === 0) {
        showAlert("Por favor agrega al menos un curso", "error");
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
        cursosSeleccionados.map((curso) =>
          verificarEnrolamientoExistente(empId.toString(), curso.id.toString())
        )
      );

      const cursosDuplicados = cursosSeleccionados.filter(
        (curso, index) => verificaciones[index]
      );

      if (cursosDuplicados.length > 0) {
        showAlert(
          `No se pueden crear enrolamientos duplicados. Ya existen enrolamientos para: ${cursosDuplicados.map((c) => c.nombre).join(", ")}`,
          "error"
        );
        return;
      }

      enrolamientos = cursosSeleccionados.map((curso) => ({
        emp_id: empId,
        emp_nombre: empNombre,
        id_curso: curso.id,
        nombre_curso: curso.nombre,
        descripcion_curso: curso.descripcion || "",
        enrolado_por: "Alex",
      }));
    } else {
      // Modo: Curso -> Empleados
      if (!cursoSeleccionado) {
        showAlert("Por favor selecciona un curso", "error");
        return;
      }

      if (empleadosSeleccionados.length === 0) {
        showAlert("Por favor agrega al menos un empleado", "error");
        return;
      }

      const curso = cursos.find(
        (c) => c.id.toString() === cursoSeleccionado
      );

      if (!curso) {
        showAlert("Curso no encontrado", "error");
        return;
      }

      // Verificar una última vez antes de guardar
      const verificaciones = await Promise.all(
        empleadosSeleccionados.map((emp) =>
          verificarEnrolamientoExistente(
            (emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id).toString(),
            curso.id.toString()
          )
        )
      );

      const empleadosDuplicados = empleadosSeleccionados.filter(
        (emp, index) => verificaciones[index]
      );

      if (empleadosDuplicados.length > 0) {
        showAlert(
          `No se pueden crear enrolamientos duplicados. Ya existen enrolamientos para: ${empleadosDuplicados.map((e) => e.NOMBRE || e.nombre || e.emp_nombre || e.NUM_EMPLEADO || e.num_empleado || e.emp_id || e.id).join(", ")}`,
          "error"
        );
        return;
      }

      enrolamientos = empleadosSeleccionados.map((emp) => ({
        emp_id: emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id,
        emp_nombre: emp.NOMBRE || emp.nombre || emp.emp_nombre || "Sin nombre",
        id_curso: curso.id,
        nombre_curso: curso.nombre,
        descripcion_curso: curso.descripcion || "",
        enrolado_por: "Alex",
      }));
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/empleados_cursos", {
        enrolamientos,
      });

      if (response.data.success) {
        showAlert(
          response.data.message || "Enrolamientos creados exitosamente",
          "success"
        );
        // Limpiar formulario
        setEmpIdInput("");
        setEmpleadoEncontrado(null);
        setCursoSeleccionado("");
        setCursosSeleccionados([]);
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

  if (loadingCursos) {
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
            <SchoolIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Enrolar Curso
            </Typography>
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
              <ToggleButton
                value="curso"
                aria-label="modo curso"
              >
                <SchoolIcon sx={{ mr: 1 }} />
                Primero Curso
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Modo 1: Empleado -> Cursos */}
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
                    Paso 2: Agrega Cursos
                  </Typography>
                  <Box display="flex" gap={2} mb={2}>
                    <FormControl fullWidth>
                      <InputLabel>Curso</InputLabel>
                      <Select
                        value={cursoSeleccionado}
                        label="Curso"
                        onChange={(e) =>
                          setCursoSeleccionado(e.target.value)
                        }
                      >
                        {cursos.map((curso) => (
                          <MenuItem key={curso.id} value={curso.id.toString()}>
                            {curso.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      onClick={handleAgregarCurso}
                      sx={{
                        bgcolor: colors.secondary.main,
                        "&:hover": { bgcolor: colors.secondary.dark },
                        minWidth: 150,
                      }}
                    >
                      Agregar
                    </Button>
                  </Box>

                  {cursosSeleccionados.length > 0 && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Cursos seleccionados:
                      </Typography>
                      <List>
                        {cursosSeleccionados.map((curso) => (
                          <ListItem key={curso.id}>
                            <ListItemText primary={curso.nombre} />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() =>
                                  handleEliminarCurso(curso.id)
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

          {/* Modo 2: Curso -> Empleados */}
          {modo === "curso" && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Paso 1: Selecciona un Curso
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Curso</InputLabel>
                <Select
                  value={cursoSeleccionado}
                  label="Curso"
                  onChange={(e) => setCursoSeleccionado(e.target.value)}
                >
                  {cursos.map((curso) => (
                    <MenuItem key={curso.id} value={curso.id.toString()}>
                      {curso.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {cursoSeleccionado && (
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

export default Enrolar_curso;

