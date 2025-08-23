import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Button, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  IconButton, 
  Chip,
  Snackbar, 
  Alert,
  Container,
  Paper,
  Stack,
  Avatar,
  Breadcrumbs,
  Link,
  MenuItem,
  Fade,
  Grow,
  LinearProgress,
  Tooltip,
  Badge,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardHeader,
  useTheme,
  alpha
} from "@mui/material";
import {
  ArrowBack,
  Add,
  ElectricalServices,
  LocationOn,
  Business,
  PowerInput,
  Assessment,
  Person,
  CalendarToday,
  Notes,
  CheckCircle,
  Schedule,
  Close as CloseIcon,
  Engineering,
  TrendingUp,
  Warning,
  Visibility,
  Search,
  Analytics
} from "@mui/icons-material";

export default function TransformerInspectionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const apiBase = "/transformers";

  const [transformer, setTransformer] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);

  // notifications
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // form + dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    inspector: "",
    notes: "",
    status: "OPEN",
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const toast = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  const load = async () => {
    try {
      setLoading(true);
      const [t, ins] = await Promise.all([
        axiosClient.get(`${apiBase}/${id}`),
        axiosClient.get(`${apiBase}/${id}/inspections`),
      ]);
      setTransformer(t.data);
      setInspections(ins.data || []);
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to load inspections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // validation
  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Title is required";
        if (value.trim().length < 3) return "Title must be at least 3 characters";
        return "";
      case "inspector":
        if (!value.trim()) return "Inspector name is required";
        return "";
      default:
        return "";
    }
  };

  const handleFieldChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors((fe) => ({ ...fe, [name]: error }));
    }
  };

  const handleFieldBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const error = validateField(name, form[name]);
    setFormErrors((fe) => ({ ...fe, [name]: error }));
  };

  const isFormValid = () => {
    const newErrors = {};
    ["title", "inspector"].forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setForm({ title: "", inspector: "", notes: "", status: "OPEN" });
    setFormErrors({});
    setTouched({});
  };

  const addInspection = async () => {
    if (!isFormValid()) {
      setTouched({ title: true, inspector: true });
      return false;
    }

    try {
      setFormLoading(true);
      await axiosClient.post(`${apiBase}/${id}/inspections`, {
        title: form.title.trim(),
        inspector: form.inspector.trim(),
        notes: form.notes?.trim() || undefined,
        status: form.status,
      });

      toast("Inspection added successfully");
      resetForm();
      await load();
      return true;
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to add inspection", "error");
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  // filtering
  const filteredInspections = inspections.filter((inspection) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      inspection.title?.toLowerCase().includes(q) ||
      inspection.inspector?.toLowerCase().includes(q) ||
      inspection.notes?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || inspection.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // stats
  const stats = {
    total: inspections.length,
    open: inspections.filter((i) => i.status === "OPEN").length,
    inProgress: inspections.filter((i) => i.status === "IN_PROGRESS").length,
    closed: inspections.filter((i) => i.status === "CLOSED").length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return { color: "info", bgColor: alpha(theme.palette.info.main, 0.1) };
      case "IN_PROGRESS":
        return { color: "warning", bgColor: alpha(theme.palette.warning.main, 0.1) };
      case "CLOSED":
        return { color: "success", bgColor: alpha(theme.palette.success.main, 0.1) };
      default:
        return { color: "default", bgColor: alpha(theme.palette.grey[500], 0.1) };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <Schedule fontSize="small" />;
      case "IN_PROGRESS":
        return <Engineering fontSize="small" />;
      case "CLOSED":
        return <CheckCircle fontSize="small" />;
      default:
        return <Warning fontSize="small" />;
    }
  };

  const getTransformerTypeInfo = (type) => {
    const typeInfo = {
      BULK: { color: "#4caf50", icon: <Business /> },
      DISTRIBUTION: { color: "#ff9800", icon: <Engineering /> },
    };
    return typeInfo[type] || { color: "#757575", icon: <PowerInput /> };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Breadcrumbs & Header */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs sx={{ mb: 4 }}>
              <Link
                component="button"
                variant="body1"
                onClick={() => navigate("/transformers")}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <ElectricalServices fontSize="small" />
                Transformers
              </Link>
              <Typography color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Assessment fontSize="small" />
                Inspections
              </Typography>
            </Breadcrumbs>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Tooltip title="Back to Transformers">
                <IconButton
                  onClick={() => navigate("/transformers")}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  Transformer Inspections
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Monitor and manage thermal inspection records
                </Typography>
              </Box>

              {/* Create button opens dialog */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Create New Inspection
              </Button>
            </Stack>
          </Box>

          {/* Transformer Info Card */}
          <Grow in timeout={800}>
            <Card
              sx={{
                mb: 4,
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
                {loading ? (
                  <Stack spacing={2}>
                    <Skeleton variant="text" width="30%" height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton
                          key={i}
                          variant="rounded"
                          width={120}
                          height={32}
                          sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                ) : transformer ? (
                  <Stack spacing={3}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(10px)",
                            width: 64,
                            height: 64,
                          }}
                        >
                          {getTransformerTypeInfo(transformer.transformerType).icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            Transformer {transformer.transformerNo}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            ID: {transformer.id} • Type: {transformer.transformerType}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={2}>
                        <Tooltip title="View Transformer Details">
                          <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/transformers`)}
                            sx={{
                              borderColor: "rgba(255,255,255,0.3)",
                              color: "white",
                              "&:hover": {
                                borderColor: "rgba(255,255,255,0.5)",
                                bgcolor: "rgba(255,255,255,0.1)",
                              },
                            }}
                          >
                            View Details
                          </Button>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip
                        icon={<LocationOn fontSize="small" />}
                        label={`Pole: ${transformer.poleNo || "Not specified"}`}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                      <Chip
                        icon={<Business fontSize="small" />}
                        label={`Region: ${transformer.region || "Not specified"}`}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                      <Chip
                        icon={<PowerInput fontSize="small" />}
                        label={`Type: ${transformer.transformerType || "Not specified"}`}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                    </Stack>
                  </Stack>
                ) : (
                  <Typography>Loading transformer details...</Typography>
                )}
              </CardContent>
            </Card>
          </Grow>

          {/* Statistics Cards */}
          <Grow in timeout={1000}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: "Total Inspections", value: stats.total, color: "#1976d2", icon: <Assessment /> },
                { label: "Open", value: stats.open, color: "#2196f3", icon: <Schedule /> },
                { label: "In Progress", value: stats.inProgress, color: "#ff9800", icon: <Engineering /> },
                { label: "Completed", value: stats.closed, color: "#4caf50", icon: <CheckCircle /> },
              ].map((stat) => (
                <Grid item xs={12} sm={6} md={3} key={stat.label}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                      border: `1px solid ${stat.color}30`,
                      transition: "transform 0.2s ease",
                      "&:hover": { transform: "translateY(-4px)" },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: stat.color, color: "white" }}>{stat.icon}</Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stat.label}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grow>

          {/* Inspections List */}
          <Grow in timeout={1400}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                width: "100%",
              }}
            >
              <CardHeader
                avatar={
                  <Badge badgeContent={inspections.length} color="primary">
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                      <Analytics />
                    </Avatar>
                  </Badge>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Inspection Records
                  </Typography>
                }
                subheader={`${filteredInspections.length} of ${inspections.length} inspections`}
                action={
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Search inspections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ color: "action.active" }} />,
                      }}
                      sx={{ minWidth: 200 }}
                    />
                    <TextField
                      select
                      size="small"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="ALL">All Status</MenuItem>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </TextField>
                  </Stack>
                }
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                  borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                }}
              />

              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Loading inspections...
                    </Typography>
                  </Box>
                ) : filteredInspections.length === 0 ? (
                  <Box
                    sx={{
                      p: 8,
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: alpha(theme.palette.text.secondary, 0.1),
                      }}
                    >
                      <Assessment sx={{ fontSize: 32, color: "text.secondary" }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm || statusFilter !== "ALL"
                        ? "No inspections match your criteria"
                        : "No inspections recorded yet"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || statusFilter !== "ALL"
                        ? "Try adjusting your search or filter settings"
                        : "Use the button above to create your first inspection"}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", overflowX: "auto" }}>
                    <Table>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Assessment fontSize="small" />
                              Title
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Person fontSize="small" />
                              Inspector
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <TrendingUp fontSize="small" />
                              Status
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <CalendarToday fontSize="small" />
                              Created
                            </Stack>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredInspections.map((inspection, index) => {
                          const statusConfig = getStatusColor(inspection.status);
                          return (
                            <Fade key={inspection.id} in timeout={200 + index * 100}>
                              <TableRow
                                sx={{
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    transform: "scale(1.01)",
                                  },
                                  transition: "all 0.2s ease",
                                  cursor: "default",
                                }}
                              >
                                <TableCell>
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                                      {inspection.title}
                                    </Typography>
                                    {inspection.notes && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          display: "-webkit-box",
                                          WebkitLineClamp: 1,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {inspection.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                      {inspection.inspector?.charAt(0)?.toUpperCase() || "?"}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {inspection.inspector || "Unknown"}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(inspection.status)}
                                    label={inspection.status?.replace("_", " ") || "Unknown"}
                                    color={statusConfig.color}
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2">
                                      {inspection.createdAt
                                        ? new Date(inspection.createdAt).toLocaleDateString()
                                        : "Unknown"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {inspection.createdAt
                                        ? new Date(inspection.createdAt).toLocaleTimeString()
                                        : ""}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            </Fade>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grow>

          {/* Create Inspection Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 7 }}>
              Create New Inspection
              <IconButton
                onClick={() => setOpenDialog(false)}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={3}>
                <TextField
                  label="Inspection Title"
                  fullWidth
                  value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  onBlur={() => handleFieldBlur("title")}
                  error={!!formErrors.title}
                  helperText={formErrors.title || "Enter a descriptive title"}
                  required
                  InputProps={{
                    startAdornment: <Assessment sx={{ color: "action.active", mr: 1 }} />,
                  }}
                />

                <TextField
                  label="Inspector Name"
                  fullWidth
                  value={form.inspector}
                  onChange={(e) => handleFieldChange("inspector", e.target.value)}
                  onBlur={() => handleFieldBlur("inspector")}
                  error={!!formErrors.inspector}
                  helperText={formErrors.inspector || "Who is conducting the inspection?"}
                  required
                  InputProps={{
                    startAdornment: <Person sx={{ color: "action.active", mr: 1 }} />,
                  }}
                />

                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={form.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                >
                  <MenuItem value="OPEN">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Schedule fontSize="small" color="info" />
                      <Typography>Open</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="IN_PROGRESS">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Engineering fontSize="small" color="warning" />
                      <Typography>In Progress</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="CLOSED">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography>Closed</Typography>
                    </Stack>
                  </MenuItem>
                </TextField>

                <TextField
                  label="Inspection Notes"
                  fullWidth
                  multiline
                  rows={4}
                  value={form.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Add detailed notes about the inspection findings..."
                  InputProps={{
                    startAdornment: (
                      <Notes sx={{ color: "action.active", mr: 1, alignSelf: "flex-start", mt: 1 }} />
                    ),
                  }}
                />
              </Stack>
            </DialogContent>


            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={async () => {
                  const ok = await addInspection();
                  if (ok) setOpenDialog(false);
                }}
                disabled={formLoading}
              >
                {formLoading ? "Adding..." : "Add Inspection"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snack.open}
            autoHideDuration={5000}
            onClose={() => setSnack({ ...snack, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              onClose={() => setSnack({ ...snack, open: false })}
              severity={snack.sev}
              variant="filled"
              sx={{ borderRadius: 2 }}
            >
              {snack.msg}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
}
