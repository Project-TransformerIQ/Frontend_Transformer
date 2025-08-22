import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Snackbar, Alert
} from "@mui/material";
import { ArrowBack, Add } from "@mui/icons-material";

export default function TransformerInspectionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const apiBase = "/transformers";

  const [transformer, setTransformer] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  const [form, setForm] = useState({
    title: "",
    inspector: "",
    notes: "",
    status: "OPEN"
  });

  const toast = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  const load = async () => {
    try {
      const [t, ins] = await Promise.all([
        axiosClient.get(`${apiBase}/${id}`),
        axiosClient.get(`${apiBase}/${id}/inspections`)
      ]);
      setTransformer(t.data);
      setInspections(ins.data || []);
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to load inspections", "error");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const addInspection = async () => {
    if (!form.title.trim() || !form.inspector.trim()) {
      toast("Title and Inspector are required", "error");
      return;
    }
    try {
      await axiosClient.post(`${apiBase}/${id}/inspections`, {
        title: form.title.trim(),
        inspector: form.inspector.trim(),
        notes: form.notes?.trim() || undefined,
        status: form.status
      });
      toast("Inspection added");
      setForm({ title: "", inspector: "", notes: "", status: "OPEN" });
      load();
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to add inspection", "error");
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Typography variant="h5">Transformer Inspections</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Transformer</Typography>
          {!transformer ? (
            <Typography color="text.secondary">Loading…</Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={`No: ${transformer.transformerNo}`} color="primary" />
              <Chip label={`Pole: ${transformer.poleNo || "-"}`} variant="outlined" />
              <Chip label={`Region: ${transformer.region || "-"}`} variant="outlined" />
              <Chip label={`Type: ${transformer.transformerType || "-"}`} variant="outlined" />
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Add Inspection</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Title"
                    fullWidth
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Inspector"
                    fullWidth
                    value={form.inspector}
                    onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    SelectProps={{ native: true }}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="CLOSED">CLOSED</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Add />} onClick={addInspection} fullWidth>
                    Add Inspection
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Inspections ({inspections.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {inspections.length === 0 ? (
                <Typography color="text.secondary">No inspections yet.</Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Inspector</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inspections.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.title}</TableCell>
                        <TableCell>{i.inspector || "-"}</TableCell>
                        <TableCell>{i.status || "-"}</TableCell>
                        <TableCell>{i.createdAt ? new Date(i.createdAt).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.sev}
          variant="filled"
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
