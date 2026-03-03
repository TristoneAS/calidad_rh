"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  Alert,
  Button,
} from "@mui/material";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import axios from "axios";
import { useRouter } from "next/navigation";

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

const steps = [
  {
    id: 1,
    title: "Solicitar Certificación",
    description: "Calidad solicita entrenamiento para el empleado",
    department: "Calidad",
    icon: RequestQuoteIcon,
    color: colors.primary,
  },
  {
    id: 2,
    title: "Gestionar Entrenamiento",
    description:
      "RH imparte el examen del entrenamiento y marca aprobado/reprobado",
    department: "RH",
    icon: SchoolIcon,
    color: colors.secondary,
  },
  {
    id: 3,
    title: "Gestionar Auditoría de Producto",
    description:
      "Calidad administra la auditoría del producto y marca aprobado/reprobado",
    department: "Calidad",
    icon: AssessmentIcon,
    color: colors.primary,
  },
  {
    id: 4,
    title: "Asignar Certificación",
    description: "RH asigna formalmente la certificación o entrenamiento",
    department: "RH",
    icon: WorkspacePremiumIcon,
    color: colors.secondary,
  },
];

const statusDefinitions = [
  {
    status: "Pendiente",
    meaning:
      "Solicitud creada por Supervisor. Esperando que RH imparta el entrenamiento.",
  },
  {
    status: "Entrenamiento aprobado",
    meaning:
      "RH aprobó el entrenamiento. La solicitud pasa a Calidad para realizar la auditoria del producto.",
  },
  {
    status: "Auditoría aprobada",
    meaning:
      "Calidad aprobó la auditoría del producto. RH puede asignar la certificación o entrenamiento.",
  },
  {
    status: "Entrenamiento reprobado",
    meaning:
      "RH reprobó el entrenamiento. El empleado debe repetir el entrenamiento.",
  },
  {
    status: "Auditoría reprobada",
    meaning:
      "Calidad reprobó la auditoría del producto. El empleado debe repetir la auditoría.",
  },
  {
    status: "Certificación asignada",
    meaning:
      "RH asignó formalmente la certificación. El proceso está completado.",
  },
];

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const [porVencerCount, setPorVencerCount] = useState(0);

  useEffect(() => {
    axios
      .get("/api/certificaciones?tipo=por_vencer")
      .then((res) => {
        if (res.data.success && res.data.data) {
          setPorVencerCount(res.data.data.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
      {porVencerCount > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                router.push("/dashboard/calidad/certificaciones_vigencia")
              }
            >
              Ver detalle
            </Button>
          }
        >
          {porVencerCount} certificación(es) por vencer en los próximos 30 días
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.primary.dark,
            mb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <BusinessIcon sx={{ fontSize: 36 }} />
          Flujo del Sistema de Certificación
        </Typography>
        <Typography variant="body1" sx={{ color: "#6B7280", maxWidth: 600 }}>
          Proceso completo desde la solicitud hasta la asignación de la
          certificación. Cada paso indica el departamento responsable.
        </Typography>
      </Box>

      {isMobile ? (
        /* Vista vertical para móviles */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepCard step={step} compact />
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 0.5,
                  }}
                >
                  <ArrowDownwardIcon
                    sx={{
                      color: alpha(colors.primary.main, 0.5),
                      fontSize: 28,
                    }}
                  />
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      ) : (
        /* Vista horizontal tipo línea del tiempo para desktop */
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0,
            overflowX: "auto",
            pb: 2,
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(colors.primary.main, 0.3),
              borderRadius: 3,
            },
          }}
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepCard step={step} />
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    minWidth: 40,
                    mt: 6,
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 2,
                      bgcolor: alpha(colors.primary.main, 0.25),
                      borderRadius: 1,
                    }}
                  />
                  <ArrowForwardIcon
                    sx={{
                      color: colors.primary.main,
                      fontSize: 24,
                      ml: -0.5,
                    }}
                  />
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}

      <Box
        sx={{
          mt: 4,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(colors.primary.main, 0.06),
          border: `1px solid ${alpha(colors.primary.main, 0.15)}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: colors.primary.dark,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PeopleIcon fontSize="small" />
          Leyenda
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: colors.primary.main,
              }}
            />
            <Typography variant="body2" sx={{ color: "#4B5563" }}>
              Calidad — Solicitudes y exámenes
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: colors.secondary.main,
              }}
            />
            <Typography variant="body2" sx={{ color: "#4B5563" }}>
              RH — Entrenamiento y asignación
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 4,
          p: 2.5,
          borderRadius: 2,
          bgcolor: alpha(colors.primary.main, 0.06),
          border: `1px solid ${alpha(colors.primary.main, 0.15)}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: colors.primary.dark,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InfoIcon fontSize="small" />
          Significado de cada estado
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {statusDefinitions.map((item) => (
            <Box
              key={item.status}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 0.25, sm: 1 },
                alignItems: { sm: "baseline" },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: colors.primary.dark,
                  minWidth: { sm: 180 },
                }}
              >
                {item.status}:
              </Typography>
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {item.meaning}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function StepCard({ step, compact = false }) {
  const Icon = step.icon;
  const isCalidad = step.department === "Calidad";

  return (
    <Card
      sx={{
        flexShrink: 0,
        width: compact ? "100%" : 240,
        minHeight: compact ? "auto" : 180,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        borderRadius: 2,
        border: `2px solid ${alpha(step.color.main, 0.3)}`,
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(step.color.main, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: step.color.main, fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                color: step.color.dark,
                fontWeight: 700,
                fontSize: "0.7rem",
                letterSpacing: 0.5,
              }}
            >
              Paso {step.id}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: "#1F2937",
                lineHeight: 1.3,
              }}
            >
              {step.title}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: "#6B7280",
            mb: 1.5,
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: alpha(step.color.main, 0.12),
          }}
        >
          {isCalidad ? (
            <BusinessIcon sx={{ fontSize: 16, color: step.color.dark }} />
          ) : (
            <PeopleIcon sx={{ fontSize: 16, color: step.color.dark }} />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: step.color.dark,
            }}
          >
            {step.department}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
