"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  Button,
  alpha,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

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

function Consultar_empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [empIdFilter, setEmpIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchEmpleados();
  }, []);

  useEffect(() => {
    filtrarEmpleados();
  }, [empIdFilter, empleados]);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      // Obtener todos los empleados - necesitamos crear un endpoint que traiga todos
      // Por ahora usaremos el endpoint existente pero necesitamos modificarlo
      const response = await axios.get("/api/empleados");
      if (response.data.success) {
        // Si viene un array, usarlo; si viene un objeto, convertirlo a array
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data
          ? [response.data.data]
          : [];
        setEmpleados(data);
        setEmpleadosFiltrados(data);
      } else {
        showAlert("Error al cargar los empleados", "error");
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      showAlert("Error al cargar los empleados", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtrarEmpleados = () => {
    if (!empIdFilter.trim()) {
      setEmpleadosFiltrados(empleados);
      return;
    }

    const filtrados = empleados.filter((emp) => {
      const empId = emp.NUM_EMPLEADO?.toString() || emp.num_empleado?.toString() || emp.emp_id?.toString() || emp.id?.toString() || "";
      return empId.toLowerCase().includes(empIdFilter.trim().toLowerCase());
    });

    setEmpleadosFiltrados(filtrados);
  };

  const handleSearch = () => {
    filtrarEmpleados();
  };

  const handleClear = () => {
    setEmpIdFilter("");
    setEmpleadosFiltrados(empleados);
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Normalizar los datos de empleados para asegurar que tengan los campos necesarios
  const empleadosNormalizados = empleadosFiltrados.map((emp, index) => ({
    id: emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id || `emp_${index}`,
    NUM_EMPLEADO: emp.NUM_EMPLEADO || emp.num_empleado || emp.emp_id || emp.id || "N/A",
    NOMBRE: emp.NOMBRE || emp.nombre || emp.emp_nombre || "N/A",
    APELLIDO1: emp.APELLIDO1 || emp.apellido1 || "N/A",
    APELLIDO2: emp.APELLIDO2 || emp.apellido2 || "N/A",
    FECHA_NACIMIENTO: emp.FECHA_NACIMIENTO || emp.fecha_nacimiento || "N/A",
    SEXO: emp.SEXO || emp.sexo || emp.emp_genero || emp.genero || "N/A",
    FECHA_ANTIGUEDAD: emp.FECHA_ANTIGUEDAD || emp.fecha_antiguedad || "N/A",
    CATEGORIA: emp.CATEGORIA || emp.categoria || emp.emp_categoria || "N/A",
    ID_JEFE: emp.ID_JEFE || emp.id_jefe || emp.emp_id_jefe || "N/A",
    NOMBRE_JEFE: emp.NOMBRE_JEFE || emp.nombre_jefe || "N/A",
  }));

  // Columnas para la tabla - campos de la tabla empleados
  const columns = [
    {
      field: "NUM_EMPLEADO",
      headerName: "Número Empleado",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "NOMBRE",
      headerName: "Nombre",
      width: 200,
      flex: 1,
    },
    {
      field: "APELLIDO1",
      headerName: "Primer Apellido",
      width: 200,
      flex: 1,
    },
    {
      field: "APELLIDO2",
      headerName: "Segundo Apellido",
      width: 200,
      flex: 1,
    },
    {
      field: "FECHA_NACIMIENTO",
      headerName: "Fecha Nacimiento",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "SEXO",
      headerName: "Sexo",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "FECHA_ANTIGUEDAD",
      headerName: "Fecha Antigüedad",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "CATEGORIA",
      headerName: "Categoría",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "ID_JEFE",
      headerName: "ID Jefe",
      width: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "NOMBRE_JEFE",
      headerName: "Nombre Jefe",
      width: 200,
      flex: 1,
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
            <PeopleIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Consultar Empleados
            </Typography>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Filtro por NUM_EMPLEADO */}
          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              label="Filtrar por Número de Empleado"
              value={empIdFilter}
              onChange={(e) => setEmpIdFilter(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Ingresa el número de empleado"
              sx={{ maxWidth: 400 }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{
                bgcolor: colors.primary.main,
                "&:hover": { bgcolor: colors.primary.dark },
                minWidth: 150,
              }}
            >
              Buscar
            </Button>
            {empIdFilter && (
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                sx={{
                  borderColor: colors.secondary.main,
                  color: colors.secondary.dark,
                  "&:hover": {
                    borderColor: colors.secondary.dark,
                    bgcolor: alpha(colors.secondary.main, 0.1),
                  },
                }}
              >
                Limpiar
              </Button>
            )}
          </Box>

          {/* Tabla de Empleados */}
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
                <PeopleIcon sx={{ mr: 1, fontSize: 24 }} />
                Empleados ({empleadosFiltrados.length})
              </Typography>

              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={empleadosNormalizados}
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
        </CardContent>
      </Card>
    </Box>
  );
}

export default Consultar_empleados;
