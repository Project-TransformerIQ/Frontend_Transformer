import { useEffect, useState } from "react";
import ImagePreviewDialog from "../pages/ImagePreviewDialog";

import axiosClient from "../api/axiosClient";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Grid,
  Alert,
  Snackbar,
  LinearProgress
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  ElectricalServices,
  LocationOn,
  PowerInput,
  Image as ImageIcon
} from "@mui/icons-material";

export default function TransformersPage() {
  const [transformers, setTransformers] = useState([]);
  const [form, setForm] = useState({ name: "", site: "", ratingKva: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, transformer: null });
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);

  // Images viewer state
  const [imagesOpen, setImagesOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [viewT, setViewT] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(false);

  // new:
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // API paths
  const apiBase = "/transformers"; // keep using axiosClient baseURL for XHRs

  // use the same base as axios for <img> requests too
  const apiPrefix = (axiosClient.defaults.baseURL || "/api").replace(/\/$/, "");
  const imageRawUrl = (imageId) => `${apiPrefix}${apiBase}/images/${imageId}/raw`;

  // use the same base as axios for <img> requests too


  


  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(apiBase);
      setTransformers(res.data);
    } catch (error) {
      showSnackbar(error?.response?.data?.error || "Failed to load transformers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const create = async () => {
    if (!form.name.trim() || !form.site.trim() || form.ratingKva === "") {
      showSnackbar("Please fill in all fields", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      site: form.site.trim(),
      ratingKva: Number(form.ratingKva)
    };

    try {
      if (editMode) {
        await axiosClient.put(`${apiBase}/${editingId}`, payload);
        showSnackbar("Transformer updated successfully");
        setEditMode(false);
        setEditingId(null);
      } else {
        await axiosClient.post(apiBase, payload);
        showSnackbar("Transformer created successfully");
      }
      setForm({ name: "", site: "", ratingKva: "" });
      load();
    } catch (error) {
      showSnackbar(error?.response?.data?.error || "Failed to save transformer", "error");
    }
  };

  const startEdit = (transformer) => {
    setForm({
      name: transformer.name || "",
      site: transformer.site || "",
      ratingKva: transformer.ratingKva?.toString() || ""
    });
    setEditMode(true);
    setEditingId(transformer.id);
  };

  const cancelEdit = () => {
    setForm({ name: "", site: "", ratingKva: "" });
    setEditMode(false);
    setEditingId(null);
  };

  const confirmDelete = (transformer) => {
    setDeleteDialog({ open: true, transformer });
  };

  const remove = async () => {
    try {
      await axiosClient.delete(`${apiBase}/${deleteDialog.transformer.id}`);
      showSnackbar("Transformer deleted successfully");
      load();
    } catch (error) {
      showSnackbar(error?.response?.data?.error || "Failed to delete transformer", "error");
    }
    setDeleteDialog({ open: false, transformer: null });
  };

  // ----- Images viewer -----
  const openImages = async (t) => {
    setViewT(t);
    setImages([]);
    setImagesOpen(true);
    setImagesLoading(true);
    try {
      const res = await axiosClient.get(`${apiBase}/${t.id}/images`);
      setImages(res.data);
    } catch (e) {
      showSnackbar(e?.response?.data?.error || "Failed to load images", "error");
    } finally {
      setImagesLoading(false);
    }
  };

  

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          <ElectricalServices sx={{ mr: 2, verticalAlign: 'middle' }} />
          Transformer Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your electrical transformers and their thermal inspection data
        </Typography>
      </Box>

      {/* Add/Edit Form */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: editMode ? '#ed6c02' : '#1976d2' }}>
            {editMode ? 'Edit Transformer' : 'Add New Transformer'}
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Name / Code"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Site / Location"
                value={form.site}
                onChange={e => setForm({ ...form, site: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Rating (kVA)"
                type="number"
                value={form.ratingKva}
                onChange={e => setForm({ ...form, ratingKva: e.target.value })}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={create}
                  startIcon={editMode ? <Edit /> : <Add />}
                  size="small"
                  sx={{ minWidth: 'auto' }}
                  disabled={loading}
                >
                  {editMode ? 'Update' : 'Add'}
                </Button>
                {editMode && (
                  <Button
                    variant="outlined"
                    onClick={cancelEdit}
                    size="small"
                    sx={{ minWidth: 'auto' }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transformers Table */}
      <Paper sx={{ boxShadow: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ color: '#1976d2' }}>
            Registered Transformers ({transformers.length})
          </Typography>
        </Box>

        {transformers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ElectricalServices sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No transformers registered yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your first transformer using the form above
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ElectricalServices fontSize="small" />
                    Name / Code
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" />
                    Site
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PowerInput fontSize="small" />
                    Rating (kVA)
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transformers.map((t) => (
                <TableRow
                  key={t.id}
                  onClick={() => openImages(t)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f9f9f9' },
                    bgcolor: editingId === t.id ? '#fff3e0' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Chip label={t.name} color="primary" variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>{t.site || "-"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {t.ratingKva ?? "-"} {t.ratingKva != null ? "kVA" : ""}
                    </Box>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => openImages(t)}
                        color="primary"
                        sx={{ '&:hover': { bgcolor: '#e3f2fd' } }}
                      >
                        <ImageIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => startEdit(t)}
                        color="primary"
                        sx={{ '&:hover': { bgcolor: '#e3f2fd' } }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => confirmDelete(t)}
                        color="error"
                        sx={{ '&:hover': { bgcolor: '#ffebee' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Images Viewer Dialog */}
      <Dialog
        open={imagesOpen}
        onClose={() => setImagesOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {viewT ? `Images: ${viewT.name} (${viewT.site || "-"})` : "Images"}
        </DialogTitle>
        <DialogContent dividers>
          {imagesLoading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {!imagesLoading && images.length === 0 && (
            <Typography color="text.secondary">No images found.</Typography>
          )}

          <Grid container spacing={2}>
            {images.map((img,i) => (
              <Grid item xs={12} sm={6} md={4} key={img.id}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <Box sx={{ p: 1 }}>
                    <img
                      src={imageRawUrl(img.id)}
                      alt={img.filename || `image-${img.id}`}
                      style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 6, cursor: "zoom-in" }}
                      onClick={() => { setPreviewIndex(i); setPreviewOpen(true); }} // <-- i is the index in map
                    />
                  </Box>
                  <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                      <Chip size="small" label={img.imageType} />
                      {img.envCondition?.weather && (
                        <Chip
                          size="small"
                          label={img.envCondition.weather}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2">
                      {img.uploader || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {img.createdAt ? new Date(img.createdAt).toLocaleString() : ""}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagesOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, transformer: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete transformer "{deleteDialog.transformer?.name}"?
            This will remove all associated thermal images.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, transformer: null })}>
            Cancel
          </Button>
          <Button onClick={remove} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={images}
        index={previewIndex}
        setIndex={setPreviewIndex}
        apiBase={(axiosClient.defaults.baseURL || "/api").replace(/\/$/, "") + apiBase}
        transformer={viewT}
      />

    </Box>
  );
}
