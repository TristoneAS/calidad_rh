"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  alpha,
  InputAdornment,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SearchIcon from "@mui/icons-material/Search";
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

function Consultar_procesos() {
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCertificable, setFiltroCertificable] = useState("todos"); // "todos", "si", "no"

  // Cargar procesos al montar el componente
  useEffect(() => {
    fetchProcesos();
  }, []);

  const fetchProcesos = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Filtrar procesos
  const procesosFiltrados = procesos.filter((proceso) => {
    // Filtro por nombre
    if (filtroNombre && filtroNombre.trim() !== "") {
      const nombreMatch = proceso.nombre
        .toLowerCase()
        .includes(filtroNombre.trim().toLowerCase());
      const descripcionMatch = proceso.descripcion
        .toLowerCase()
        .includes(filtroNombre.trim().toLowerCase());
      if (!nombreMatch && !descripcionMatch) return false;
    }

    // Filtro por certificable
    if (filtroCertificable && filtroCertificable !== "todos") {
      const esCertificable =
        (proceso.certificable || "").toString().toLowerCase() === "si";
      if (filtroCertificable === "si" && !esCertificable) return false;
      if (filtroCertificable === "no" && esCertificable) return false;
    }

    return true;
  });

  // Columnas de la tabla
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
      headerName: "Nombre",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const esCertificable =
          (params.row.certificable || "").toString().toLowerCase() === "si";
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
            {esCertificable && (
              <Chip
                icon={<WorkspacePremiumIcon sx={{ fontSize: 16 }} />}
                label="Certificable"
                size="small"
                sx={{
                  bgcolor: alpha("#22c55e", 0.1),
                  color: "#15803d",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 22,
                  "& .MuiChip-icon": {
                    color: "#16a34a",
                  },
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1,
      minWidth: 300,
    },
    {
      field: "certificable",
      headerName: "Certificable",
      width: 140,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const esCertificable =
          (params.value || "").toString().toLowerCase() === "si";
        return (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: esCertificable
                ? alpha("#22c55e", 0.1)
                : alpha("#9ca3af", 0.15),
              color: esCertificable ? "#15803d" : "#4b5563",
            }}
          >
            {esCertificable ? "Sí" : "No"}
          </Box>
        );
      },
    },
    {
      field: "creado_por",
      headerName: "Creado por",
      width: 150,
    },
  ];

  // Estadísticas
  const totalProcesos = procesos.length;
  const procesosCertificables = procesos.filter(
    (p) => (p.certificable || "").toString().toLowerCase() === "si"
  ).length;
  const procesosNoCertificables = totalProcesos - procesosCertificables;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F9FAFB",
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Card
        sx={{
          maxWidth: 1400,
          mx: "auto",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  bgcolor: alpha(colors.primary.main, 0.1),
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RequestQuoteIcon
                  sx={{ fontSize: 32, color: colors.primary.main }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#1F2937",
                    mb: 0.5,
                  }}
                >
                  Consultar Procesos
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#6B7280", fontSize: "0.875rem" }}
                >
                  Visualiza todos los procesos registrados en el sistema
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Alert */}
          {alert.show && (
            <Alert
              severity={alert.type}
              sx={{ mb: 3 }}
              onClose={() => setAlert({ show: false, message: "", type: "" })}
            >
              {alert.message}
            </Alert>
          )}

          {/* Estadísticas */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                bgcolor: alpha(colors.primary.main, 0.05),
                borderRadius: 2,
                p: 2,
                border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#6B7280", fontSize: "0.75rem", mb: 0.5 }}
              >
                Total de Procesos
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: colors.primary.main }}
              >
                {totalProcesos}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                bgcolor: alpha("#22c55e", 0.05),
                borderRadius: 2,
                p: 2,
                border: `1px solid ${alpha("#22c55e", 0.2)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#6B7280", fontSize: "0.75rem", mb: 0.5 }}
              >
                Certificables
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#15803d" }}
              >
                {procesosCertificables}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                bgcolor: alpha("#9ca3af", 0.05),
                borderRadius: 2,
                p: 2,
                border: `1px solid ${alpha("#9ca3af", 0.2)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#6B7280", fontSize: "0.75rem", mb: 0.5 }}
              >
                No Certificables
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#4b5563" }}
              >
                {procesosNoCertificables}
              </Typography>
            </Box>
          </Box>

          {/* Filtros */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              placeholder="Buscar por nombre o descripción..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              sx={{
                flex: 1,
                minWidth: { xs: "100%", sm: 300 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9CA3AF" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                label="Todos"
                onClick={() => setFiltroCertificable("todos")}
                color={filtroCertificable === "todos" ? "primary" : "default"}
                sx={{
                  cursor: "pointer",
                  fontWeight: filtroCertificable === "todos" ? 600 : 400,
                }}
              />
              <Chip
                icon={<WorkspacePremiumIcon sx={{ fontSize: 16 }} />}
                label="Certificables"
                onClick={() => setFiltroCertificable("si")}
                color={filtroCertificable === "si" ? "primary" : "default"}
                sx={{
                  cursor: "pointer",
                  fontWeight: filtroCertificable === "si" ? 600 : 400,
                  bgcolor:
                    filtroCertificable === "si"
                      ? alpha("#22c55e", 0.1)
                      : undefined,
                  color: filtroCertificable === "si" ? "#15803d" : undefined,
                }}
              />
              <Chip
                label="No Certificables"
                onClick={() => setFiltroCertificable("no")}
                color={filtroCertificable === "no" ? "primary" : "default"}
                sx={{
                  cursor: "pointer",
                  fontWeight: filtroCertificable === "no" ? 600 : 400,
                }}
              />
            </Box>
          </Box>

          {/* Tabla */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 400,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={procesosFiltrados}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 },
                  },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: `1px solid ${alpha("#E5E7EB", 0.5)}`,
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: alpha(colors.primary.main, 0.05),
                    borderBottom: `2px solid ${alpha(
                      colors.primary.main,
                      0.2
                    )}`,
                    fontWeight: 600,
                  },
                  "& .MuiDataGrid-row:hover": {
                    bgcolor: alpha(colors.primary.main, 0.02),
                  },
                }}
                getRowId={(row) => row.id}
              />
            </Box>
          )}

          {/* Contador de resultados */}
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              Mostrando {procesosFiltrados.length} de {totalProcesos} procesos
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Consultar_procesos;
