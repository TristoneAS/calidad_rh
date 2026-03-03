"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SafeButton from "@/app/components/common/SafeButton";

function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({ user: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.user === "" || user.password === "") {
      setSnackbarMessage("Favor de llenar todos los campos");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    const username = user.user.trim();
    const password = user.password.trim();

    try {
      setLoading(true);

      // 1) Intentar login como líder de calidad: usuario y contraseña iguales a emp_id en tabla lideres_calidad
      try {
        const liderRes = await fetch(
          `/api/lideres_calidad?emp_id=${encodeURIComponent(username)}`,
        );
        if (liderRes.ok) {
          const liderJson = await liderRes.json();
          if (liderJson?.success && liderJson.data && password === username) {
            // Login de líder de calidad exitoso
            const liderData = {
              ...liderJson.data,
              role: "lider_calidad",
              groups: [{ cn: "Calidad" }],
            };
            setSnackbarMessage("Iniciando Sesión (Líder de Calidad)");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            localStorage.setItem("user", JSON.stringify(liderData));
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("usuario", username);
            // Cookie de sesión (mantengo el mismo tiempo configurado que antes)
            try {
              const expiresAt = Date.now() + 30 * 60 * 1000;
              localStorage.setItem("sessionExpiresAt", expiresAt.toString());
              const expires = new Date(expiresAt).toUTCString();
              document.cookie = `pdc_session=authenticated; expires=${expires}; path=/; SameSite=Lax`;
            } catch (err) {
              console.error("No se pudo crear la cookie de sesión:", err);
            }
            setTimeout(() => {
              router.push("/dashboard");
            }, 500);
            return; // No continuar con autenticación externa
          }
        }
      } catch (err) {
        console.error("Error verificando líder de calidad:", err);
        // Si falla esta verificación, continuamos con el login normal
      }

      // 2) Login normal contra servidor de autenticación externo
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/CALIDAD_RH/AUTHENTICATE`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.authorization !== "Unauthorized") {
        setSnackbarMessage("Iniciando Sesion");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("usuario", username);
        // Crear cookie de sesión y guardar el timestamp de expiración
        try {
          const expiresAt = Date.now() + 30 * 60 * 1000;
          localStorage.setItem("sessionExpiresAt", expiresAt.toString());
          const expires = new Date(expiresAt).toUTCString();
          document.cookie = `pdc_session=authenticated; expires=${expires}; path=/; SameSite=Lax`;
        } catch (err) {
          console.error("No se pudo crear la cookie de sesión:", err);
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        setSnackbarMessage(
          "Error en autenticación: " +
            (data.message || "Credenciales inválidas"),
        );
        setLoading(false);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage(
        "Error al conectar con el servidor, contacte a soporte",
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #BFDBFE 0%, #93C5FD 40%, #FDBA74 100%)",
        p: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.25)",
          top: "-200px",
          left: "-200px",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          bottom: "-150px",
          right: "-150px",
        },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 40px rgba(59, 130, 246, 0.25)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Image
              src="/tristone_logo_head.png"
              alt="Tristone Logo"
              width={180}
              height={70}
              style={{ objectFit: "contain", maxWidth: "100%" }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#1E3A8A",
                mb: 1,
              }}
            >
              Bienvenido
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Inicia sesión en tu cuenta
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Usuario"
              name="user"
              value={user.user}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              required
              disabled={loading}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "#F9FAFB",
                  "&:hover fieldset": { borderColor: "#93C5FD" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3B82F6",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#64748b",
                  "&.Mui-focused": { color: "#3B82F6" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#3B82F6" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              value={user.password}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "#F9FAFB",
                  "&:hover fieldset": { borderColor: "#93C5FD" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3B82F6",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#64748b",
                  "&.Mui-focused": { color: "#3B82F6" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#3B82F6" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#3B82F6" }}
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <SafeButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #FDBA74 100%)",
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                color: "white",
                boxShadow: "0 4px 10px rgba(59, 130, 246, 0.35)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #FB923C 100%)",
                  transform: "translateY(-2px)",
                },
                "&:disabled": {
                  background: "#93C5FD",
                  transform: "none",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Iniciando Sesión...
                </Box>
              ) : (
                "Iniciar Sesión"
              )}
            </SafeButton>
          </Box>

          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={() => setOpenSnackbar(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setOpenSnackbar(false)}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
