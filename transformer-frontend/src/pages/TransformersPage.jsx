import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTransformers,
  createTransformer,
  updateTransformer,
  deleteTransformer,
  getImages,
  buildImageRawUrl
} from "../services/transformerService";

import {
  Box, 
  Paper, 
  Typography, 
  Button, 
  Snackbar, 
  Alert, 
  LinearProgress, 
  Stack,
  Container,
  Fade,
  Grow,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import { 
  Add, 
  ElectricalServices, 
  Search,
  FilterList,
  GridView,
  ViewList,
  Refresh,
  Analytics
} from "@mui/icons-material";

import TransformerFormDialog from "../components/TransformerFormDialog";
import TransformerTable from "../components/TransformerTable";
import EmptyState from "../components/EmptyState";
import ImagePreviewDialog from "../pages/ImagePreviewDialog";

export default function TransformersPage() {
  const [transformers, setTransformers] = useState([]);
  const [filteredTransformers, setFilteredTransformers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [initialForm, setInitialForm] = useState({ transformerNo: "", poleNo: "", region: "", transformerType: "" });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, transformer: null });

  // Images viewer
  const [imagesOpen, setImagesOpen] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [viewT, setViewT] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const navigate = useNavigate();

  const REGION_OPTIONS = ["Colombo", "Gampaha", "Kandy", "Galle", "Jaffna"];
  const TYPE_OPTIONS = ["BULK", "DISTRIBUTION"];

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const load = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getTransformers();
      setTransformers(res.data || []);
      setFilteredTransformers(res.data || []);
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to load transformers", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Filter transformers based on search and filters
  useEffect(() => {
    let filtered = transformers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.transformerNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.poleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transformerType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (selectedRegion !== "All") {
      filtered = filtered.filter(t => t.region === selectedRegion);
    }

    // Type filter
    if (selectedType !== "All") {
      filtered = filtered.filter(t => t.transformerType === selectedType);
    }

    setFilteredTransformers(filtered);
  }, [searchTerm, selectedRegion, selectedType, transformers]);

  useEffect(() => {
    load();
  }, []);

  // --- Form Dialog handlers ---
  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setInitialForm({ transformerNo: "", poleNo: "", region: "", transformerType: "" });
    setFormDialogOpen(true);
  };

  const openEdit = (t) => {
    setMode("edit");
    setEditingId(t.id);
    setInitialForm({
      transformerNo: t.transformerNo || "",
      poleNo: t.poleNo || "",
      region: t.region || "",
      transformerType: t.transformerType || ""
    });
    setFormDialogOpen(true);
  };

  const submitForm = async (payload) => {
    try {
      if (mode === "edit" && editingId) {
        await updateTransformer(editingId, payload);
        showSnackbar("Transformer updated successfully");
      } else {
        await createTransformer(payload);
        showSnackbar("Transformer created successfully");
      }
      setFormDialogOpen(false);
      setEditingId(null);
      load(false); // Refresh without showing loading
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to save transformer", "error");
    }
  };

  const handleDeleteClick = (t) => {
    setDeleteDialog({ open: true, transformer: t });
  };

  const confirmDelete = async () => {
    try {
      await deleteTransformer(deleteDialog.transformer.id);
      showSnackbar("Transformer deleted successfully");
      setDeleteDialog({ open: false, transformer: null });
      load(false); // Refresh without showing loading
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to delete transformer", "error");
    }
  };

  // --- Images Viewer ---
  const openImages = async (t) => {
    setViewT(t);
    setImages([]);
    setImagesOpen(true);
    setImagesLoading(true);
    try {
      const res = await getImages(t.id);
      setImages(res.data || []);
    } catch (e) {
      showSnackbar(e?.response?.data?.error || "Failed to load images", "error");
    } finally {
      setImagesLoading(false);
    }
  };

  // Statistics
  const stats = {
    total: transformers.length,
    bulk: transformers.filter(t => t.transformerType === "BULK").length,
    distribution: transformers.filter(t => t.transformerType === "DISTRIBUTION").length,
    regions: [...new Set(transformers.map(t => t.region).filter(Boolean))].length
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRegion("All");
    setSelectedType("All");
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header Section with Gradient Background */}
          <Card 
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)'
              }
            }}
          >
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
                <Stack spacing={1} alignItems={{ xs: 'center', md: 'flex-start' }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{ 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    <ElectricalServices sx={{ fontSize: 48 }} />
                    Transformer Management
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, textAlign: { xs: 'center', md: 'left' } }}>
                    Monitor and manage electrical transformers with thermal inspection data
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<Refresh />} 
                    onClick={() => load()}
                    disabled={loading}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<Add />} 
                    onClick={openCreate}
                    sx={{ 
                      bgcolor: '#ff6b35',
                      '&:hover': { bgcolor: '#e55a2b' }
                    }}
                  >
                    Add Transformer
                  </Button>
                </Stack>
              </Stack>

              {/* Statistics Cards */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                {[
                  { label: 'Total Transformers', value: stats.total, color: '#ffffff' },
                  { label: 'Bulk Type', value: stats.bulk, color: '#4caf50' },
                  { label: 'Distribution Type', value: stats.distribution, color: '#ff9800' },
                  { label: 'Regions Covered', value: stats.regions, color: '#9c27b0' }
                ].map((stat, index) => (
                  <Grow key={stat.label} in timeout={800 + index * 200}>
                    <Card sx={{ 
                      flex: 1,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {stat.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Grow in timeout={800}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  placeholder="Search transformers..."
                  variant="outlined"
                  size="medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flex: 1, minWidth: 300 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <FilterList color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Filters:
                  </Typography>
                  
                  {/* Region Filter */}
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      label="All Regions"
                      variant={selectedRegion === "All" ? "filled" : "outlined"}
                      onClick={() => setSelectedRegion("All")}
                      color="primary"
                      size="small"
                    />
                    {REGION_OPTIONS.map(region => (
                      <Chip 
                        key={region}
                        label={region}
                        variant={selectedRegion === region ? "filled" : "outlined"}
                        onClick={() => setSelectedRegion(region)}
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Stack>
                  
                  <Divider orientation="vertical" flexItem />
                  
                  {/* Type Filter */}
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      label="All Types"
                      variant={selectedType === "All" ? "filled" : "outlined"}
                      onClick={() => setSelectedType("All")}
                      color="secondary"
                      size="small"
                    />
                    {TYPE_OPTIONS.map(type => (
                      <Chip 
                        key={type}
                        label={type}
                        variant={selectedType === type ? "filled" : "outlined"}
                        onClick={() => setSelectedType(type)}
                        color="secondary"
                        size="small"
                      />
                    ))}
                  </Stack>
                  
                  {(searchTerm || selectedRegion !== "All" || selectedType !== "All") && (
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={clearFilters}
                      sx={{ ml: 1 }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Stack>
              </Stack>
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics color="action" />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredTransformers.length} of {transformers.length} transformers
                </Typography>
              </Box>
            </Paper>
          </Grow>

          {/* Table / Empty State */}
          <Grow in timeout={1000}>
            <Paper sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minHeight: filteredTransformers.length === 0 ? "60vh" : "auto" 
            }}>
              <Box sx={{ 
                p: 3, 
                borderBottom: 1, 
                borderColor: "divider",
                background: 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)'
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" sx={{ 
                    color: "#1976d2", 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <GridView />
                    Transformer Registry
                  </Typography>
                  <Chip 
                    label={`${filteredTransformers.length} Records`}
                    color="primary"
                    variant="filled"
                  />
                </Stack>
              </Box>

              {loading && (
                <Box sx={{ p: 2 }}>
                  <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Loading transformers...
                  </Typography>
                </Box>
              )}

              {!loading && filteredTransformers.length === 0 ? (
                <EmptyState
                  title={searchTerm || selectedRegion !== "All" || selectedType !== "All" 
                    ? "No transformers match your filters" 
                    : "No transformers registered yet"}
                  subtitle={searchTerm || selectedRegion !== "All" || selectedType !== "All"
                    ? "Try adjusting your search criteria or filters"
                    : 'Click the "Add Transformer" button to create your first record.'}
                  actionText={searchTerm || selectedRegion !== "All" || selectedType !== "All" 
                    ? "Clear Filters" 
                    : "Add Transformer"}
                  onAction={searchTerm || selectedRegion !== "All" || selectedType !== "All" 
                    ? clearFilters 
                    : openCreate}
                />
              ) : !loading && (
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <TransformerTable
                    items={filteredTransformers}
                    editingId={editingId}
                    onRowClick={(t) => navigate(`/transformers/${t.id}/inspections`)}
                    onOpenImages={openImages}
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                  />
                </Box>
              )}
            </Paper>
          </Grow>

          {/* Create/Edit Dialog */}
          <TransformerFormDialog
            open={formDialogOpen}
            mode={mode}
            initialValues={initialForm}
            regions={REGION_OPTIONS}
            types={TYPE_OPTIONS}
            loading={false}
            onClose={() => setFormDialogOpen(false)}
            onSubmit={submitForm}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialog.open}
            onClose={() => setDeleteDialog({ open: false, transformer: null })}
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <DialogTitle sx={{ color: '#d32f2f', fontWeight: 600 }}>
              Confirm Deletion
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete transformer{' '}
                <strong>{deleteDialog.transformer?.transformerNo}</strong>?
                This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button 
                onClick={() => setDeleteDialog({ open: false, transformer: null })}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                color="error"
                variant="contained"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Images Viewer Dialog */}
          <ImagePreviewDialog
            open={imagesOpen}
            onClose={() => setImagesOpen(false)}
            images={images}
            index={previewIndex}
            setIndex={setPreviewIndex}
            transformer={viewT}
            getImageUrl={(imgId) => buildImageRawUrl(imgId)}
            loading={imagesLoading}
          />

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              variant="filled"
              sx={{ borderRadius: 2 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
}