import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Snackbar, Alert, Container, Stack, Avatar, Breadcrumbs, Link, MenuItem,
  Fade, Grow, LinearProgress, Tooltip, Badge, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions, CardHeader, FormControl, InputLabel, Select,
  useTheme, alpha, Paper
} from "@mui/material";
import {
  ArrowBack, Add, ElectricalServices, LocationOn, Business, PowerInput,
  Assessment, Person, CalendarToday, Notes, CheckCircle, Schedule,
  Close as CloseIcon, Engineering, TrendingUp, Warning, Search,
  Analytics, CloudUpload, Image as ImageIcon, WbSunny, Cloud, Umbrella,
  Info, ArrowBackIosNew, ArrowForwardIos
} from "@mui/icons-material";

export default function TransformerInspectionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // NOTE: if axiosClient.baseURL === "/api", keep this "/transformers"
  // so `${apiBase}/${id}/baseline` resolves to /api/transformers/:id/baseline
  const apiBase = "/transformers";

  const [transformer, setTransformer] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [images, setImages] = useState([]); // still used for baseline-callout (no images yet)
  const [loading, setLoading] = useState(false);

  // notifications
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // create-inspection dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: "", inspector: "", notes: "", status: "OPEN" });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  // per-inspection upload dialog (MAINTENANCE)
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [weather, setWeather] = useState("SUNNY"); // SUNNY|CLOUDY|RAINY

  // BASELINE upload dialog (transformer-level, only when no images exist)
  const [openBaseline, setOpenBaseline] = useState(false);
  const [baseline, setBaseline] = useState({
    uploader: "",
    weather: "SUNNY",
    temperatureC: "",
    humidity: "",
    locationNote: "",
    file: null,
    preview: null,
  });
  const [uploadingBaseline, setUploadingBaseline] = useState(false);

  // COMPARE dialog (now uses /baseline/base64 and /maintenance/base64)
  const [openCompare, setOpenCompare] = useState(false);
  const [compareInspection, setCompareInspection] = useState(null);
  const [baselineForCompare, setBaselineForCompare] = useState(null); // latest baseline (base64 object)
  const [compareImages, setCompareImages] = useState([]);             // maintenance images (base64 objects) for that inspection
  const [compareIndex, setCompareIndex] = useState(0);

  const handleBaselineFile = (f) => {
    setBaseline((b) => ({ ...b, file: f || null }));
    if (f) {
      const r = new FileReader();
      r.onload = (e) => setBaseline((b) => ({ ...b, preview: e.target.result }));
      r.readAsDataURL(f);
    } else {
      setBaseline((b) => ({ ...b, preview: null }));
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const [t, ins, imgs] = await Promise.all([
        axiosClient.get(`${apiBase}/${id}`),
        axiosClient.get(`${apiBase}/${id}/inspections`),
        axiosClient.get(`${apiBase}/${id}/images`).catch(() => ({ data: [] })), // tolerate if not implemented yet
      ]);
      setTransformer(t.data);
      setInspections(ins.data || []);
      setImages(imgs.data || []);
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // validation for create dialog
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
      const err = validateField(name, value);
      setFormErrors((fe) => ({ ...fe, [name]: err }));
    }
  };
  const handleFieldBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, form[name]);
    setFormErrors((fe) => ({ ...fe, [name]: err }));
  };
  const isFormValid = () => {
    const errs = {};
    ["title", "inspector"].forEach((f) => {
      const e = validateField(f, form[f]);
      if (e) errs[f] = e;
    });
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const resetForm = () => { setForm({ title: "", inspector: "", notes: "", status: "OPEN" }); setFormErrors({}); setTouched({}); };

  const addInspection = async () => {
    if (!isFormValid()) { setTouched({ title: true, inspector: true }); return false; }
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
    } finally { setFormLoading(false); }
  };

  // filters & stats
  const filteredInspections = inspections.filter((it) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      it.title?.toLowerCase().includes(q) ||
      it.inspector?.toLowerCase().includes(q) ||
      it.notes?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || it.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const stats = {
    total: inspections.length,
    open: inspections.filter((i) => i.status === "OPEN").length,
    inProgress: inspections.filter((i) => i.status === "IN_PROGRESS").length,
    closed: inspections.filter((i) => i.status === "CLOSED").length,
  };

  const getStatusColor = (s) =>
    s === "OPEN" ? { color: "info" }
      : s === "IN_PROGRESS" ? { color: "warning" }
      : s === "CLOSED" ? { color: "success" }
      : { color: "default" };
  const getStatusIcon = (s) =>
    s === "OPEN" ? <Schedule fontSize="small" /> :
    s === "IN_PROGRESS" ? <Engineering fontSize="small" /> :
    s === "CLOSED" ? <CheckCircle fontSize="small" /> :
    <Warning fontSize="small" />;
  const getTransformerTypeIcon = (type) => {
    const map = { BULK: <Business />, DISTRIBUTION: <Engineering /> };
    return map[type] || <PowerInput />;
  };

  // per-inspection upload helpers (MAINTENANCE)
  const openUploadFor = (inspection) => {
    setSelectedInspection(inspection);
    setUploadFile(null);
    setPreview(null);
    setWeather("SUNNY");
    setOpenUpload(true);
  };
  const handleFileSelect = (file) => {
    setUploadFile(file || null);
    if (file) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target.result);
      r.readAsDataURL(file);
    } else { setPreview(null); }
  };
  const uploadImage = async () => {
    if (!uploadFile || !selectedInspection) { toast("Please select an image", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      const meta = {
        imageType: "MAINTENANCE",
        uploader: selectedInspection.inspector || "Unknown",
        inspectionId: selectedInspection.id,
        envCondition: { weather },
      };
      fd.append("meta", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      fd.append("file", uploadFile);

      const uploadUrl = `${apiBase}/${id}/images`;
      await axiosClient.post(uploadUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });

      toast("Image uploaded");
      setOpenUpload(false);
      setUploadFile(null); setPreview(null);
      await load();
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to upload image", "error");
    } finally { setUploading(false); }
  };

  // BASELINE upload
  const uploadBaseline = async () => {
    if (!baseline.uploader.trim()) { toast("Uploader name is required", "error"); return; }
    if (!baseline.file) { toast("Please choose an image", "error"); return; }

    setUploadingBaseline(true);
    try {
      const meta = {
        imageType: "BASELINE",
        uploader: baseline.uploader.trim(),
        envCondition: {
          weather: baseline.weather,
          temperatureC: baseline.temperatureC === "" ? undefined : Number(baseline.temperatureC),
          humidity: baseline.humidity === "" ? undefined : Number(baseline.humidity),
          locationNote: baseline.locationNote?.trim() || undefined,
        },
      };
      const fd = new FormData();
      fd.append("meta", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      fd.append("file", baseline.file);

      const uploadUrl = `${apiBase}/${id}/images`;
      await axiosClient.post(uploadUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });

      toast("Baseline image uploaded");
      setOpenBaseline(false);
      setBaseline({ uploader: "", weather: "SUNNY", temperatureC: "", humidity: "", locationNote: "", file: null, preview: null });
      await load();
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to upload baseline image", "error");
    } finally { setUploadingBaseline(false); }
  };

  const noImagesYet = (images?.length || 0) === 0;

  // ---- Compare (now using /baseline/base64 and /maintenance/base64) ----
  const openCompareFor = async (inspection) => {
    setCompareInspection(inspection);
    setOpenCompare(true);

    setBaselineForCompare(null);
    setCompareImages([]);
    setCompareIndex(0);

    try {
      const [baselineRes, maintRes] = await Promise.all([
        axiosClient.get(`${apiBase}/${id}/baseline/base64`),
        axiosClient.get(`${apiBase}/${id}/maintenance/base64`),
      ]);

      // Handle response shapes defensively (prefer arrays)
      const baselines = Array.isArray(baselineRes.data)
        ? baselineRes.data
        : Array.isArray(baselineRes.data?.images)
          ? baselineRes.data.images
          : [];
      const latestBaseline = baselines
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
      setBaselineForCompare(latestBaseline || null);

      const allMaint = Array.isArray(maintRes.data)
        ? maintRes.data
        : Array.isArray(maintRes.data?.images)
          ? maintRes.data.images
          : [];

      // Filter by inspectionId if available; otherwise show all for this transformer
      const thisInspectionImgs = allMaint.filter((im) =>
        im.inspectionId ? im.inspectionId === inspection.id : true
      );

      setCompareImages(thisInspectionImgs);
    } catch (err) {
      setBaselineForCompare(null);
      setCompareImages([]);
      toast("Failed to load comparison images", "error");
    }
  };

  const nextCompare = () => {
    if (!compareImages.length) return;
    setCompareIndex((i) => (i + 1) % compareImages.length);
  };
  const prevCompare = () => {
    if (!compareImages.length) return;
    setCompareIndex((i) => (i - 1 + compareImages.length) % compareImages.length);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Breadcrumbs & Header */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs sx={{ mb: 4 }}>
              <Link component="button" variant="body1" onClick={() => navigate("/")}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ElectricalServices fontSize="small" />
                Transformers
              </Link>
              <Typography color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Assessment fontSize="small" />
                Inspections
              </Typography>
            </Breadcrumbs>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Tooltip title="Back to Home">
                <IconButton onClick={() => navigate("/")}
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
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

              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                Create New Inspection
              </Button>
            </Stack>
          </Box>

          {/* Baseline callout (only when no images exist) */}
          {noImagesYet && (
            <Paper elevation={0}
              sx={{
                mb: 3, p: 2, borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                bgcolor: alpha(theme.palette.info.light, 0.12)
              }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "start", sm: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Info color="info" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    No images found for this transformer
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  Upload a <strong>Baseline</strong> thermal image first to enable comparisons in future inspections.
                </Typography>
                <Button variant="outlined" onClick={() => setOpenBaseline(true)} startIcon={<CloudUpload />}>
                  Upload Baseline Image
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Transformer Info Card */}
          <Grow in timeout={800}>
            <Card sx={{
              mb: 4, borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white"
            }}>
              <CardContent sx={{ p: 4 }}>
                {loading ? (
                  <Stack spacing={2}>
                    <Skeleton variant="text" width="30%" height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                    <Stack direction="row" spacing={1}>
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rounded" width={120} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                      ))}
                    </Stack>
                  </Stack>
                ) : transformer ? (
                  <Stack spacing={3}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 64, height: 64 }}>
                          {getTransformerTypeIcon(transformer.transformerType)}
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
                    </Stack>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip icon={<LocationOn fontSize="small" />} label={`Pole: ${transformer.poleNo || "Not specified"}`}
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
                      <Chip icon={<Business fontSize="small" />} label={`Region: ${transformer.region || "Not specified"}`}
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
                      <Chip icon={<PowerInput fontSize="small" />} label={`Type: ${transformer.transformerType || "Not specified"}`}
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
                    </Stack>
                  </Stack>
                ) : <Typography>Loading transformer details...</Typography>}
              </CardContent>
            </Card>
          </Grow>

          {/* Statistics */}
          <Grow in timeout={1000}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: "Total Inspections", value: stats.total, color: "#1976d2", icon: <Assessment /> },
                { label: "Open", value: stats.open, color: "#2196f3", icon: <Schedule /> },
                { label: "In Progress", value: stats.inProgress, color: "#ff9800", icon: <Engineering /> },
                { label: "Completed", value: stats.closed, color: "#4caf50", icon: <CheckCircle /> },
              ].map((stat) => (
                <Grid item xs={12} sm={6} md={3} key={stat.label}>
                  <Card sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                    border: `1px solid ${stat.color}30`, transition: "transform 0.2s ease", "&:hover": { transform: "translateY(-4px)" } }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: stat.color, color: "white" }}>{stat.icon}</Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                          <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
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
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <CardHeader
                avatar={
                  <Badge badgeContent={inspections.length} color="primary">
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main }}><Analytics /></Avatar>
                  </Badge>
                }
                title={<Typography variant="h6" sx={{ fontWeight: 600 }}>Inspection Records</Typography>}
                subheader={`${filteredInspections.length} of ${inspections.length} inspections`}
                action={
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField size="small" placeholder="Search inspections..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <Search sx={{ color: "action.active" }} /> }}
                      sx={{ minWidth: 200 }} />
                    <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120 }}>
                      <MenuItem value="ALL">All Status</MenuItem>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </TextField>
                  </Stack>
                }
                sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}
              />
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">Loading inspections...</Typography>
                  </Box>
                ) : filteredInspections.length === 0 ? (
                  <Box sx={{ p: 8, textAlign: "center" }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>
                      <Assessment sx={{ fontSize: 32, color: "text.secondary" }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                      {searchTerm || statusFilter !== "ALL" ? "No inspections match your criteria" : "No inspections recorded yet"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || statusFilter !== "ALL" ? "Adjust search or filters" : "Use the button above to create your first inspection"}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", overflowX: "auto" }}>
                    <Table>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}><Assessment fontSize="small" />Title</Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}><Person fontSize="small" />Inspector</Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}><TrendingUp fontSize="small" />Status</Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" alignItems="center" spacing={1}><CalendarToday fontSize="small" />Created</Stack>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                            Compare
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredInspections.map((inspection) => {
                          const sc = getStatusColor(inspection.status);
                          return (
                            <TableRow key={inspection.id}
                              hover
                              sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                            >
                              <TableCell>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{inspection.title}</Typography>
                                {inspection.notes && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {inspection.notes}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                    {inspection.inspector?.charAt(0)?.toUpperCase() || "?"}
                                  </Avatar>
                                  <Typography variant="body2">{inspection.inspector || "Unknown"}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip icon={getStatusIcon(inspection.status)}
                                  label={inspection.status?.replace("_", " ") || "Unknown"}
                                  color={sc.color} size="small" sx={{ fontWeight: 500 }} />
                              </TableCell>
                              <TableCell>
                                <Stack spacing={0.5}>
                                  <Typography variant="body2">
                                    {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString() : "Unknown"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {inspection.createdAt ? new Date(inspection.createdAt).toLocaleTimeString() : ""}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => openCompareFor(inspection)}
                                  >
                                    Compare
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => openUploadFor(inspection)}
                                  >
                                    Upload Image
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
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
              <IconButton onClick={() => setOpenDialog(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <TextField label="Inspection Title" fullWidth value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  onBlur={() => handleFieldBlur("title")}
                  error={!!formErrors.title} helperText={formErrors.title || "Enter a descriptive title"} required
                  InputProps={{ startAdornment: <Assessment sx={{ color: "action.active", mr: 1 }} /> }} />
                <TextField label="Inspector Name" fullWidth value={form.inspector}
                  onChange={(e) => handleFieldChange("inspector", e.target.value)}
                  onBlur={() => handleFieldBlur("inspector")}
                  error={!!formErrors.inspector} helperText={formErrors.inspector || "Who is conducting the inspection?"} required
                  InputProps={{ startAdornment: <Person sx={{ color: "action.active", mr: 1 }} /> }} />
                <TextField select label="Status" fullWidth value={form.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}>
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </TextField>
                <TextField label="Inspection Notes" fullWidth multiline rows={4} value={form.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Add detailed notes about the inspection findings..."
                  InputProps={{ startAdornment: <Notes sx={{ color: "action.active", mr: 1, alignSelf: "flex-start", mt: 1 }} /> }} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button variant="contained" startIcon={<Add />} onClick={async () => {
                const ok = await addInspection(); if (ok) setOpenDialog(false);
              }} disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Inspection"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Upload MAINTENANCE Image Dialog */}
          <Dialog open={openUpload} onClose={() => setOpenUpload(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 7 }}>
              Upload Image {selectedInspection ? `– ${selectedInspection.title}` : ""}
              <IconButton onClick={() => setOpenUpload(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Weather</InputLabel>
                <Select value={weather} label="Weather" onChange={(e) => setWeather(e.target.value)}>
                  <MenuItem value="SUNNY"><Stack direction="row" alignItems="center" spacing={1}><WbSunny fontSize="small" color="warning" /><Typography>Sunny</Typography></Stack></MenuItem>
                  <MenuItem value="CLOUDY"><Stack direction="row" alignItems="center" spacing={1}><Cloud fontSize="small" color="action" /><Typography>Cloudy</Typography></Stack></MenuItem>
                  <MenuItem value="RAINY"><Stack direction="row" alignItems="center" spacing={1}><Umbrella fontSize="small" color="primary" /><Typography>Rainy</Typography></Stack></MenuItem>
                </Select>
              </FormControl>

              <Box sx={{
                border: 2, borderStyle: "dashed", borderColor: dragOver ? "primary.main" : "grey.300",
                bgcolor: dragOver ? "primary.50" : "grey.50", p: 3, textAlign: "center", cursor: "pointer",
                transition: "all 0.2s", borderRadius: 2,
              }}
                onClick={() => document.getElementById("inspection-file-input")?.click()}
                onDrop={(e) => { e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("image/")) handleFileSelect(f); else toast("Please select a valid image", "error"); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {preview ? (
                  <Box>
                    <Box component="img" src={preview} alt="Preview"
                      sx={{ width: "100%", height: "auto", maxHeight: 320, borderRadius: 1, objectFit: "contain" }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      {uploadFile?.name} ({uploadFile ? (uploadFile.size / 1024 / 1024).toFixed(2) : 0} MB)
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); setPreview(null); }}>Remove</Button>
                  </Box>
                ) : (
                  <Box>
                    <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2 }}><ImageIcon /></Avatar>
                    <Typography variant="h6" gutterBottom>Drop image here</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>or click to browse files</Typography>
                    <Typography variant="caption" color="text.secondary">Supported: JPG, PNG, GIF</Typography>
                  </Box>
                )}
              </Box>
              <input id="inspection-file-input" type="file" accept="image/*" hidden onChange={(e) => handleFileSelect(e.target.files?.[0])} />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
              <Button variant="contained" startIcon={<CloudUpload />} onClick={uploadImage} disabled={uploading || !uploadFile}>
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Upload BASELINE Image Dialog (transformer-level) */}
          <Dialog open={openBaseline} onClose={() => setOpenBaseline(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 7 }}>
              Upload Baseline Image
              <IconButton onClick={() => setOpenBaseline(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <TextField
                  label="Uploader Name"
                  value={baseline.uploader}
                  onChange={(e) => setBaseline((b) => ({ ...b, uploader: e.target.value }))}
                  required
                  InputProps={{ startAdornment: <Person sx={{ color: "action.active", mr: 1 }} /> }}
                />

                <FormControl fullWidth>
                  <InputLabel>Weather</InputLabel>
                  <Select
                    value={baseline.weather}
                    label="Weather"
                    onChange={(e) => setBaseline((b) => ({ ...b, weather: e.target.value }))}
                  >
                    <MenuItem value="SUNNY"><Stack direction="row" alignItems="center" spacing={1}><WbSunny fontSize="small" color="warning" /><Typography>Sunny</Typography></Stack></MenuItem>
                    <MenuItem value="CLOUDY"><Stack direction="row" alignItems="center" spacing={1}><Cloud fontSize="small" color="action" /><Typography>Cloudy</Typography></Stack></MenuItem>
                    <MenuItem value="RAINY"><Stack direction="row" alignItems="center" spacing={1}><Umbrella fontSize="small" color="primary" /><Typography>Rainy</Typography></Stack></MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Ambient Temperature (°C) – optional"
                      type="number"
                      inputProps={{ step: "any", inputMode: "numeric" }}
                      value={baseline.temperatureC}
                      onChange={(e) => setBaseline((b) => ({ ...b, temperatureC: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Humidity (%) – optional"
                      type="number"
                      inputProps={{ step: "any", inputMode: "numeric" }}
                      value={baseline.humidity}
                      onChange={(e) => setBaseline((b) => ({ ...b, humidity: e.target.value }))}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Location Note (optional)"
                  value={baseline.locationNote}
                  onChange={(e) => setBaseline((b) => ({ ...b, locationNote: e.target.value }))}
                  multiline minRows={2}
                />

                {/* Drop zone */}
                <Box
                  sx={{
                    border: 2, borderStyle: "dashed", borderColor: "grey.300",
                    bgcolor: "grey.50", p: 3, textAlign: "center", cursor: "pointer",
                    transition: "all 0.2s", borderRadius: 2,
                  }}
                  onClick={() => document.getElementById("baseline-file-input")?.click()}
                >
                  {baseline.preview ? (
                    <Box>
                      <Box component="img" src={baseline.preview} alt="Preview"
                        sx={{ width: "100%", height: "auto", maxHeight: 320, borderRadius: 1, objectFit: "contain" }} />
                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                        {baseline.file?.name} ({baseline.file ? (baseline.file.size / 1024 / 1024).toFixed(2) : 0} MB)
                      </Typography>
                      <Button variant="outlined" size="small" sx={{ mt: 1 }}
                        onClick={(e) => { e.stopPropagation(); handleBaselineFile(null); }}>
                        Remove
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2 }}><ImageIcon /></Avatar>
                      <Typography variant="h6" gutterBottom>Drop image here</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>or click to browse files</Typography>
                      <Typography variant="caption" color="text.secondary">Supported: JPG, PNG, GIF</Typography>
                    </Box>
                  )}
                </Box>
                <input id="baseline-file-input" type="file" accept="image/*" hidden
                  onChange={(e) => handleBaselineFile(e.target.files?.[0])} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setOpenBaseline(false)}>Cancel</Button>
              <Button variant="contained" startIcon={<CloudUpload />}
                onClick={uploadBaseline} disabled={uploadingBaseline}>
                {uploadingBaseline ? "Uploading..." : "Upload Baseline"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Compare Dialog: Baseline (left) vs Inspection images (right) */}
          <Dialog open={openCompare} onClose={() => setOpenCompare(false)} fullWidth maxWidth="lg">
            <DialogTitle sx={{ pr: 7 }}>
              Compare Images {compareInspection ? `– ${compareInspection.title}` : ""}
              <IconButton onClick={() => setOpenCompare(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* Baseline */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: "100%" }}>
                    <CardHeader title="Baseline" />
                    <CardContent sx={{
                      p: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      minHeight: 360, bgcolor: "grey.50"
                    }}>
                      {baselineForCompare?.data ? (
                        <Box component="img" src={baselineForCompare.data} alt="Baseline"
                          sx={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 1 }} />
                      ) : (
                        <Typography color="text.secondary">No baseline image available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Inspection images */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: "100%", position: "relative" }}>
                    <CardHeader
                      title="Inspection"
                      subheader={
                        compareImages.length
                          ? `${compareIndex + 1} / ${compareImages.length}`
                          : "No inspection images"
                      }
                    />
                    <CardContent sx={{
                      p: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      minHeight: 360, bgcolor: "grey.50", position: "relative"
                    }}>
                      {compareImages.length && compareImages[compareIndex]?.data ? (
                        <>
                          <IconButton
                            onClick={prevCompare}
                            sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "white" }}
                          >
                            <ArrowBackIosNew />
                          </IconButton>
                          <Box
                            component="img"
                            src={compareImages[compareIndex].data}
                            alt={`Inspection-${compareInspection?.id}-${compareIndex}`}
                            sx={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 1 }}
                          />
                          <IconButton
                            onClick={nextCompare}
                            sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "white" }}
                          >
                            <ArrowForwardIos />
                          </IconButton>
                        </>
                      ) : (
                        <Typography color="text.secondary">No images for this inspection</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCompare(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar open={snack.open} autoHideDuration={5000}
            onClose={() => setSnack({ ...snack, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <Alert onClose={() => setSnack({ ...snack, open: false })}
              severity={snack.sev} variant="filled" sx={{ borderRadius: 2 }}>
              {snack.msg}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
}
