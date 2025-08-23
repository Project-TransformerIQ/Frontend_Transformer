import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Box, 
  Chip, 
  IconButton,
  Avatar,
  Typography,
  Stack,
  Tooltip,
  Fade,
  useTheme,
  alpha
} from "@mui/material";
import { 
  ElectricalServices, 
  LocationOn, 
  PowerInput, 
  Image as ImageIcon, 
  Edit, 
  Delete,
  Visibility,
  Business,
  Engineering
} from "@mui/icons-material";

export default function TransformerTable({
  items = [],
  editingId = null,
  onRowClick,
  onOpenImages,
  onEdit,
  onDelete
}) {
  const theme = useTheme();

  const getTypeColor = (type) => {
    switch (type) {
      case "BULK": return { color: "success", bgColor: "#e8f5e8" };
      case "DISTRIBUTION": return { color: "warning", bgColor: "#fff3e0" };
      default: return { color: "default", bgColor: "#f5f5f5" };
    }
  };

  const getRegionColor = (region) => {
    const colors = {
      "Colombo": "#1976d2",
      "Gampaha": "#388e3c", 
      "Kandy": "#f57c00",
      "Galle": "#7b1fa2",
      "Jaffna": "#d32f2f"
    };
    return colors[region] || "#757575";
  };

  const getTransformerIcon = (type) => {
    return type === "BULK" ? <Business /> : <Engineering />;
  };

  return (
    <Table sx={{ width: "100%", tableLayout: "fixed" }}>
      <TableHead>
        <TableRow sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '& .MuiTableCell-head': {
            color: 'white',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderBottom: 'none',
            py: 2.5
          }
        }}>
          <TableCell sx={{ width: "25%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ElectricalServices fontSize="small" />
              <Typography variant="inherit" sx={{ fontWeight: 700 }}>
                Transformer Details
              </Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ width: "20%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOn fontSize="small" />
              <Typography variant="inherit" sx={{ fontWeight: 700 }}>
                Location
              </Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ width: "20%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Business fontSize="small" />
              <Typography variant="inherit" sx={{ fontWeight: 700 }}>
                Region
              </Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ width: "20%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PowerInput fontSize="small" />
              <Typography variant="inherit" sx={{ fontWeight: 700 }}>
                Type & Category
              </Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ width: "15%", textAlign: 'center' }}>
            <Typography variant="inherit" sx={{ fontWeight: 700 }}>
              Actions
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {items.map((t, index) => {
          const typeConfig = getTypeColor(t.transformerType);
          const isEditing = editingId === t.id;
          
          return (
            <Fade in timeout={300 + index * 100} key={t.id}>
              <TableRow
                onClick={() => onRowClick?.(t)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isEditing ? 'scale(1.02)' : 'scale(1)',
                  bgcolor: isEditing 
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'inherit',
                  '&:hover': { 
                    bgcolor: isEditing 
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.04),
                    transform: 'scale(1.01)',
                    boxShadow: isEditing 
                      ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`
                      : `0 4px 15px ${alpha(theme.palette.grey[500], 0.15)}`
                  },
                  position: 'relative',
                  '&::after': isEditing ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    bgcolor: theme.palette.primary.main,
                    borderRadius: '0 2px 2px 0'
                  } : {},
                  borderLeft: isEditing ? `4px solid ${theme.palette.primary.main}` : 'none'
                }}
              >
                {/* Transformer Details */}
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 45,
                        height: 45,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      <ElectricalServices sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: theme.palette.text.primary,
                          mb: 0.5 
                        }}
                      >
                        {t.transformerNo}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        ID: {t.id}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn 
                        fontSize="small" 
                        sx={{ color: theme.palette.text.secondary }} 
                      />
                      <Typography 
                        variant="body1" 
                        sx={{ fontWeight: 500 }}
                      >
                        {t.poleNo || "Not specified"}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                {/* Region */}
                <TableCell>
                  <Chip
                    label={t.region || "Unknown"}
                    sx={{
                      bgcolor: alpha(getRegionColor(t.region), 0.1),
                      color: getRegionColor(t.region),
                      fontWeight: 600,
                      border: `1px solid ${alpha(getRegionColor(t.region), 0.3)}`,
                      '&:hover': {
                        bgcolor: alpha(getRegionColor(t.region), 0.15)
                      }
                    }}
                    size="small"
                    icon={<Business sx={{ fontSize: 16 }} />}
                  />
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Stack spacing={1}>
                    <Chip
                      label={t.transformerType || "Unknown"}
                      color={typeConfig.color}
                      variant="filled"
                      size="medium"
                      icon={getTransformerIcon(t.transformerType)}
                      sx={{
                        fontWeight: 600,
                        boxShadow: `0 2px 8px ${alpha(theme.palette[typeConfig.color]?.main || '#000', 0.2)}`,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette[typeConfig.color]?.main || '#000', 0.3)}`
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </Stack>
                </TableCell>

                {/* Actions */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View Images" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onOpenImages?.(t)}
                        sx={{
                          color: '#2196f3',
                          bgcolor: alpha('#2196f3', 0.1),
                          '&:hover': {
                            bgcolor: alpha('#2196f3', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ImageIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="View Details" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onRowClick?.(t)}
                        sx={{
                          color: '#4caf50',
                          bgcolor: alpha('#4caf50', 0.1),
                          '&:hover': {
                            bgcolor: alpha('#4caf50', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Transformer" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onEdit?.(t)}
                        sx={{
                          color: '#ff9800',
                          bgcolor: alpha('#ff9800', 0.1),
                          '&:hover': {
                            bgcolor: alpha('#ff9800', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Transformer" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onDelete?.(t)}
                        sx={{
                          color: '#f44336',
                          bgcolor: alpha('#f44336', 0.1),
                          '&:hover': {
                            bgcolor: alpha('#f44336', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            </Fade>
          );
        })}
      </TableBody>
    </Table>
  );
}