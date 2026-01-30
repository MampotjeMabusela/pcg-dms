import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Approvals from "./pages/Approvals";
import DocumentDetail from "./pages/DocumentDetail";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="insights" element={<Insights />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
