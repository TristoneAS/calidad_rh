"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Button,
  CircularProgress,
  alpha,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

const colors = {
  primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
  secondary: { main: "#FDBA74", light: "#FED7AA", dark: "#FB923C" },
};

const initialPregunta = () => ({
  texto_pregunta: "",
  orden: 0,
  es_puntuada: true,
  opciones: [
    { texto_opcion: "", es_correcta: false, orden: 0 },
    { texto_opcion: "", es_correcta: false, orden: 1 },
    { texto_opcion: "", es_correcta: false, orden: 2 },
  ],
});

function normalizePreguntaApi(p, orden) {
  const opciones = (p.opciones || []).map((o, j) => ({
    id: o.id,
    texto_opcion: o.texto_opcion ?? "",
    es_correcta:
      o.es_correcta === 1 ||
      o.es_correcta === true ||
      o.es_correcta === "1",
    orden: j,
  }));
  while (opciones.length < 3) {
    opciones.push({
      texto_opcion: "",
      es_correcta: false,
      orden: opciones.length,
    });
  }

  return {
    id: p.id,
    texto_pregunta: p.texto_pregunta ?? "",
    orden,
    es_puntuada: p.es_puntuada !== 0 && p.es_puntuada !== false,
    opciones,
  };
}

function Modificar_examenes() {
  const [examenesLista, setExamenesLista] = useState([]);
  const [examenId, setExamenId] = useState("");
  const [examDbId, setExamDbId] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [preguntas, setPreguntas] = useState([initialPregunta()]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [loadingExamen, setLoadingExamen] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [modalGuardadoOpen, setModalGuardadoOpen] = useState(false);

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  useEffect(() => {
    const cargarLista = async () => {
      try {
        setLoadingLista(true);
        const res = await axios.get("/api/examenes");
        if (res.data.success) setExamenesLista(res.data.data || []);
        else showAlert("Error al cargar la lista de exámenes", "error");
      } catch (_) {
        showAlert("Error al cargar la lista de exámenes", "error");
      } finally {
        setLoadingLista(false);
      }
    };
    cargarLista();
  }, []);

  useEffect(() => {
    if (!examenId) {
      setExamDbId(null);
      setFormData({ nombre: "", descripcion: "" });
      setPreguntas([initialPregunta()]);
      return;
    }
    const cargar = async () => {
      try {
        setLoadingExamen(true);
        const res = await axios.get(`/api/examenes?id=${examenId}`);
        if (!res.data.success || !res.data.data) {
          showAlert(res.data.error || "No se pudo cargar el examen", "error");
          setExamDbId(null);
          return;
        }
        const data = res.data.data;
        setExamDbId(data.id);
        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
        });
        const pList = data.preguntas || [];
        if (pList.length === 0) {
          setPreguntas([initialPregunta()]);
          showAlert("Este examen no tiene preguntas; puedes agregarlas aquí.", "info");
        } else {
          setPreguntas(pList.map((p, idx) => normalizePreguntaApi(p, idx)));
        }
      } catch (_) {
        showAlert("Error al cargar el examen", "error");
      } finally {
        setLoadingExamen(false);
      }
    };
    cargar();
  }, [examenId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreguntaChange = (index, field, value) => {
    setPreguntas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleOpcionChange = (pIndex, oIndex, field, value) => {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex) return p;
        const opciones = p.opciones.map((o, j) => {
          if (j !== oIndex) return o;
          return { ...o, [field]: value };
        });
        return { ...p, opciones };
      })
    );
  };

  const setOpcionCorrecta = (pIndex, oIndex) => {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex) return p;
        return {
          ...p,
          opciones: p.opciones.map((o, j) => ({
            ...o,
            es_correcta: j === oIndex,
          })),
        };
      })
    );
  };

  const addPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      { ...initialPregunta(), orden: prev.length },
    ]);
  };

  const removePregunta = (index) => {
    if (preguntas.length <= 1) return;
    setPreguntas((prev) => prev.filter((_, i) => i !== index));
  };

  const addOpcion = (pIndex) => {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex) return p;
        return {
          ...p,
          opciones: [
            ...p.opciones,
            { texto_opcion: "", es_correcta: false, orden: p.opciones.length },
          ],
        };
      })
    );
  };

  const removeOpcion = (pIndex, oIndex) => {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex) return p;
        if (p.opciones.length <= 3) return p;
        return {
          ...p,
          opciones: p.opciones.filter((_, j) => j !== oIndex),
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examDbId) {
      showAlert("Selecciona un examen para modificar", "error");
      return;
    }
    if (!formData.nombre.trim()) {
      showAlert("El nombre del examen es requerido", "error");
      return;
    }

    const preguntasPayload = [];
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      const opciones = (p.opciones || [])
        .filter((o) => o.texto_opcion?.trim())
        .map((o, j) => {
          const row = {
            texto_opcion: o.texto_opcion.trim(),
            es_correcta: !!o.es_correcta,
            orden: j,
          };
          if (o.id != null && Number(o.id) > 0) row.id = Number(o.id);
          return row;
        });
      if (!p.texto_pregunta?.trim() || opciones.length < 2) continue;
      const tieneCorrecta = opciones.some((o) => o.es_correcta);
      if (!tieneCorrecta) {
        showAlert(
          `La pregunta ${i + 1} debe tener al menos una opción marcada como correcta`,
          "error"
        );
        return;
      }
      const q = {
        texto_pregunta: p.texto_pregunta.trim(),
        orden: i,
        es_puntuada: p.es_puntuada !== false,
        opciones,
      };
      if (p.id != null && Number(p.id) > 0) q.id = Number(p.id);
      preguntasPayload.push(q);
    }

    if (preguntasPayload.length === 0) {
      showAlert("Agrega al menos una pregunta con 2+ opciones y una correcta", "error");
      return;
    }

    try {
      setLoadingSave(true);
      const res = await axios.put("/api/examenes", {
        id: examDbId,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        preguntas: preguntasPayload,
      });
      if (res.data.success) {
        const refresh = await axios.get(`/api/examenes?id=${examDbId}`);
        if (refresh.data.success && refresh.data.data) {
          const data = refresh.data.data;
          const pList = data.preguntas || [];
          setPreguntas(
            pList.length
              ? pList.map((p, idx) => normalizePreguntaApi(p, idx))
              : [initialPregunta()]
          );
        }
        setModalGuardadoOpen(true);
      } else {
        showAlert(res.data.error || "Error al guardar", "error");
      }
    } catch (err) {
      showAlert(
        err.response?.data?.error || "Error al actualizar el examen",
        "error"
      );
    } finally {
      setLoadingSave(false);
    }
  };

  if (loadingLista) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
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
            <EditIcon sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }} />
            <Typography variant="h5" fontWeight={600} color={colors.primary.dark}>
              Modificar examen
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Examen a modificar</InputLabel>
            <Select
              value={examenId}
              label="Examen a modificar"
              onChange={(e) => setExamenId(e.target.value)}
            >
              <MenuItem value="">
                <em>Selecciona un examen</em>
              </MenuItem>
              {examenesLista.map((ex) => (
                <MenuItem key={ex.id} value={String(ex.id)}>
                  {ex.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingExamen && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {examDbId && !loadingExamen && (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Nombre del examen"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Opcional"
                />

                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  Preguntas (opción múltiple)
                </Typography>

                {preguntas.map((pregunta, pIndex) => (
                  <Paper
                    key={pregunta.id ?? `n-${pIndex}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <TextField
                        label={`Pregunta ${pIndex + 1}`}
                        value={pregunta.texto_pregunta}
                        onChange={(e) =>
                          handlePreguntaChange(
                            pIndex,
                            "texto_pregunta",
                            e.target.value
                          )
                        }
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                      <IconButton
                        color="error"
                        onClick={() => removePregunta(pIndex)}
                        disabled={preguntas.length <= 1}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={pregunta.es_puntuada !== false}
                          onChange={(e) =>
                            handlePreguntaChange(
                              pIndex,
                              "es_puntuada",
                              e.target.checked
                            )
                          }
                          size="small"
                        />
                      }
                      label="Cuenta para calificación"
                      sx={{ mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, mb: 1 }}
                    >
                      Opciones (marca la correcta)
                    </Typography>
                    <RadioGroup>
                      {pregunta.opciones.map((opcion, oIndex) => {
                        const letra = String.fromCharCode(65 + oIndex);
                        return (
                          <Box
                            key={opcion.id ?? `o-${pIndex}-${oIndex}`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Radio
                              checked={!!opcion.es_correcta}
                              onChange={() => setOpcionCorrecta(pIndex, oIndex)}
                              size="small"
                              sx={{ color: colors.primary.main, p: 0.5 }}
                            />
                            <Typography variant="body2" sx={{ minWidth: 24 }}>
                              {letra})
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder={`Opción ${letra}`}
                              value={opcion.texto_opcion}
                              onChange={(e) =>
                                handleOpcionChange(
                                  pIndex,
                                  oIndex,
                                  "texto_opcion",
                                  e.target.value
                                )
                              }
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeOpcion(pIndex, oIndex)}
                              disabled={pregunta.opciones.length <= 3}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </RadioGroup>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addOpcion(pIndex)}
                      sx={{ mt: 0.5 }}
                    >
                      Agregar opción
                    </Button>
                  </Paper>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPregunta}
                  sx={{
                    borderColor: colors.primary.main,
                    color: colors.primary.main,
                    "&:hover": {
                      borderColor: colors.primary.dark,
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  Agregar pregunta
                </Button>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      loadingSave ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={loadingSave}
                    sx={{
                      bgcolor: colors.primary.main,
                      "&:hover": { bgcolor: colors.primary.dark },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {loadingSave ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </Box>
              </Box>
            </form>
          )}

          {!loadingExamen && examenesLista.length === 0 && (
            <Alert severity="info">
              No hay exámenes activos. Crea uno en Alta de exámenes.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalGuardadoOpen}
        onClose={() => setModalGuardadoOpen(false)}
        aria-labelledby="dialog-guardado-titulo"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="dialog-guardado-titulo">Cambios guardados</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            El examen se actualizó correctamente en el sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setModalGuardadoOpen(false)}
            variant="contained"
            autoFocus
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Modificar_examenes;
