"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DeleteIcon from "@mui/icons-material/Delete";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
};

function Baja_examenes() {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, examen: null });

  useEffect(() => {
    fetchExamenes();
  }, []);

  const fetchExamenes = async () => {
    try {
      setLoadingTable(true);
      const res = await axios.get("/api/examenes");
      if (res.data.success) setExamenes(res.data.data || []);
      else showAlert("Error al cargar los exámenes", "error");
    } catch (err) {
      showAlert("Error al cargar los exámenes", "error");
    } finally {
      setLoadingTable(false);
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const handleDeleteConfirm = async () => {
    const { examen } = deleteDialog;
    if (!examen) return;
    try {
      setLoading(true);
      const res = await axios.delete(`/api/examenes?id=${examen.id}`);
      if (res.data.success) {
        showAlert("Examen dado de baja correctamente", "success");
        setDeleteDialog({ open: false, examen: null });
        fetchExamenes();
      } else {
        showAlert(res.data.error || "Error al dar de baja", "error");
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Error al dar de baja", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 200 },
    { field: "descripcion", headerName: "Descripción", flex: 1, minWidth: 180 },
    { field: "creado_por", headerName: "Creado por", width: 130 },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialog({ open: true, examen: params.row })}
        >
          Baja
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

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
              alignItems: "center",
              mb: 2,
              pb: 2,
              borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            }}
          >
            <AssessmentIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Box>
              <Typography variant="h5" fontWeight={600} color={colors.primary.dark}>
                Baja de Exámenes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecciona un examen para darlo de baja (ya no podrá aplicarse)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={examenes}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              loading={loadingTable}
              disableRowSelectionOnClick
              sx={{
                border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: alpha(colors.primary.main, 0.08),
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, examen: null })}
      >
        <DialogTitle>Confirmar baja</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que deseas dar de baja el examen &quot;{deleteDialog.examen?.nombre}&quot;?
            No podrá aplicarse a nuevos empleados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, examen: null })}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Dar de baja"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Baja_examenes;
