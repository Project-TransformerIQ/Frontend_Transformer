import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  Cloud,
  CloudUpload,
  Image as ImageIcon,
  LocationOn,
  Person,
  ThermostatAuto,
  Umbrella,
  WbSunny,
} from "@mui/icons-material";

export default function ImageUploadPage() {
  const [transformers, setTransformers] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // number
  const [imageType, setImageType] = useState("BASELINE");
  const [env, setEnv] = useState({
    weather: "SUNNY",
    temperatureC: "",
    humidity: "",
    locationNote: "",
  });
  const [file, setFile] = useState(null);
  const [uploader, setUploader] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [dragOver, setDragOver] = useState(false);

  // change to "/transformers" if axiosClient.baseURL = "/api"
  const apiBase = "/transformers";

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get(apiBase);
        setTransformers(res.data);
      } catch {
        showSnackbar("Failed to load transformers", "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      handleFileSelect(droppedFile);
    } else {
      showSnackbar("Please select a valid image file", "error");
    }
  };

  const toNumberOrUndefined = (v) =>
    v === "" || v === null ? undefined : Number(v);

  const upload = async () => {
    if (!selectedId || !file || !uploader.trim()) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }
    if (imageType === "BASELINE" && !env.weather) {
      showSnackbar("Baseline requires an environment weather", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const meta = {
        imageType,
        uploader: uploader.trim(),
        ...(imageType === "BASELINE"
          ? {
              envCondition: {
                weather: env.weather, // SUNNY | CLOUDY | RAINY
                temperatureC: toNumberOrUndefined(env.temperatureC),
                humidity: toNumberOrUndefined(env.humidity),
                locationNote: env.locationNote?.trim() || undefined,
              },
            }
          : {}),
      };

      formData.append(
        "meta",
        new Blob([JSON.stringify(meta)], { type: "application/json" })
      );
      formData.append("file", file);

      await axiosClient.post(`${apiBase}/${selectedId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showSnackbar("Image uploaded successfully!");

      // Reset form
      setFile(null);
      setPreview(null);
      setUploader("");
      setSelectedId(null);
      setImageType("BASELINE");
      setEnv({
        weather: "SUNNY",
        temperatureC: "",
        humidity: "",
        locationNote: "",
      });
    } catch (error) {
      showSnackbar(
        error?.response?.data?.error || "Failed to upload image",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const getEnvIcon = (condition) => {
    switch (condition) {
      case "SUNNY":
        return <WbSunny />;
      case "CLOUDY":
        return <Cloud />;
      case "RAINY":
        return <Umbrella />;
      default:
        return <WbSunny />;
    }
  };

  const selectedTransformer = transformers.find((t) => t.id === selectedId);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            color: "#1976d2",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: { xs: "1.6rem", sm: "2rem" },
          }}
        >
          <ThermostatAuto sx={{ flex: "0 0 auto" }} />
          Upload Thermal Images
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload baseline and maintenance thermal images for transformer
          inspection
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "#1976d2", mb: 3 }}
              >
                Image Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Transformer Selection */}
                <FormControl fullWidth required>
                  <InputLabel>Select Transformer</InputLabel>
                  <Select
                    value={selectedId ?? ""}
                    label="Select Transformer"
                    onChange={(e) => setSelectedId(Number(e.target.value))}
                  >
                    {transformers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <LocationOn fontSize="small" color="action" />
                          <strong>{t.transformerNo}</strong>
                          <Box
                            component="span"
                            sx={{ color: "text.secondary", mx: 0.5 }}
                          >
                            —
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              color: "text.secondary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={`${t.poleNo || "-"} (${t.region ?? "-"})`}
                          >
                            {t.poleNo || "-"} ({t.region ?? "-"})
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Selected Transformer Info */}
                {selectedTransformer && (
                  <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Transformer:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={selectedTransformer.transformerNo}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={selectedTransformer.poleNo || "-"}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`${selectedTransformer.region ?? "-"}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Paper>
                )}

                {/* Image Type */}
                <FormControl fullWidth required>
                  <InputLabel>Image Type</InputLabel>
                  <Select
                    value={imageType}
                    label="Image Type"
                    onChange={(e) => setImageType(e.target.value)}
                  >
                    <MenuItem value="BASELINE">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircle fontSize="small" color="success" />
                        Baseline Image
                      </Box>
                    </MenuItem>
                    <MenuItem value="MAINTENANCE">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ThermostatAuto fontSize="small" color="warning" />
                        Maintenance Image
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Environmental Condition (only for baseline) */}
                {imageType === "BASELINE" && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    }}
                  >
                    <FormControl fullWidth required>
                      <InputLabel>Weather</InputLabel>
                      <Select
                        value={env.weather}
                        label="Weather"
                        onChange={(e) =>
                          setEnv({ ...env, weather: e.target.value })
                        }
                      >
                        <MenuItem value="SUNNY">
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <WbSunny fontSize="small" color="warning" />
                            Sunny
                          </Box>
                        </MenuItem>
                        <MenuItem value="CLOUDY">
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Cloud fontSize="small" color="action" />
                            Cloudy
                          </Box>
                        </MenuItem>
                        <MenuItem value="RAINY">
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Umbrella fontSize="small" color="primary" />
                            Rainy
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Temperature & Humidity – optional inputs (stay side-by-side on ≥sm) */}
                    <TextField
                      label="Temperature (°C)"
                      type="number"
                      value={env.temperatureC}
                      onChange={(e) =>
                        setEnv({ ...env, temperatureC: e.target.value })
                      }
                      inputProps={{ inputMode: "numeric", step: "any" }}
                      fullWidth
                    />
                    <TextField
                      label="Humidity (%)"
                      type="number"
                      value={env.humidity}
                      onChange={(e) =>
                        setEnv({ ...env, humidity: e.target.value })
                      }
                      inputProps={{ inputMode: "numeric", step: "any" }}
                      fullWidth
                    />
                    <TextField
                      label="Location Note (optional)"
                      value={env.locationNote}
                      onChange={(e) =>
                        setEnv({ ...env, locationNote: e.target.value })
                      }
                      fullWidth
                      multiline
                      minRows={2}
                      sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}
                    />
                  </Box>
                )}

                {/* Uploader Name */}
                <TextField
                  fullWidth
                  label="Uploader Name"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: "action.active" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* File Upload Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "#1976d2", mb: 3 }}
              >
                Thermal Image File
              </Typography>

              {/* File Drop Zone */}
              <Paper
                role="button"
                aria-label="Upload image"
                sx={{
                  border: 2,
                  borderStyle: "dashed",
                  borderColor: dragOver ? "primary.main" : "grey.300",
                  bgcolor: dragOver ? "primary.50" : "grey.50",
                  p: { xs: 2, sm: 3 },
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primary.50",
                  },
                }}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById("file-input").click()}
              >
                {preview ? (
                  <Box>
                    <Box
                      component="img"
                      src={preview}
                      alt="Preview"
                      sx={{
                        width: "100%",
                        height: "auto",
                        maxHeight: { xs: 240, sm: 300 },
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2 }}>
                      <ImageIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
                    >
                      Drop your thermal image here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      or click to browse files
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported formats: JPG, PNG, GIF (max 10MB)
                    </Typography>
                  </Box>
                )}
              </Paper>

              <input
                id="file-input"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, textAlign: "center" }}
                  >
                    Uploading image...
                  </Typography>
                </Box>
              )}

              {/* Upload Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={upload}
                disabled={uploading || !selectedId || !file || !uploader.trim()}
                startIcon={<CloudUpload />}
                sx={{ mt: 2 }}
              >
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
      {(selectedId || imageType || file) && (
        <Card sx={{ mt: 3, boxShadow: 2, bgcolor: "#f8f9fa" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
              Upload Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Transformer
                </Typography>
                <Typography variant="body2">
                  {selectedTransformer
                    ? selectedTransformer.transformerNo
                    : "Not selected"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Image Type
                </Typography>
                <Typography variant="body2">
                  {imageType === "BASELINE" ? "Baseline" : "Maintenance"}
                </Typography>
              </Grid>
              {imageType === "BASELINE" && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Environment
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getEnvIcon(env.weather)}
                      <Typography variant="body2">
                        {env.weather.charAt(0) +
                          env.weather.slice(1).toLowerCase()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Temp / Humidity
                    </Typography>
                    <Typography variant="body2">
                      {(env.temperatureC || "-") + " °C"} &nbsp;|&nbsp;
                      {(env.humidity || "-") + " %"}
                    </Typography>
                  </Grid>
                </>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  File
                </Typography>
                <Typography variant="body2">
                  {file ? file.name : "No file selected"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
