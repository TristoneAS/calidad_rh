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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SchoolIcon from "@mui/icons-material/School";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DownloadIcon from "@mui/icons-material/Download";
import HistoryIcon from "@mui/icons-material/History";
import * as XLSX from "xlsx";

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

function Consultar_matriz_habilidades() {
  const [tabValue, setTabValue] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empleadosCursos, setEmpleadosCursos] = useState([]);
  const [empleadosProcesos, setEmpleadosProcesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEmpId, setFiltroEmpId] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "con", "sin"
  const [filtroSexo, setFiltroSexo] = useState("todos"); // "todos", "M", "F"
  const [filtroEdadMin, setFiltroEdadMin] = useState("");
  const [filtroEdadMax, setFiltroEdadMax] = useState("");
  const [filtroCursoProceso, setFiltroCursoProceso] = useState("todos"); // "todos" o ID del curso/proceso

  const [historialDialog, setHistorialDialog] = useState({
    open: false,
    empId: null,
    idProceso: null,
    nombreProceso: null,
    nombreEmpleado: null,
    registros: [],
    loading: false,
  });

  // Ordenamiento por columna (id del curso o proceso)
  const [columnaOrdenada, setColumnaOrdenada] = useState(null);
  const [direccionOrden, setDireccionOrden] = useState("asc"); // "asc" (palomitas primero) o "desc" (tachitas primero)

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        cursosRes,
        procesosRes,
        empleadosRes,
        empleadosCursosRes,
        empleadosProcesosRes,
      ] = await Promise.all([
        axios.get("/api/cursos"),
        axios.get("/api/procesos"),
        axios.get("/api/empleados_matriz"),
        axios.get("/api/empleados_cursos"),
        axios.get("/api/empleados_procesos"),
      ]);

      if (cursosRes.data.success) setCursos(cursosRes.data.data);
      if (procesosRes.data.success) setProcesos(procesosRes.data.data);
      if (empleadosRes.data.success) {
        const empData = Array.isArray(empleadosRes.data.data)
          ? empleadosRes.data.data
          : empleadosRes.data.data
          ? [empleadosRes.data.data]
          : [];
        setEmpleados(empData);
      }
      if (empleadosCursosRes.data.success)
        setEmpleadosCursos(empleadosCursosRes.data.data);
      if (empleadosProcesosRes.data.success)
        setEmpleadosProcesos(empleadosProcesosRes.data.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showAlert("Error al cargar los datos", "error");
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

  const formatearFecha = (f) => {
    if (!f) return "-";
    try {
      const d = new Date(f);
      return d.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return String(f);
    }
  };

  const abrirHistorial = async (empId, proceso, empleadoNombre) => {
    setHistorialDialog({
      open: true,
      empId,
      idProceso: proceso.id,
      nombreProceso: proceso.nombre,
      nombreEmpleado: empleadoNombre,
      registros: [],
      loading: true,
    });
    try {
      const res = await axios.get("/api/certificaciones", {
        params: { tipo: "historial", emp_id: empId, id_proceso: proceso.id },
      });
      const registros = res.data?.data ?? [];
      setHistorialDialog((prev) => ({
        ...prev,
        registros,
        loading: false,
      }));
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setHistorialDialog((prev) => ({
        ...prev,
        registros: [],
        loading: false,
      }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Limpiar ordenamiento al cambiar de tab
    setColumnaOrdenada(null);
    setDireccionOrden("asc");
    // Limpiar filtro de curso/proceso al cambiar de tab
    setFiltroCursoProceso("todos");
  };

  // Función para verificar si un empleado tiene un curso o proceso
  const tieneRelacion = (empId, itemId, tipo) => {
    const empIdStr = empId?.toString();
    const itemIdStr = itemId?.toString();

    if (tipo === "curso") {
      return empleadosCursos.some(
        (ec) =>
          (ec.emp_id?.toString() === empIdStr ||
            ec.id?.toString() === empIdStr) &&
          ec.id_curso?.toString() === itemIdStr
      );
    } else if (tipo === "proceso") {
      return empleadosProcesos.some(
        (ep) =>
          (ep.emp_id?.toString() === empIdStr ||
            ep.id?.toString() === empIdStr) &&
          ep.id_proceso?.toString() === itemIdStr
      );
    }
    return false;
  };

  // Estado del proceso: 'vigente' | 'vencida' | 'sin' (solo para procesos con certificación)
  const estadoProceso = (empId, procesoId) => {
    const empIdStr = empId?.toString();
    const procesoIdStr = procesoId?.toString();
    const ep = empleadosProcesos.find(
      (p) =>
        (p.emp_id?.toString() === empIdStr || p.id?.toString() === empIdStr) &&
        p.id_proceso?.toString() === procesoIdStr
    );
    if (!ep) return "sin";
    const fv = ep.fecha_vencimiento;
    if (!fv) return "vigente";
    const hoy = new Date().toISOString().split("T")[0];
    return fv < hoy ? "vencida" : "vigente";
  };

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const fecha = new Date(fechaNacimiento);
    if (isNaN(fecha.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad;
  };

  // Normalizar empleados
  const empleadosNormalizados = empleados.map((emp) => {
    const fechaNacimiento =
      emp.FECHA_NACIMIENTO || emp.fecha_nacimiento || null;
    const edad = calcularEdad(fechaNacimiento);
    return {
      id:
        emp.NUM_EMPLEADO ||
        emp.num_empleado ||
        emp.emp_id ||
        emp.id ||
        `emp_${Math.random()}`,
      emp_id: emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id,
      nombre: emp.NOMBRE || emp.nombre || emp.emp_nombre || "Sin nombre",
      apellido1: emp.APELLIDO1 || emp.apellido1 || "",
      apellido2: emp.APELLIDO2 || emp.apellido2 || "",
      nombreCompleto: `${emp.NOMBRE || emp.nombre || emp.emp_nombre || ""} ${
        emp.APELLIDO1 || emp.apellido1 || ""
      } ${emp.APELLIDO2 || emp.apellido2 || ""}`.trim(),
      sexo: emp.SEXO || emp.sexo || null,
      fechaNacimiento: fechaNacimiento,
      edad: edad,
    };
  });

  // Función para obtener los items según el tab activo
  const getItemsActivos = () => {
    if (tabValue === 0) return cursos;
    if (tabValue === 1) return procesos;
    return [];
  };

  // Función para verificar si un empleado tiene al menos una habilidad del tipo activo
  const tieneAlgunaHabilidad = (empleado, tipo) => {
    const items = getItemsActivos();
    return items.some((item) => tieneRelacion(empleado.emp_id, item.id, tipo));
  };

  // Filtrar empleados
  const empleadosFiltrados = empleadosNormalizados.filter((empleado) => {
    // Filtro por nombre (incluye apellidos) - solo si hay texto
    const tieneFiltroNombre = filtroNombre && filtroNombre.trim() !== "";
    if (tieneFiltroNombre) {
      const nombreCompleto = empleado.nombreCompleto.toLowerCase();
      const nombreMatch = nombreCompleto.includes(
        filtroNombre.trim().toLowerCase()
      );
      if (!nombreMatch) return false;
    }

    // Filtro por número de empleado - solo si hay texto
    const tieneFiltroEmpId = filtroEmpId && filtroEmpId.trim() !== "";
    if (tieneFiltroEmpId) {
      const empIdMatch = empleado.emp_id
        ?.toString()
        .includes(filtroEmpId.trim());
      if (!empIdMatch) return false;
    }

    // Filtro por género - solo si no es "todos"
    if (filtroSexo && filtroSexo !== "todos" && filtroSexo !== "") {
      const sexoEmpleado = empleado.sexo
        ? String(empleado.sexo).toUpperCase().trim()
        : "";

      const filtroSexoUpper = String(filtroSexo).toUpperCase().trim();
      let filtroSexoBD = "";
      if (filtroSexoUpper === "M") {
        filtroSexoBD = "HOMBRE";
      } else if (filtroSexoUpper === "F") {
        filtroSexoBD = "MUJER";
      } else {
        filtroSexoBD = filtroSexoUpper;
      }

      if (!sexoEmpleado || sexoEmpleado === "") return false;
      if (sexoEmpleado !== filtroSexoBD) return false;
    }

    // Filtro por rango de edades - solo si hay al menos un valor
    const tieneEdadMin = filtroEdadMin && filtroEdadMin.trim() !== "";
    const tieneEdadMax = filtroEdadMax && filtroEdadMax.trim() !== "";

    if (tieneEdadMin || tieneEdadMax) {
      const edad = empleado.edad;
      if (edad === null || edad === undefined || isNaN(edad)) return false;

      const edadMin = tieneEdadMin ? parseInt(filtroEdadMin.trim(), 10) : 0;
      const edadMax = tieneEdadMax ? parseInt(filtroEdadMax.trim(), 10) : 150;
      if (isNaN(edadMin) || isNaN(edadMax)) return false;
      if (edad < edadMin || edad > edadMax) return false;
    }

    // Filtro por estado (palomita/tachita) - solo si no es "todos"
    const tieneFiltroEstado = filtroEstado && filtroEstado !== "todos";
    if (tieneFiltroEstado) {
      const tipo = tabValue === 0 ? "curso" : "proceso";
      const tiene = tieneAlgunaHabilidad(empleado, tipo);
      if (filtroEstado === "con" && !tiene) return false;
      if (filtroEstado === "sin" && tiene) return false;
    }

    // Filtro por curso/proceso específico - solo si no es "todos"
    const tieneFiltroCursoProceso =
      filtroCursoProceso && filtroCursoProceso !== "todos";
    if (tieneFiltroCursoProceso) {
      const tipo = tabValue === 0 ? "curso" : "proceso";
      const itemId = parseInt(filtroCursoProceso, 10);
      // Solo mostrar empleados que tengan ese curso/proceso específico registrado (con palomita)
      const tiene = tieneRelacion(empleado.emp_id, itemId, tipo);
      if (!tiene) return false;
    }

    return true;
  });

  // Función para manejar el ordenamiento por columna
  const handleOrdenarColumna = (itemId) => {
    if (columnaOrdenada === itemId) {
      // Si ya está ordenada por esta columna, cambiar dirección
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
    } else {
      // Si es una nueva columna, ordenar ascendente (palomitas primero)
      setColumnaOrdenada(itemId);
      setDireccionOrden("asc");
    }
  };

  // Ordenar empleados según la columna seleccionada
  const empleadosOrdenados = [...empleadosFiltrados].sort((a, b) => {
    if (!columnaOrdenada) return 0;

    const tipo = tabValue === 0 ? "curso" : "proceso";
    const tieneA = tieneRelacion(a.emp_id, columnaOrdenada, tipo);
    const tieneB = tieneRelacion(b.emp_id, columnaOrdenada, tipo);

    if (direccionOrden === "asc") {
      // Palomitas primero (true primero)
      if (tieneA && !tieneB) return -1;
      if (!tieneA && tieneB) return 1;
    } else {
      // Tachitas primero (false primero)
      if (!tieneA && tieneB) return -1;
      if (tieneA && !tieneB) return 1;
    }

    return 0;
  });

  // Función para descargar la matriz en Excel
  const descargarExcel = () => {
    const tipo = tabValue === 0 ? "curso" : "proceso";
    const tipoNombre = tabValue === 0 ? "Cursos" : "Procesos";
    const items = getItemsActivos();

    // Crear encabezados
    const encabezados = [
      "Empleado",
      "ID Empleado",
      ...items.map((item) =>
        tipo === "proceso"
          ? `${item.nombre}${
              item.certificable &&
              item.certificable.toString().toLowerCase() === "si"
                ? " (Certificable)"
                : ""
            }`
          : item.nombre
      ),
    ];

    // Crear filas de datos
    const datos = empleadosOrdenados.map((empleado) => {
      const fila = [
        empleado.nombre,
        empleado.emp_id,
        ...items.map((item) => {
          if (tipo === "proceso") {
            const estado = estadoProceso(empleado.emp_id, item.id);
            return estado === "vigente" ? "✓" : estado === "vencida" ? "!" : "✗";
          }
          const tiene = tieneRelacion(empleado.emp_id, item.id, tipo);
          return tiene ? "✓" : "✗";
        }),
      ];
      return fila;
    });

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    const wsData = [encabezados, ...datos];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Empleado
      { wch: 15 }, // ID Empleado
      ...items.map(() => ({ wch: 20 })), // Columnas de habilidades
    ];
    ws["!cols"] = colWidths;

    // Agregar estilo a los encabezados (negrita)
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Agregar estilo a la columna de empleado (negrita)
    for (let row = 1; row <= datos.length; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
        };
      }
    }

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, `Matriz ${tipoNombre}`);

    // Generar el archivo y descargarlo
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Matriz_Habilidades_${tipoNombre}_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

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
            <AssessmentIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Matriz de Habilidades
            </Typography>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Tabs y Filtros en la misma línea */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                alignItems: { xs: "stretch", md: "flex-end" },
                mb: 2,
              }}
            >
              {/* Tabs */}
              <Box
                sx={{
                  flex: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="tabs de matriz de habilidades"
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
                    icon={<SchoolIcon sx={{ mb: 0.5 }} />}
                    iconPosition="start"
                    label={`Cursos (${cursos.length})`}
                  />
                  <Tab
                    icon={<RequestQuoteIcon sx={{ mb: 0.5 }} />}
                    iconPosition="start"
                    label={`Procesos (${procesos.length})`}
                  />
                </Tabs>
              </Box>

              {/* Filtros */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  flexWrap: "wrap",
                  alignItems: "center",
                  minWidth: { xs: "100%", md: "auto" },
                }}
              >
                <TextField
                  size="small"
                  label="Nombre"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  placeholder="Nombre"
                  sx={{ minWidth: { xs: "100%", sm: 150, md: 150 } }}
                />
                <TextField
                  size="small"
                  label="N° Empleado"
                  value={filtroEmpId}
                  onChange={(e) => setFiltroEmpId(e.target.value)}
                  placeholder="ID"
                  sx={{ minWidth: { xs: "100%", sm: 120, md: 120 } }}
                />
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 130, md: 130 } }}
                >
                  <InputLabel>Género</InputLabel>
                  <Select
                    value={filtroSexo}
                    label="Género"
                    onChange={(e) => setFiltroSexo(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="M">Hombre</MenuItem>
                    <MenuItem value="F">Mujer</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Edad Mín"
                  type="number"
                  value={filtroEdadMin}
                  onChange={(e) => setFiltroEdadMin(e.target.value)}
                  placeholder="Min"
                  inputProps={{ min: 0, max: 150 }}
                  sx={{ minWidth: { xs: "100%", sm: 100, md: 100 } }}
                />
                <TextField
                  size="small"
                  label="Edad Máx"
                  type="number"
                  value={filtroEdadMax}
                  onChange={(e) => setFiltroEdadMax(e.target.value)}
                  placeholder="Max"
                  inputProps={{ min: 0, max: 150 }}
                  sx={{ minWidth: { xs: "100%", sm: 100, md: 100 } }}
                />
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 180, md: 180 } }}
                >
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="con">Con (✓)</MenuItem>
                    <MenuItem value="sin">Sin (✗)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 200, md: 200 } }}
                >
                  <InputLabel>
                    {tabValue === 0 ? "Curso" : "Proceso"}
                  </InputLabel>
                  <Select
                    value={filtroCursoProceso}
                    label={tabValue === 0 ? "Curso" : "Proceso"}
                    onChange={(e) => setFiltroCursoProceso(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {tabValue === 0
                      ? cursos.map((curso) => (
                          <MenuItem key={curso.id} value={curso.id.toString()}>
                            {curso.nombre}
                          </MenuItem>
                        ))
                      : procesos.map((proceso) => (
                          <MenuItem
                            key={proceso.id}
                            value={proceso.id.toString()}
                          >
                            {proceso.nombre}
                            {proceso.certificable &&
                            proceso.certificable.toString().toLowerCase() ===
                              "si"
                              ? " (Certificable)"
                              : ""}
                          </MenuItem>
                        ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{ display: "block", color: "text.secondary" }}
            >
              Mostrando {empleadosFiltrados.length} de{" "}
              {empleadosNormalizados.length} empleados
            </Typography>
          </Box>

          {/* Tab Panel: Cursos */}
          <TabPanel value={tabValue} index={0}>
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: colors.primary.dark,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <SchoolIcon sx={{ mr: 1, fontSize: 24 }} />
                    Matriz de Cursos
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={descargarExcel}
                    sx={{
                      bgcolor: colors.primary.main,
                      "&:hover": { bgcolor: colors.primary.dark },
                    }}
                  >
                    Descargar Excel
                  </Button>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(colors.primary.main, 0.1),
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                            minWidth: 200,
                          }}
                        >
                          Empleado
                        </TableCell>
                        {cursos.map((curso) => (
                          <TableCell
                            key={curso.id}
                            align="center"
                            onClick={() => handleOrdenarColumna(curso.id)}
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha(colors.primary.main, 0.1),
                              minWidth: 150,
                              cursor: "pointer",
                              userSelect: "none",
                              "&:hover": {
                                bgcolor: alpha(colors.primary.main, 0.2),
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.5,
                              }}
                            >
                              <span>{curso.nombre}</span>
                              {columnaOrdenada === curso.id ? (
                                direccionOrden === "asc" ? (
                                  <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                                ) : (
                                  <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                                )
                              ) : (
                                <UnfoldMoreIcon
                                  sx={{ fontSize: 18, opacity: 0.3 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empleadosOrdenados.map((empleado) => (
                        <TableRow key={empleado.id} hover>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              position: "sticky",
                              left: 0,
                              bgcolor: "white",
                              zIndex: 2,
                            }}
                          >
                            {empleado.nombreCompleto || empleado.nombre}
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              ID: {empleado.emp_id}
                              {empleado.edad !== null &&
                                ` • Edad: ${empleado.edad}`}
                              {empleado.sexo &&
                                ` • ${
                                  empleado.sexo === "M"
                                    ? "Hombre"
                                    : empleado.sexo === "F"
                                    ? "Mujer"
                                    : empleado.sexo
                                }`}
                            </Typography>
                          </TableCell>
                          {cursos.map((curso) => {
                            const tiene = tieneRelacion(
                              empleado.emp_id,
                              curso.id,
                              "curso"
                            );
                            return (
                              <TableCell key={curso.id} align="center">
                                {tiene ? (
                                  <CheckCircleIcon
                                    sx={{ color: "#10B981", fontSize: 28 }}
                                  />
                                ) : (
                                  <CancelIcon
                                    sx={{ color: "#EF4444", fontSize: 28 }}
                                  />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab Panel: Procesos */}
          <TabPanel value={tabValue} index={1}>
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: colors.primary.dark,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <RequestQuoteIcon sx={{ mr: 1, fontSize: 24 }} />
                      Matriz de Procesos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ✓ Vigente | ! Vencida | ✗ Sin certificación
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={descargarExcel}
                    sx={{
                      bgcolor: colors.primary.main,
                      "&:hover": { bgcolor: colors.primary.dark },
                    }}
                  >
                    Descargar Excel
                  </Button>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(colors.primary.main, 0.1),
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                            minWidth: 200,
                          }}
                        >
                          Empleado
                        </TableCell>
                        {procesos.map((proceso) => {
                          const esCertificable =
                            proceso.certificable &&
                            proceso.certificable.toString().toLowerCase() ===
                              "si";
                          return (
                            <TableCell
                              key={proceso.id}
                              align="center"
                              onClick={() => handleOrdenarColumna(proceso.id)}
                              sx={{
                                fontWeight: 600,
                                bgcolor: esCertificable
                                  ? alpha("#22c55e", 0.18)
                                  : alpha(colors.primary.main, 0.1),
                                minWidth: 150,
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  bgcolor: esCertificable
                                    ? alpha("#16a34a", 0.25)
                                    : alpha(colors.primary.main, 0.2),
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 0.5,
                                }}
                              >
                                <span>{proceso.nombre}</span>
                                {esCertificable && (
                                  <WorkspacePremiumIcon
                                    sx={{ fontSize: 18, color: "#16a34a" }}
                                  />
                                )}
                                {columnaOrdenada === proceso.id ? (
                                  direccionOrden === "asc" ? (
                                    <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                                  )
                                ) : (
                                  <UnfoldMoreIcon
                                    sx={{ fontSize: 18, opacity: 0.3 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empleadosOrdenados.map((empleado) => (
                        <TableRow key={empleado.id} hover>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              position: "sticky",
                              left: 0,
                              bgcolor: "white",
                              zIndex: 2,
                            }}
                          >
                            {empleado.nombreCompleto || empleado.nombre}
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              ID: {empleado.emp_id}
                              {empleado.edad !== null &&
                                ` • Edad: ${empleado.edad}`}
                              {empleado.sexo &&
                                ` • ${
                                  empleado.sexo === "M"
                                    ? "Hombre"
                                    : empleado.sexo === "F"
                                    ? "Mujer"
                                    : empleado.sexo
                                }`}
                            </Typography>
                          </TableCell>
                          {procesos.map((proceso) => {
                            const estado = estadoProceso(empleado.emp_id, proceso.id);
                            return (
                              <TableCell key={proceso.id} align="center">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                  {estado === "vigente" ? (
                                    <CheckCircleIcon
                                      sx={{ color: "#10B981", fontSize: 28 }}
                                      titleAccess="Certificación vigente"
                                    />
                                  ) : estado === "vencida" ? (
                                    <WarningAmberIcon
                                      sx={{ color: "#F59E0B", fontSize: 28 }}
                                      titleAccess="Certificación vencida"
                                    />
                                  ) : (
                                    <CancelIcon
                                      sx={{ color: "#EF4444", fontSize: 28 }}
                                      titleAccess="Sin certificación"
                                    />
                                  )}
                                  {(estado === "vigente" || estado === "vencida") && (
                                    <Tooltip title="Ver historial de certificaciones">
                                      <IconButton
                                        size="small"
                                        onClick={() => abrirHistorial(empleado.emp_id, proceso, empleado.nombreCompleto || empleado.nombre)}
                                        sx={{ p: 0.25 }}
                                      >
                                        <HistoryIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>
        </CardContent>
      </Card>

      <Dialog open={historialDialog.open} onClose={() => setHistorialDialog((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          Historial de certificaciones
          {historialDialog.nombreEmpleado && historialDialog.nombreProceso && (
            <Typography variant="body2" color="text.secondary" fontWeight="normal">
              {historialDialog.nombreEmpleado} • {historialDialog.nombreProceso}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {historialDialog.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
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
                      <TableCell>{r.tipo || "nueva"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Consultar_matriz_habilidades;
