"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import SchoolIcon from "@mui/icons-material/School";

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

function Consultar_cursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
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
      field: "nombre",
      headerName: "Nombre del Curso",
      width: 300,
      flex: 1,
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      width: 400,
      flex: 1,
    },
    {
      field: "creado_por",
      headerName: "Creado Por",
      width: 200,
      headerAlign: "center",
      align: "center",
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
            <SchoolIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Consultar Cursos
            </Typography>
          </Box>

          {alert.show && (
            <Alert severity={alert.type} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Tabla de Cursos */}
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
                <SchoolIcon sx={{ mr: 1, fontSize: 24 }} />
                Cursos Registrados ({cursos.length})
              </Typography>

              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={cursos}
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

export default Consultar_cursos;


