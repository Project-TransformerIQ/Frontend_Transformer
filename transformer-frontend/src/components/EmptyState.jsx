import { Box, Button, Typography } from "@mui/material";
import { ElectricalServices, Add } from "@mui/icons-material";

export default function EmptyState({ title = "No data yet", subtitle, actionText, onAction }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 4,
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2
      }}
    >
      <ElectricalServices sx={{ fontSize: 96, color: "action.disabled" }} />
      <Box>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">{subtitle}</Typography>
        )}
      </Box>
      {onAction && (
        <Button variant="contained" startIcon={<Add />} onClick={onAction}>
          {actionText || "Add"}
        </Button>
      )}
    </Box>
  );
}
