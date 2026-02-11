"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";

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

function Alta_procesos() {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    certificable: "no",
  });
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [editDialog, setEditDialog] = useState({
    open: false,
    proceso: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [usuario, setUsuario] = useState("");

  // Obtener usuario del localStorage
  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (user) {
      setUsuario(user);
    }
  }, []);

  // Cargar procesos al montar el componente
  useEffect(() => {
    fetchProcesos();
  }, []);

  const fetchProcesos = async () => {
    try {
      setLoadingTable(true);
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

    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }

    if (!usuario) {
      showAlert("No se encontró el usuario en el sistema", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/procesos", {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        creado_por: usuario,
        certificable: formData.certificable,
      });

      if (response.data.success) {
        showAlert("Proceso creado exitosamente", "success");
        setFormData({ nombre: "", descripcion: "", certificable: "no" });
        fetchProcesos();
      } else {
        showAlert(response.data.error || "Error al crear el proceso", "error");
      }
    } catch (error) {
      console.error("Error al crear proceso:", error);
      showAlert(
        error.response?.data?.error || "Error al crear el proceso",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proceso) => {
    setEditDialog({
      open: true,
      proceso: {
        ...proceso,
        certificable: proceso.certificable || "no",
      },
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditDialog((prev) => ({
      ...prev,
      proceso: {
        ...prev.proceso,
        [name]: value,
      },
    }));
  };

  const handleUpdate = async () => {
    const { proceso } = editDialog;
    if (!proceso.nombre.trim() || !proceso.descripcion.trim()) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put("/api/procesos", {
        id: proceso.id,
        nombre: proceso.nombre.trim(),
        descripcion: proceso.descripcion.trim(),
        certificable: proceso.certificable || "no",
      });

      if (response.data.success) {
        showAlert("Proceso actualizado exitosamente", "success");
        setEditDialog({ open: false, proceso: null });
        fetchProcesos();
      } else {
        showAlert(
          response.data.error || "Error al actualizar el proceso",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al actualizar proceso:", error);
      showAlert(
        error.response?.data?.error || "Error al actualizar el proceso",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `/api/procesos?id=${deleteDialog.id}`
      );

      if (response.data.success) {
        showAlert("Proceso eliminado exitosamente", "success");
        setDeleteDialog({ open: false, id: null });
        fetchProcesos();
      } else {
        showAlert(
          response.data.error || "Error al eliminar el proceso",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al eliminar proceso:", error);
      showAlert(
        error.response?.data?.error || "Error al eliminar el proceso",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

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
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1,
      minWidth: 250,
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
      headerName: "Agregado por",
      width: 150,
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 150,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{
                color: colors.primary.main,
                "&:hover": {
                  bgcolor: alpha(colors.primary.main, 0.1),
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row.id)}
              sx={{
                color: colors.secondary.dark,
                "&:hover": {
                  bgcolor: alpha(colors.secondary.dark, 0.1),
                },
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

      {/* Formulario de Alta */}
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
            <RequestQuoteIcon
              sx={{
                fontSize: 32,
                color: colors.primary.main,
                mr: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: colors.primary.dark }}
            >
              Alta de Proceso
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Nombre del Proceso"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: colors.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.primary.main,
                    },
                  },
                }}
              />

              <TextField
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: colors.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.primary.main,
                    },
                  },
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Certificable</InputLabel>
                <Select
                  name="certificable"
                  label="Certificable"
                  value={formData.certificable}
                  onChange={handleInputChange}
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="si">Sí</MenuItem>
                </Select>
              </FormControl>

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
                    "&:hover": {
                      bgcolor: colors.primary.dark,
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Guardando..." : "Guardar Proceso"}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de Procesos */}
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
            <RequestQuoteIcon sx={{ mr: 1, fontSize: 24 }} />
            Procesos Registrados
          </Typography>

          <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={procesos}
              columns={columns}
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

      {/* Diálogo de Edición */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, proceso: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: colors.primary.dark, fontWeight: 600 }}>
          Editar Proceso
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              label="Nombre del Proceso"
              name="nombre"
              value={editDialog.proceso?.nombre || ""}
              onChange={handleEditChange}
              required
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={editDialog.proceso?.descripcion || ""}
              onChange={handleEditChange}
              required
              fullWidth
              multiline
              rows={4}
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Certificable</InputLabel>
              <Select
                name="certificable"
                label="Certificable"
                value={editDialog.proceso?.certificable || "no"}
                onChange={handleEditChange}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="si">Sí</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setEditDialog({ open: false, proceso: null })}
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
              "&:hover": {
                bgcolor: colors.primary.dark,
              },
            }}
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle sx={{ color: colors.secondary.dark, fontWeight: 600 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este proceso? Esta acción no se
            puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null })}
            sx={{ color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: colors.secondary.dark,
              "&:hover": {
                bgcolor: colors.secondary.main,
              },
            }}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Alta_procesos;
