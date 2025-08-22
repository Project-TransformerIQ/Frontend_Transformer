import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TransformersPage from "./pages/TransformersPage.jsx";
import ImageUploadPage from "./pages/ImageUploadPage.jsx";
import TransformerInspectionsPage from "./pages/TransformerInspectionsPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <nav style={{display:"flex", gap:"1rem", padding:"1rem"}}>
        <Link to="/">Transformers</Link>
        <Link to="/upload">Upload Image</Link>
      </nav>
      <Routes>
        <Route path="/" element={<TransformersPage/>}/>
        <Route path="/upload" element={<ImageUploadPage/>}/>
        <Route path="/transformers/:id/inspections" element={<TransformerInspectionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
