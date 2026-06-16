"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import PeopleIcon from "@mui/icons-material/People";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

function Lideres_calidad() {
  const [formData, setFormData] = useState({
    emp_id: "",
    emp_nombre: "",
    area: "",
  });
  const [lideres, setLideres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [editDialog, setEditDialog] = useState({
    open: false,
    lider: null,
  });

  useEffect(() => {
    fetchLideres();
  }, []);

  const fetchLideres = async () => {
    try {
      setLoadingTable(true);
      const response = await axios.get("/api/lideres_calidad");
      if (response.data.success) {
        setLideres(response.data.data);
      } else {
        showAlert("Error al cargar los líderes de calidad", "error");
      }
    } catch (error) {
      console.error("Error al obtener líderes de calidad:", error);
      showAlert("Error al cargar los líderes de calidad", "error");
    } finally {
      setLoadingTable(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.emp_id.trim() ||
      !formData.emp_nombre.trim() ||
      !formData.area.trim()
    ) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/lideres_calidad", {
        emp_id: formData.emp_id.trim(),
        emp_nombre: formData.emp_nombre.trim(),
        area: formData.area.trim(),
      });

      if (response.data.success) {
        showAlert("Líder de calidad agregado correctamente", "success");
        setFormData({ emp_id: "", emp_nombre: "", area: "" });
        fetchLideres();
      } else {
        showAlert(
          response.data.error || "Error al agregar el líder de calidad",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al agregar líder de calidad:", error);
      showAlert(
        error.response?.data?.error || "Error al agregar el líder de calidad",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lider) => {
    setEditDialog({
      open: true,
      lider: { ...lider },
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditDialog((prev) => ({
      ...prev,
      lider: {
        ...prev.lider,
        [name]: value,
      },
    }));
  };

  const handleUpdate = async () => {
    const { lider } = editDialog;
    if (
      !lider.emp_id?.toString().trim() ||
      !lider.emp_nombre?.toString().trim() ||
      !lider.area?.toString().trim()
    ) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put("/api/lideres_calidad", {
        emp_id: lider.emp_id,
        emp_nombre: lider.emp_nombre,
        area: lider.area,
      });

      if (response.data.success) {
        showAlert("Líder de calidad actualizado correctamente", "success");
        setEditDialog({ open: false, lider: null });
        fetchLideres();
      } else {
        showAlert(
          response.data.error || "Error al actualizar el líder de calidad",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al actualizar líder de calidad:", error);
      showAlert(
        error.response?.data?.error || "Error al actualizar el líder de calidad",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emp_id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este líder de calidad?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `/api/lideres_calidad?emp_id=${encodeURIComponent(emp_id)}`
      );

      if (response.data.success) {
        showAlert("Líder de calidad eliminado correctamente", "success");
        fetchLideres();
      } else {
        showAlert(
          response.data.error || "Error al eliminar el líder de calidad",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al eliminar líder de calidad:", error);
      showAlert(
        error.response?.data?.error || "Error al eliminar el líder de calidad",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "emp_id",
      headerName: "ID Empleado",
      width: 140,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "emp_nombre",
      headerName: "Nombre",
      flex: 1,
      minWidth: 220,
    },
    {
      field: "area",
      headerName: "Área",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 160,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{
                color: colors.primary.main,
                "&:hover": { bgcolor: alpha(colors.primary.main, 0.1) },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.emp_id)}
              sx={{
                color: colors.secondary.dark,
                "&:hover": { bgcolor: alpha(colors.secondary.dark, 0.1) },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: "100%" }}>
      {/* Alerta */}
      {alert.show && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "" })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Formulario de Alta de Líderes */}
      <Card
        sx={{
          mb: 4,
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            }}
          >
            <PeopleIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: colors.primary.dark }}
              >
                Líderes de Calidad
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                Registra y administra los líderes de calidad por área
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="ID Empleado"
                name="emp_id"
                value={formData.emp_id}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: colors.primary.main },
                    "&.Mui-focused fieldset": { borderColor: colors.primary.main },
                  },
                }}
              />
              <TextField
                label="Nombre del Empleado"
                name="emp_nombre"
                value={formData.emp_nombre}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Área"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={loading}
                  sx={{
                    bgcolor: colors.primary.main,
                    "&:hover": { bgcolor: colors.primary.dark },
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Guardando..." : "Agregar Líder"}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de Líderes */}
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
            }}
          >
            Líderes Registrados
          </Typography>
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={lideres}
              columns={columns}
              getRowId={(row) => row.emp_id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              loading={loadingTable}
              disableRowSelectionOnClick
              sx={{
                border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: alpha(colors.primary.main, 0.05),
                  fontWeight: 600,
                  fontSize: "0.95rem",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: alpha(colors.primary.main, 0.02),
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Diálogo de edición */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, lider: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: colors.primary.dark, fontWeight: 600 }}>
          Editar Líder de Calidad
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              label="ID Empleado"
              name="emp_id"
              value={editDialog.lider?.emp_id || ""}
              disabled
              fullWidth
            />
            <TextField
              label="Nombre del Empleado"
              name="emp_nombre"
              value={editDialog.lider?.emp_nombre || ""}
              onChange={handleEditChange}
              required
              fullWidth
            />
            <TextField
              label="Área"
              name="area"
              value={editDialog.lider?.area || ""}
              onChange={handleEditChange}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setEditDialog({ open: false, lider: null })}
            sx={{ color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: colors.primary.main,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Lideres_calidad;

