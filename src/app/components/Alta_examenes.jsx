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
} from "@mui/material";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AssessmentIcon from "@mui/icons-material/Assessment";

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
  ],
});

function Alta_examenes() {
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [preguntas, setPreguntas] = useState([initialPregunta()]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) setUsuario(u);
  }, []);

  const showAlert = (msg, type) => {
    setAlert({ show: true, message: msg, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

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
    setPreguntas((prev) => {
      const next = prev.map((p, i) => {
        if (i !== pIndex) return p;
        const opciones = p.opciones.map((o, j) => {
          if (j !== oIndex) return o;
          return { ...o, [field]: value };
        });
        return { ...p, opciones };
      });
      return next;
    });
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
        const orden = p.opciones.length;
        return {
          ...p,
          opciones: [
            ...p.opciones,
            { texto_opcion: "", es_correcta: false, orden },
          ],
        };
      })
    );
  };

  const removeOpcion = (pIndex, oIndex) => {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex) return p;
        if (p.opciones.length <= 2) return p;
        return {
          ...p,
          opciones: p.opciones.filter((_, j) => j !== oIndex),
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      showAlert("El nombre del examen es requerido", "error");
      return;
    }
    if (!usuario) {
      showAlert("No se encontró el usuario en el sistema", "error");
      return;
    }

    const preguntasValidas = [];
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      const opciones = (p.opciones || [])
        .filter((o) => o.texto_opcion?.trim())
        .map((o, j) => ({
          texto_opcion: o.texto_opcion.trim(),
          es_correcta: !!o.es_correcta,
          orden: j,
        }));
      if (!p.texto_pregunta?.trim() || opciones.length < 2) continue;
      const tieneCorrecta = opciones.some((o) => o.es_correcta);
      if (!tieneCorrecta) {
        showAlert(
          `La pregunta ${i + 1} debe tener al menos una opción marcada como correcta`,
          "error"
        );
        return;
      }
      preguntasValidas.push({
        texto_pregunta: p.texto_pregunta.trim(),
        orden: i,
        es_puntuada: p.es_puntuada !== false,
        opciones,
      });
    }

    if (preguntasValidas.length === 0) {
      showAlert("Agrega al menos una pregunta con 2+ opciones y una correcta", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/examenes", {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        creado_por: usuario,
        preguntas: preguntasValidas,
      });
      if (res.data.success) {
        showAlert("Examen creado exitosamente", "success");
        setFormData({ nombre: "", descripcion: "" });
        setPreguntas([initialPregunta()]);
      } else {
        showAlert(res.data.error || "Error al crear el examen", "error");
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Error al crear el examen", "error");
    } finally {
      setLoading(false);
    }
  };

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
            <AssessmentIcon
              sx={{ fontSize: 32, color: colors.primary.main, mr: 2 }}
            />
            <Typography variant="h5" fontWeight={600} color={colors.primary.dark}>
              Alta de Examen
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Nombre del examen"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="Ej: Examen de seguridad industrial"
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
                  key={pIndex}
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
                      placeholder="Escribe la pregunta..."
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
                          handlePreguntaChange(pIndex, "es_puntuada", e.target.checked)
                        }
                        size="small"
                      />
                    }
                    label="Cuenta para calificación"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    Opciones (marca la correcta)
                  </Typography>
                  <RadioGroup>
                    {pregunta.opciones.map((opcion, oIndex) => {
                      const letra = String.fromCharCode(97 + oIndex);
                      return (
                        <Box
                          key={oIndex}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Radio
                            checked={opcion.es_correcta}
                            onChange={() => setOpcionCorrecta(pIndex, oIndex)}
                            size="small"
                            sx={{ color: colors.primary.main, p: 0.5 }}
                          />
                          <Typography variant="body2" sx={{ minWidth: 20 }}>
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
                          disabled={pregunta.opciones.length <= 2}
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
                  }}
                >
                  {loading ? "Guardando..." : "Guardar examen"}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Alta_examenes;
