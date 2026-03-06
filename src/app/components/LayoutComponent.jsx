"use client";
import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Box,
  CircularProgress,
  Backdrop,
  Divider,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";

import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import BusinessIcon from "@mui/icons-material/Business";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HistoryIcon from "@mui/icons-material/History";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";

// Colores profesionales basados en el logo
const colors = {
  primary: {
    main: "#3B82F6", // Azul principal
    light: "#60A5FA",
    dark: "#2563EB",
  },
  secondary: {
    main: "#FDBA74", // Naranja principal
    light: "#FED7AA",
    dark: "#FB923C",
  },
  background: {
    drawer: "#FFFFFF",
    appBar: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #FDBA74 100%)",
  },
  error: "#EF4444",
};

const drawerWidth = 280;
const drawerWidthSmall = 240; // Ancho reducido para pantallas pequeñas

const App = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallScreen = useMediaQuery("(max-width: 390px)");
  const [open, setOpen] = useState(false); // Cerrado por defecto para pantallas pequeñas
  const [expanded, setExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Permisos: "Admin" | "Calidad" | "RH" | "Supervisor" (extraído de data.groups[0].cn o role)
  const [isLiderCalidad, setIsLiderCalidad] = useState(false);
  const isAdmin = userRole === "Admin";
  const isCalidad = userRole === "Calidad";
  const isRH = userRole === "RH";
  const isSupervisor = userRole === "Supervisor";
  const showCalidad = isAdmin || isCalidad || isSupervisor;
  const showRH = isAdmin || isRH;
  // Líder de calidad: NO puede enviar solicitudes. Calidad/Supervisor externo: NO puede gestionar auditoría.
  const puedeEnviarSolicitudes = isAdmin || !isLiderCalidad;
  const puedeGestionarAuditoria = isAdmin || isLiderCalidad; // Admin y líder de calidad sí; Calidad/Supervisor externo no.

  const handleToggleSidebar = () => setOpen(!open);
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Cerrar drawer en móviles al hacer clic en un elemento
  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  // Ajustar el estado del drawer cuando cambia el tamaño de pantalla
  useEffect(() => {
    setIsClient(true);
    // En pantallas pequeñas, el drawer siempre está cerrado por defecto
    if (!isSmallScreen && !isMobile) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isMobile, isSmallScreen]);

  // Leer permisos desde localStorage: data.groups[0].cn (última palabra) o role
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = window.localStorage.getItem("user");
      if (!storedUser) {
        setUserRole(null);
        return;
      }
      const data = JSON.parse(storedUser);
      const validRoles = ["Admin", "Calidad", "RH", "Supervisor"];

      setIsLiderCalidad(data?.role === "lider_calidad");

      // 1) Intentar desde data.data.groups[0].cn (última palabra)
      const cn = data?.data?.groups?.[0]?.cn;
      if (cn && typeof cn === "string") {
        const parts = cn
          .trim()
          .split(/[\s._-]+/)
          .filter(Boolean);
        const lastWord = parts.length ? parts[parts.length - 1] : "";
        if (validRoles.includes(lastWord)) {
          setUserRole(lastWord);
          return;
        }
      }

      // 2) Fallback: lider_calidad → Calidad
      if (data?.role === "lider_calidad") {
        setUserRole("Calidad");
        return;
      }

      setUserRole(null);
    } catch (err) {
      console.error("Error leyendo permisos desde localStorage:", err);
      setUserRole(null);
    }
  }, []);

  const handleLogout = () => {
    try {
      // Borrar cookie de sesión
      if (typeof document !== "undefined") {
        document.cookie =
          "pdc_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
      }

      // Limpiar datos de autenticación en localStorage
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem("user");
          window.localStorage.removeItem("isAuthenticated");
          window.localStorage.removeItem("usuario");
          window.localStorage.removeItem("sessionExpiresAt");
        } catch (err) {
          console.error("Error limpiando localStorage en logout:", err);
        }
      }

      // Redirigir al login
      router.push("/");
    } catch (error) {
      console.error("Error en cerrar sesión:", error);
      router.push("/");
    }
  };

  // Verificar cookie de sesión (expira a los 5 minutos desde login)
  useEffect(() => {
    if (!isClient) return;
    if (typeof document === "undefined") return;

    const checkSessionCookie = () => {
      try {
        const allCookies = document.cookie || "";
        const hasSession = allCookies
          .split(";")
          .some((c) => c.trim().startsWith("pdc_session="));

        if (!hasSession) {
          // Si no hay cookie de sesión, limpiar credenciales y regresar al login
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem("user");
              window.localStorage.removeItem("isAuthenticated");
              window.localStorage.removeItem("usuario");
              window.localStorage.removeItem("sessionExpiresAt");
            } catch (err) {
              console.error(
                "Error limpiando localStorage tras expirar sesión:",
                err,
              );
            }
          }
          router.push("/");
        }
      } catch (err) {
        console.error("Error al verificar cookie de sesión:", err);
      }
    };

    checkSessionCookie();
    const intervalId = setInterval(checkSessionCookie, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [isClient, router]);

  // Contador regresivo de la sesión (basado en sessionExpiresAt en localStorage)
  useEffect(() => {
    if (!isClient) return;
    if (typeof window === "undefined") return;

    const updateTimeLeft = () => {
      try {
        const expiresAtStr = window.localStorage.getItem("sessionExpiresAt");
        if (!expiresAtStr) {
          setTimeLeft(null);
          return;
        }
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Number.isNaN(expiresAt)) {
          setTimeLeft(null);
          return;
        }
        const diffMs = expiresAt - Date.now();
        if (diffMs <= 0) {
          setTimeLeft(0);
          return;
        }
        const seconds = Math.ceil(diffMs / 1000);
        setTimeLeft(seconds);
      } catch (err) {
        console.error("Error calculando tiempo restante de sesión:", err);
        setTimeLeft(null);
      }
    };

    updateTimeLeft();
    const intervalId = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(intervalId);
  }, [isClient]);

  if (!isClient) {
    // 🧩 Evita renderizar hasta que el cliente esté listo
    return null;
  }

  const currentDrawerWidth = isSmallScreen ? drawerWidthSmall : drawerWidth;

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "#F8FAFC",
        width: isSmallScreen ? "390px" : "100%",
        height: isSmallScreen ? "888px" : "100vh",
        minHeight: isSmallScreen ? "888px" : "100vh",
        maxHeight: isSmallScreen ? "888px" : "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 🔹 NAVBAR */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: colors.background.appBar,
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.25)",
          height: isSmallScreen ? "56px" : "64px",
        }}
      >
        <Toolbar
          sx={{
            minHeight: isSmallScreen ? "56px !important" : "64px",
            height: isSmallScreen ? "56px" : "64px",
            px: isSmallScreen ? 1 : 2,
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleToggleSidebar}
            sx={{
              mr: 2,
              "&:hover": {
                bgcolor: alpha("#FFFFFF", 0.1),
              },
            }}
          >
            <MenuIcon fontSize={isSmallScreen ? "small" : "medium"} />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 600,
              letterSpacing: "0.5px",
              fontSize: isSmallScreen
                ? "0.75rem"
                : {
                    xs: "0.875rem",
                    sm: "1rem",
                    md: "1.25rem",
                  },
            }}
          >
            {isSmallScreen
              ? "PDC"
              : "Plataforma de Desarrollo y Certificación (PDC)"}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {timeLeft !== null && timeLeft > 0 && timeLeft <= 10 && (
            <Typography
              variant="body2"
              sx={{
                mr: 1.5,
                px: 1.5,
                py: 0.4,
                borderRadius: 999,
                fontWeight: 700,
                color: "#111827",
                bgcolor: "rgba(255,255,255,0.9)",
                fontSize: isSmallScreen ? "0.65rem" : "0.85rem",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
              }}
            >
              Tu sesión expira en {timeLeft}s
            </Typography>
          )}
          <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{
              ml: 1,
              "&:hover": {
                bgcolor: alpha("#FFFFFF", 0.12),
              },
            }}
          >
            <LogoutIcon fontSize={isSmallScreen ? "small" : "medium"} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 🔹 SIDEBAR */}
      <Drawer
        variant={isMobile || isSmallScreen ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={handleToggleSidebar}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en móviles
        }}
        sx={{
          width: 10,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentDrawerWidth,
            boxSizing: "border-box",
            bgcolor: colors.background.drawer,
            borderRight: `1px solid ${alpha(colors.primary.main, 0.12)}`,
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)",
            top: isSmallScreen ? "56px" : "64px",
            height: isSmallScreen ? "calc(888px - 56px)" : "calc(100vh - 64px)",
            ...((isMobile || isSmallScreen) && {
              boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
            }),
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: isSmallScreen ? 1.5 : 3,
            px: isSmallScreen ? 1 : 2,
            mt: 0,
            borderBottom: `2px solid ${alpha(colors.primary.main, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha(
              colors.primary.main,
              0.05,
            )} 0%, ${alpha(colors.secondary.main, 0.05)} 100%)`,
          }}
        >
          <img
            src="/tristone_logo_head.png"
            alt="Logo Tristone"
            style={{
              width: isSmallScreen ? "50%" : "60%",
              maxWidth: isSmallScreen ? "100px" : "150px",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              color: alpha("#000", 0.6),
              fontWeight: 500,
              fontSize: isSmallScreen ? "0.65rem" : "0.75rem",
            }}
          >
            Sistema de Gestión
          </Typography>
        </Box>

        {/* Navegación al Dashboard */}
        <Box sx={{ px: isSmallScreen ? 1 : 2, pt: isSmallScreen ? 1 : 2 }}>
          <ListItemButton
            onClick={() => {
              router.push("/dashboard");
              handleMenuItemClick();
            }}
            sx={{
              borderRadius: 1.5,
              bgcolor: alpha(colors.primary.main, 0.08),
              "&:hover": {
                bgcolor: alpha(colors.primary.main, 0.15),
              },
            }}
          >
            <DashboardIcon
              sx={{
                mr: isSmallScreen ? 1 : 1.5,
                fontSize: isSmallScreen ? 20 : 24,
                color: colors.primary.dark,
              }}
            />
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontSize: isSmallScreen ? "0.8rem" : "0.9rem",
                fontWeight: 600,
                color: colors.primary.dark,
              }}
            />
          </ListItemButton>
        </Box>

        {/* 🔹 DEPARTAMENTO: SUPERVISORES */}
        {showCalidad && (
          <Box sx={{ px: isSmallScreen ? 1 : 2, pt: isSmallScreen ? 1 : 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                px: isSmallScreen ? 1 : 2,
                py: isSmallScreen ? 1 : 1.5,
                fontWeight: 700,
                fontSize: isSmallScreen ? "0.7rem" : "0.85rem",
                color: colors.primary.dark,
                display: "flex",
                alignItems: "center",
                bgcolor: alpha(colors.primary.main, 0.08),
                borderRadius: 2,
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <BusinessIcon
                sx={{
                  mr: isSmallScreen ? 1 : 1.5,
                  fontSize: isSmallScreen ? 16 : 20,
                }}
              />
              Supervisores
            </Typography>

            {/* Calidad - Solicitudes */}
            <Accordion
              expanded={expanded === "Calidad-Solicitudes"}
              onChange={handleChange("Calidad-Solicitudes")}
              sx={{
                boxShadow: "none",
                "&:before": { display: "none" },
                border: `1px solid ${alpha(colors.primary.main, 0.1)}`,
                borderRadius: 2,
                mb: 1,
                "&.Mui-expanded": {
                  bgcolor: alpha(colors.primary.main, 0.03),
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon sx={{ color: colors.primary.main }} />
                }
                sx={{
                  "&:hover": {
                    bgcolor: alpha(colors.primary.main, 0.05),
                  },
                  borderRadius: 2,
                }}
              >
                <RequestQuoteIcon
                  sx={{
                    mr: isSmallScreen ? 1 : 1.5,
                    color: colors.primary.main,
                    fontSize: isSmallScreen ? 18 : 22,
                  }}
                />
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                  }}
                >
                  Solicitudes a entrenamiento
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                <List disablePadding>
                  {puedeEnviarSolicitudes && (
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/calidad/solicitar_certificacion");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        "&:hover": {
                          bgcolor: alpha(colors.primary.main, 0.08),
                        },
                      }}
                    >
                      <PersonAddIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.primary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Solicitar Certificación"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  )}
                  {puedeGestionarAuditoria && (
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/calidad/gestionar_examenes");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.primary.main, 0.08),
                        },
                      }}
                    >
                      <AssessmentIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.primary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Gestionar Auditoría de Producto"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Calidad - Líderes de Calidad (solo Admin) */}
            {isAdmin && (
              <Accordion
                expanded={expanded === "Calidad-Lideres"}
                onChange={handleChange("Calidad-Lideres")}
                sx={{
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  border: `1px solid ${alpha(colors.primary.main, 0.1)}`,
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-expanded": {
                    bgcolor: alpha(colors.primary.main, 0.03),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: colors.primary.main }} />
                  }
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.05),
                    },
                    borderRadius: 2,
                  }}
                >
                  <PeopleIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      color: colors.primary.main,
                      fontSize: isSmallScreen ? 18 : 22,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                    }}
                  >
                    Líderes de Calidad
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <List disablePadding>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/calidad/lideres_calidad");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        "&:hover": {
                          bgcolor: alpha(colors.primary.main, 0.08),
                        },
                      }}
                    >
                      <PersonAddIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.primary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Administrar Líderes"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {showRH && (
          <>
            <Divider
              sx={{ my: isSmallScreen ? 1 : 2, mx: isSmallScreen ? 1 : 2 }}
            />

            {/* 🔹 DEPARTAMENTO: RH */}
            <Box sx={{ px: isSmallScreen ? 1 : 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  px: isSmallScreen ? 1 : 2,
                  py: isSmallScreen ? 1 : 1.5,
                  fontWeight: 700,
                  fontSize: isSmallScreen ? "0.7rem" : "0.85rem",
                  color: colors.secondary.dark,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: alpha(colors.secondary.main, 0.12),
                  borderRadius: 2,
                  mb: 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <PeopleIcon
                  sx={{
                    mr: isSmallScreen ? 1 : 1.5,
                    fontSize: isSmallScreen ? 16 : 20,
                  }}
                />
                Recursos Humanos
              </Typography>

              {/* RH - Cursos */}
              <Accordion
                expanded={expanded === "RH-Cursos"}
                onChange={handleChange("RH-Cursos")}
                sx={{
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  border: `1px solid ${alpha(colors.secondary.main, 0.15)}`,
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-expanded": {
                    bgcolor: alpha(colors.secondary.main, 0.05),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: colors.secondary.dark }} />
                  }
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(colors.secondary.main, 0.08),
                    },
                    borderRadius: 2,
                  }}
                >
                  <SchoolIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      color: colors.secondary.dark,
                      fontSize: isSmallScreen ? 18 : 22,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                    }}
                  >
                    Cursos
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <List disablePadding>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/cursos/alta_curso");
                        handleMenuItemClick();
                      }}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <AddCircleOutlineIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Alta"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/cursos/enrolar_curso");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <PersonAddIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Enrolar (por N° Empleado)"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* RH - Empleados */}
              <Accordion
                expanded={expanded === "RH-Empleados"}
                onChange={handleChange("RH-Empleados")}
                sx={{
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  border: `1px solid ${alpha(colors.secondary.main, 0.15)}`,
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-expanded": {
                    bgcolor: alpha(colors.secondary.main, 0.05),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: colors.secondary.dark }} />
                  }
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(colors.secondary.main, 0.08),
                    },
                    borderRadius: 2,
                  }}
                >
                  <PeopleIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      color: colors.secondary.dark,
                      fontSize: isSmallScreen ? 18 : 22,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                    }}
                  >
                    Empleados
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <List disablePadding>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/empleados/cargar_empleados");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <UploadFileIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Cargar (Excel/CSV)"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/empleados/cargar_bajas");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <RemoveCircleOutlineIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.error,
                        }}
                      />
                      <ListItemText
                        primary="Bajas (Excel/CSV)"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* RH - Exámenes */}
              <Accordion
                expanded={expanded === "RH-Examenes"}
                onChange={handleChange("RH-Examenes")}
                sx={{
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  border: `1px solid ${alpha(colors.secondary.main, 0.15)}`,
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-expanded": {
                    bgcolor: alpha(colors.secondary.main, 0.05),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: colors.secondary.dark }} />
                  }
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(colors.secondary.main, 0.08),
                    },
                    borderRadius: 2,
                  }}
                >
                  <AssessmentIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      color: colors.secondary.dark,
                      fontSize: isSmallScreen ? 18 : 22,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                    }}
                  >
                    Exámenes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <List disablePadding>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/examenes/alta_examenes");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <AddCircleOutlineIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Alta"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/examenes/baja_examenes");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <RemoveCircleOutlineIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Baja"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/examenes/aplicar_examen");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <SchoolIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Aplicar"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/examenes/historial_examenes");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <HistoryIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Historial"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* RH - Procesos */}
              <Accordion
                expanded={expanded === "RH-Procesos"}
                onChange={handleChange("RH-Procesos")}
                sx={{
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  border: `1px solid ${alpha(colors.secondary.main, 0.15)}`,
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-expanded": {
                    bgcolor: alpha(colors.secondary.main, 0.05),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: colors.secondary.dark }} />
                  }
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(colors.secondary.main, 0.08),
                    },
                    borderRadius: 2,
                  }}
                >
                  <RequestQuoteIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      color: colors.secondary.dark,
                      fontSize: isSmallScreen ? 18 : 22,
                    }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                    }}
                  >
                    Procesos
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <List disablePadding>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/procesos/alta_procesos");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <AddCircleOutlineIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Alta"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push("/dashboard/procesos/enrolar_proceso");
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <PersonAddIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Enrolar (por N° Empleado)"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push(
                          "/dashboard/procesos/gestionar_entrenamientos",
                        );
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <SchoolIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Gestionar Examenes de entrenamiento"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push(
                          "/dashboard/procesos/asignar_certificacion",
                        );
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <WorkspacePremiumIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Asignar Certificación"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        router.push(
                          "/dashboard/calidad/certificaciones_vigencia",
                        );
                        handleMenuItemClick();
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mt: 0.5,
                        "&:hover": {
                          bgcolor: alpha(colors.secondary.main, 0.1),
                        },
                      }}
                    >
                      <WorkspacePremiumIcon
                        sx={{
                          mr: isSmallScreen ? 1 : 1.5,
                          fontSize: isSmallScreen ? 16 : 20,
                          color: colors.secondary.dark,
                        }}
                      />
                      <ListItemText
                        primary="Certificaciones (vigencia y renovación)"
                        primaryTypographyProps={{
                          fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Box>
          </>
        )}

        <Divider
          sx={{ my: isSmallScreen ? 1 : 2, mx: isSmallScreen ? 1 : 2 }}
        />

        {/* 🔹 DEPARTAMENTO: CONSULTAS */}
        <Box sx={{ px: isSmallScreen ? 1 : 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              px: isSmallScreen ? 1 : 2,
              py: isSmallScreen ? 1 : 1.5,
              fontWeight: 700,
              fontSize: isSmallScreen ? "0.7rem" : "0.85rem",
              color: "#1E40AF", // tono azul más oscuro
              display: "flex",
              alignItems: "center",
              bgcolor: alpha(colors.primary.main, 0.12),
              borderRadius: 2,
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <BusinessIcon
              sx={{
                mr: isSmallScreen ? 1 : 1.5,
                fontSize: isSmallScreen ? 16 : 20,
              }}
            />
            Consultas
          </Typography>

          <Accordion
            expanded={expanded === "Consultas"}
            onChange={handleChange("Consultas")}
            sx={{
              boxShadow: "none",
              "&:before": { display: "none" },
              border: `1px solid ${alpha(colors.primary.main, 0.15)}`,
              borderRadius: 2,
              mb: 1,
              "&.Mui-expanded": {
                bgcolor: alpha(colors.primary.main, 0.05),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: colors.primary.dark }} />
              }
              sx={{
                "&:hover": {
                  bgcolor: alpha(colors.primary.main, 0.08),
                },
                borderRadius: 2,
              }}
            >
              <PeopleIcon
                sx={{
                  mr: isSmallScreen ? 1 : 1.5,
                  color: colors.primary.dark,
                  fontSize: isSmallScreen ? 18 : 22,
                }}
              />
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: isSmallScreen ? "0.75rem" : "0.9rem",
                }}
              >
                Consultar Información
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              <List disablePadding>
                {/* Consultar Empleados */}
                <ListItemButton
                  onClick={() => {
                    router.push("/dashboard/consultas/consultar_empleados");
                    handleMenuItemClick();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  <PeopleIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      fontSize: isSmallScreen ? 16 : 20,
                      color: colors.primary.dark,
                    }}
                  />
                  <ListItemText
                    primary="Consultar Empleados"
                    primaryTypographyProps={{
                      fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>

                {/* Consultar Cursos */}
                <ListItemButton
                  onClick={() => {
                    router.push("/dashboard/consultas/consultar_cursos");
                    handleMenuItemClick();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  <SchoolIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      fontSize: isSmallScreen ? 16 : 20,
                      color: colors.primary.dark,
                    }}
                  />
                  <ListItemText
                    primary="Consultar Cursos"
                    primaryTypographyProps={{
                      fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>

                {/* Consultar Solicitudes */}
                <ListItemButton
                  onClick={() => {
                    router.push("/dashboard/consultas/consultar_solicitudes");
                    handleMenuItemClick();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  <RequestQuoteIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      fontSize: isSmallScreen ? 16 : 20,
                      color: colors.primary.dark,
                    }}
                  />
                  <ListItemText
                    primary="Consultar Solicitudes"
                    primaryTypographyProps={{
                      fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>

                {/* Consultar Procesos */}
                <ListItemButton
                  onClick={() => {
                    router.push("/dashboard/consultas/consultar_procesos");
                    handleMenuItemClick();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  <RequestQuoteIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      fontSize: isSmallScreen ? 16 : 20,
                      color: colors.primary.dark,
                    }}
                  />
                  <ListItemText
                    primary="Consultar Procesos"
                    primaryTypographyProps={{
                      fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>

                {/* Consultar Matriz de Habilidades */}
                <ListItemButton
                  onClick={() => {
                    router.push(
                      "/dashboard/consultas/consultar_matriz_habilidades",
                    );
                    handleMenuItemClick();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    "&:hover": {
                      bgcolor: alpha(colors.primary.main, 0.08),
                    },
                  }}
                >
                  <AssessmentIcon
                    sx={{
                      mr: isSmallScreen ? 1 : 1.5,
                      fontSize: isSmallScreen ? 16 : 20,
                      color: colors.primary.dark,
                    }}
                  />
                  <ListItemText
                    primary="Consultar Matriz de Habilidades"
                    primaryTypographyProps={{
                      fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Drawer>

      {/* 🔹 CONTENIDO PRINCIPAL */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isSmallScreen
            ? "390px"
            : {
                xs: "100%",
                md: open ? `calc(100% - ${currentDrawerWidth}px)` : "100%",
              },
          p: isSmallScreen
            ? 1
            : {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
          transition: "width 0.3s ease-in-out, margin 0.3s ease-in-out",
          marginLeft: isSmallScreen
            ? 0
            : {
                xs: 0,
                md: open ? `${currentDrawerWidth}px` : "0",
              },
          height: isSmallScreen ? "calc(888px - 56px)" : "100vh",
          minHeight: isSmallScreen ? "calc(888px - 56px)" : "100vh",
          maxHeight: isSmallScreen ? "calc(888px - 56px)" : "none",
          bgcolor: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <Toolbar
          sx={{ minHeight: isSmallScreen ? "56px !important" : "64px" }}
        />
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: isSmallScreen
              ? "100%"
              : {
                  xs: "100%",
                  sm: "100%",
                  md: "100%",
                  lg: "1600px",
                  xl: "1800px",
                },
            mx: "auto",
            px: isSmallScreen
              ? 0
              : {
                  xs: 0,
                  md: 1,
                },
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default App;
