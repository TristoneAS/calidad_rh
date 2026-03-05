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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from "@mui/material";
import axios from "axios";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
  success: "#10B981",
  error: "#EF4444",
};

function Aplicar_examen() {
  const [examenes, setExamenes] = useState([]);
  const [examenSeleccionado, setExamenSeleccionado] = useState("");
  const [examenData, setExamenData] = useState(null);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empNombre, setEmpNombre] = useState("");
  const [respuestas, setRespuestas] = useState({});
  const [fechaAplicacion, setFechaAplicacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExamen, setLoadingExamen] = useState(false);
  const [loadingLista, setLoadingLista] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetchExamenes();
  }, []);

  const fetchExamenes = async () => {
    try {
      setLoadingLista(true);
      const res = await axios.get("/api/examenes");
      if (res.data.success) setExamenes(res.data.data || []);
      else showAlert("Error al cargar los exámenes", "error");
    } catch (err) {
      showAlert("Error al cargar los exámenes", "error");
    } finally {
      setLoadingLista(false);
    }
  };

  useEffect(() => {
    if (!examenSeleccionado) {
      setExamenData(null);
      setRespuestas({});
      return;
    }
    const cargarExamen = async () => {
      try {
        setLoadingExamen(true);
        const res = await axios.get(
          `/api/examenes?id=${examenSeleccionado}&para_aplicar=1`
        );
        if (res.data.success) {
          setExamenData(res.data.data);
          setRespuestas({});
          setResultado(null);
        } else {
          showAlert("Error al cargar el examen", "error");
        }
      } catch (err) {
        showAlert("Error al cargar el examen", "error");
      } finally {
        setLoadingExamen(false);
      }
    };
    cargarExamen();
  }, [examenSeleccionado]);

  const buscarEmpleado = async () => {
    if (!empIdInput.trim()) {
      showAlert("Ingresa el ID del empleado", "error");
      return;
    }
    try {
      const res = await axios.get(`/api/empleados?emp_id=${empIdInput.trim()}`);
      if (res.data.success && res.data.data) {
        const emp = res.data.data;
        setEmpNombre(emp.emp_nombre || emp.NOMBRE || emp.nombre || "Empleado");
      } else {
        setEmpNombre("");
        showAlert("Empleado no encontrado", "error");
      }
    } catch (_) {
      setEmpNombre("");
      showAlert("Error al buscar empleado", "error");
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const handleRespuesta = (idPregunta, idOpcion) => {
    setRespuestas((prev) => ({ ...prev, [idPregunta]: idOpcion }));
  };

  const handleEnviar = async () => {
    if (!empIdInput.trim()) {
      showAlert("Ingresa el ID del empleado", "error");
      return;
    }
    if (!examenData) {
      showAlert("Selecciona un examen", "error");
      return;
    }

    const preguntas = examenData.preguntas || [];
    const respuestasArray = preguntas
      .filter((p) => respuestas[p.id] != null)
      .map((p) => ({
        id_pregunta: p.id,
        id_opcion_seleccionada: respuestas[p.id],
      }));

    if (respuestasArray.length < preguntas.length) {
      showAlert("Responde todas las preguntas antes de enviar", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id_examen: examenData.id,
        emp_id: empIdInput.trim(),
        emp_nombre: empNombre || "Empleado",
        respuestas: respuestasArray,
      };
      if (fechaAplicacion && fechaAplicacion.trim()) {
        payload.fecha_aplicacion = fechaAplicacion.trim();
      }
      const res = await axios.post("/api/examenes/aplicar", payload);
      if (res.data.success) {
        setResultado(res.data.data);
        showAlert("Examen enviado correctamente", "success");
      } else {
        showAlert(res.data.error || "Error al enviar", "error");
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Error al enviar el examen", "error");
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setRespuestas({});
    setFechaAplicacion("");
    setExamenSeleccionado("");
    setExamenData(null);
  };

  if (loadingLista) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 800, mx: "auto" }}>
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
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(colors.primary.main, 0.2)}`,
            }}
          >
            <AssessmentIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h5" fontWeight={600} color={colors.primary.dark}>
              Aplicar Examen
            </Typography>
          </Box>

          {resultado ? (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: alpha(
                  resultado.aprobado ? colors.success : colors.error,
                  0.1
                ),
                border: `2px solid ${resultado.aprobado ? colors.success : colors.error}`,
                borderRadius: 2,
              }}
            >
              {resultado.aprobado ? (
                <CheckCircleIcon
                  sx={{ fontSize: 64, color: colors.success, mb: 1 }}
                />
              ) : (
                <CancelIcon sx={{ fontSize: 64, color: colors.error, mb: 1 }} />
              )}
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {resultado.aprobado ? "¡Aprobado!" : "No aprobado"}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 0.5 }}>
                Puntuación: {resultado.puntuacion}%
              </Typography>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Puntos obtenidos: {resultado.correctas} de {resultado.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultado.correctas} de {resultado.total} respuestas correctas
              </Typography>
              <Button
                variant="contained"
                onClick={reiniciar}
                sx={{ mt: 2 }}
              >
                Aplicar otro examen
              </Button>
            </Paper>
          ) : (
            <>
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <TextField
                  label="ID Empleado"
                  value={empIdInput}
                  onChange={(e) => setEmpIdInput(e.target.value)}
                  placeholder="Ej: 12345"
                  size="small"
                  sx={{ minWidth: 140 }}
                />
                <Button
                  variant="outlined"
                  onClick={buscarEmpleado}
                  sx={{ minWidth: 100 }}
                >
                  Buscar
                </Button>
                {empNombre && (
                  <Typography variant="body2" sx={{ alignSelf: "center" }}>
                    Empleado: <strong>{empNombre}</strong>
                  </Typography>
                )}
              </Box>

              <TextField
                label="Fecha y hora de aplicación"
                type="datetime-local"
                value={fechaAplicacion}
                onChange={(e) => setFechaAplicacion(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ mb: 3, maxWidth: 280 }}
                helperText="Dejar vacío para usar la fecha actual del sistema"
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Examen</InputLabel>
                <Select
                  value={examenSeleccionado}
                  label="Examen"
                  onChange={(e) => setExamenSeleccionado(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Selecciona un examen</em>
                  </MenuItem>
                  {examenes.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loadingExamen && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              )}

              {examenData && !loadingExamen && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {examenData.nombre}
                  </Typography>
                  {examenData.descripcion && (
                    <Typography variant="body2" color="text.secondary">
                      {examenData.descripcion}
                    </Typography>
                  )}

                  {(examenData.preguntas || []).map((pregunta, idx) => (
                    <Paper
                      key={pregunta.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        {idx + 1}. {pregunta.texto_pregunta}
                        {pregunta.es_puntuada === 0 && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1, fontWeight: 400 }}
                          >
                            (no puntúa)
                          </Typography>
                        )}
                      </Typography>
                      <RadioGroup
                        value={respuestas[pregunta.id] ?? ""}
                        onChange={(e) =>
                          handleRespuesta(
                            pregunta.id,
                            parseInt(e.target.value, 10)
                          )
                        }
                      >
                        {(pregunta.opciones || []).map((opcion, oIndex) => {
                          const letra = String.fromCharCode(97 + oIndex);
                          return (
                            <FormControlLabel
                              key={opcion.id}
                              value={opcion.id}
                              control={<Radio />}
                              label={`${letra}) ${opcion.texto_opcion || "(sin texto)"}`}
                              sx={{ mb: 0.5 }}
                            />
                          );
                        })}
                      </RadioGroup>
                    </Paper>
                  ))}

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SendIcon />
                      )
                    }
                    onClick={handleEnviar}
                    disabled={loading}
                    sx={{
                      bgcolor: colors.primary.main,
                      "&:hover": { bgcolor: colors.primary.dark },
                      py: 1.5,
                      mt: 2,
                    }}
                  >
                    {loading ? "Enviando..." : "Enviar examen"}
                  </Button>
                </Box>
              )}

              {!examenSeleccionado && examenes.length === 0 && (
                <Alert severity="info">
                  No hay exámenes disponibles. Crea uno en Alta de exámenes.
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Aplicar_examen;
