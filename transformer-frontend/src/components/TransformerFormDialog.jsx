import { useEffect, useState } from "react";
import {
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button, 
  TextField, 
  MenuItem, 
  Stack,
  Box,
  Typography,
  Avatar,
  Divider,
  Slide,
  Paper,
  InputAdornment,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  ElectricalServices,
  LocationOn,
  Business,
  PowerInput,
  Add,
  Edit,
  Close,
  Save,
  Engineering,
  CheckCircle,
  Error
} from "@mui/icons-material";
import { forwardRef } from "react";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TransformerFormDialog({
  open,
  mode = "create", // "create" | "edit"
  initialValues = { transformerNo: "", poleNo: "", region: "", transformerType: "" },
  regions = [],
  types = [],
  loading = false,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setForm(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues, open]);

  // Validation
  const validateField = (name, value) => {
    switch (name) {
      case 'transformerNo':
        if (!value.trim()) return 'Transformer number is required';
        if (value.trim().length < 3) return 'Transformer number must be at least 3 characters';
        return '';
      case 'poleNo':
        if (!value.trim()) return 'Pole number is required';
        return '';
      case 'region':
        if (!value) return 'Region is required';
        return '';
      case 'transformerType':
        if (!value) return 'Transformer type is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    
    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (name) => {
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, form[name]);
    setErrors({ ...errors, [name]: error });
  };

  const isFormValid = () => {
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      setTouched({ transformerNo: true, poleNo: true, region: true, transformerType: true });
      return;
    }

    onSubmit({
      transformerNo: form.transformerNo.trim(),
      poleNo: form.poleNo.trim(),
      region: form.region,
      transformerType: form.transformerType
    });
  };

  const getRegionInfo = (region) => {
    const regionInfo = {
      "Colombo": { color: "#1976d2", icon: "🏢", description: "Commercial District" },
      "Gampaha": { color: "#388e3c", icon: "🏘️", description: "Suburban Area" },
      "Kandy": { color: "#f57c00", icon: "⛰️", description: "Hill Country" },
      "Galle": { color: "#7b1fa2", icon: "🏖️", description: "Coastal Region" },
      "Jaffna": { color: "#d32f2f", icon: "🌴", description: "Northern Province" }
    };
    return regionInfo[region] || { color: "#757575", icon: "📍", description: "Unknown Region" };
  };

  const getTypeInfo = (type) => {
    const typeInfo = {
      "BULK": { 
        color: "#4caf50", 
        icon: <Business />, 
        description: "High-voltage transmission transformer",
        voltage: "33kV - 132kV"
      },
      "DISTRIBUTION": { 
        color: "#ff9800", 
        icon: <Engineering />, 
        description: "Low-voltage distribution transformer",
        voltage: "11kV - 33kV"
      }
    };
    return typeInfo[type] || { color: "#757575", icon: <PowerInput />, description: "Unknown Type", voltage: "N/A" };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      TransitionComponent={Transition}
      PaperProps={{
        sx: { 
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'visible'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 3,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              width: 48,
              height: 48
            }}>
              {mode === "edit" ? <Edit /> : <Add />}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {mode === "edit" ? "Edit Transformer" : "Add New Transformer"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {mode === "edit" 
                  ? "Update transformer information and configuration"
                  : "Register a new transformer in the system"
                }
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Close">
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              disabled={loading}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* Loading Bar */}
      {loading && (
        <LinearProgress sx={{ height: 3 }} />
      )}

      <DialogContent sx={{ p: 0 }}>
        {/* Form Preview Card */}
        {(form.transformerNo || form.region || form.transformerType) && (
          <Paper sx={{ 
            m: 3, 
            p: 2, 
            bgcolor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: 2
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Preview:
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ 
                bgcolor: form.transformerType ? getTypeInfo(form.transformerType).color : '#ccc',
                width: 32,
                height: 32
              }}>
                <ElectricalServices fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {form.transformerNo || 'Transformer No.'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {form.region && (
                    <Chip 
                      label={form.region}
                      size="small"
                      sx={{ 
                        bgcolor: getRegionInfo(form.region).color + '20',
                        color: getRegionInfo(form.region).color
                      }}
                    />
                  )}
                  {form.transformerType && (
                    <Chip 
                      label={form.transformerType}
                      size="small"
                      sx={{ 
                        bgcolor: getTypeInfo(form.transformerType).color + '20',
                        color: getTypeInfo(form.transformerType).color
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Form Fields */}
        <Box sx={{ p: 3, pt: 1 }}>
          <Stack spacing={3}>
            {/* Transformer Number */}
            <Box>
              <TextField
                label="Transformer Number"
                value={form.transformerNo}
                onChange={(e) => handleChange('transformerNo', e.target.value)}
                onBlur={() => handleBlur('transformerNo')}
                error={!!errors.transformerNo}
                helperText={errors.transformerNo || "Enter unique transformer identifier"}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ElectricalServices color={errors.transformerNo ? "error" : "action"} />
                    </InputAdornment>
                  ),
                  endAdornment: form.transformerNo && !errors.transformerNo && (
                    <InputAdornment position="end">
                      <CheckCircle color="success" fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)'
                    }
                  }
                }}
              />
            </Box>

            {/* Pole Number */}
            <Box>
              <TextField
                label="Pole Number"
                value={form.poleNo}
                onChange={(e) => handleChange('poleNo', e.target.value)}
                onBlur={() => handleBlur('poleNo')}
                error={!!errors.poleNo}
                helperText={errors.poleNo || "Enter the pole or location identifier"}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color={errors.poleNo ? "error" : "action"} />
                    </InputAdornment>
                  ),
                  endAdornment: form.poleNo && !errors.poleNo && (
                    <InputAdornment position="end">
                      <CheckCircle color="success" fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)'
                    }
                  }
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }}>
              <Chip label="Configuration" size="small" />
            </Divider>

            {/* Region Selection */}
            <Box>
              <TextField
                select
                label="Region"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                onBlur={() => handleBlur('region')}
                error={!!errors.region}
                helperText={errors.region || "Select the geographical region"}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color={errors.region ? "error" : "action"} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)'
                    }
                  }
                }}
              >
                {regions.map((region) => {
                  const info = getRegionInfo(region);
                  return (
                    <MenuItem key={region} value={region}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <Box sx={{ fontSize: '1.2em' }}>{info.icon}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {region}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </TextField>
            </Box>

            {/* Type Selection */}
            <Box>
              <TextField
                select
                label="Transformer Type"
                value={form.transformerType}
                onChange={(e) => handleChange('transformerType', e.target.value)}
                onBlur={() => handleBlur('transformerType')}
                error={!!errors.transformerType}
                helperText={errors.transformerType || "Select the transformer category"}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PowerInput color={errors.transformerType ? "error" : "action"} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)'
                    }
                  }
                }}
              >
                {types.map((type) => {
                  const info = getTypeInfo(type);
                  return (
                    <MenuItem key={type} value={type}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: info.color + '20',
                            color: info.color,
                            width: 32,
                            height: 32
                          }}
                        >
                          {info.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info.description}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            display: 'block',
                            color: info.color,
                            fontWeight: 500
                          }}>
                            {info.voltage}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </TextField>
            </Box>

            {/* Validation Summary */}
            {Object.keys(errors).some(key => errors[key]) && (
              <Alert 
                severity="error" 
                sx={{ borderRadius: 2 }}
                icon={<Error />}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {Object.entries(errors).map(([field, error]) => 
                    error && (
                      <li key={field}>
                        <Typography variant="caption">{error}</Typography>
                      </li>
                    )
                  )}
                </ul>
              </Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        gap: 2
      }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          size="large"
          sx={{ 
            borderRadius: 2,
            px: 3,
            borderColor: '#dee2e6',
            color: 'text.secondary'
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading || Object.keys(errors).some(key => errors[key])}
          size="large"
          startIcon={loading ? null : <Save />}
          sx={{ 
            borderRadius: 2,
            px: 4,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
            }
          }}
        >
          {loading ? "Processing..." : (mode === "edit" ? "Update Transformer" : "Create Transformer")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}