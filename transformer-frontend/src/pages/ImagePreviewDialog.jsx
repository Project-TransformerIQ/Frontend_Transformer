import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Box, Chip, Typography, Button, Stack
} from "@mui/material";
import { Close, ArrowBack, ArrowForward, Download } from "@mui/icons-material";

export default function ImagePreviewDialog({
  open, onClose, images, index, setIndex, apiBase, transformer
}) {
  if (!open || !images?.length) return null;
  const img = images[index];
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  const rawUrl = `${apiBase}/images/${img.id}/raw`;

  const fmtMB = (b) => (typeof b === "number" ? `${(b/1024/1024).toFixed(2)} MB` : "-");
  const ts = img.createdAt ? new Date(img.createdAt).toLocaleString() : "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 6 }}>
        {transformer ? `${transformer.name} (${transformer.site || "-"})` : "Preview"}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        <Box sx={{
          width: "100%", maxHeight: "70vh", display: "flex",
          alignItems: "center", justifyContent: "center", bgcolor: "grey.100",
          borderRadius: 2, overflow: "hidden", position: "relative"
        }}>
          <IconButton onClick={prev} sx={{ position: "absolute", left: 8, bgcolor: "white" }}>
            <ArrowBack />
          </IconButton>

          <img
            src={rawUrl}
            alt={img.filename || `image-${img.id}`}
            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
          />

          <IconButton onClick={next} sx={{ position: "absolute", right: 8, bgcolor: "white" }}>
            <ArrowForward />
          </IconButton>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={img.imageType} color="primary" />
          {img.envCondition?.weather && <Chip label={img.envCondition.weather} variant="outlined" />}
          {img.envCondition?.temperatureC != null && <Chip label={`${img.envCondition.temperatureC} °C`} variant="outlined" />}
          {img.envCondition?.humidity != null && <Chip label={`${img.envCondition.humidity} %`} variant="outlined" />}
          {img.uploader && <Chip label={`by: ${img.uploader}`} variant="outlined" />}
          {img.contentType && <Chip label={img.contentType} variant="outlined" />}
          {img.sizeBytes != null && <Chip label={fmtMB(img.sizeBytes)} variant="outlined" />}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {img.filename} • {ts}
        </Typography>
        {img.envCondition?.locationNote && (
          <Typography variant="body2">Note: {img.envCondition.locationNote}</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" startIcon={<Download />} component="a" href={rawUrl} target="_blank" rel="noopener noreferrer">
          Open / Download
        </Button>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
