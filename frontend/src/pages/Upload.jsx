import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Card from "../components/Card";

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please log in first");
      return;
    }

    setIsUploading(true);
    setMessage("");
    
    const form = new FormData();
    form.append("file", file);
    
    try {
      const response = await api.post("/documents/upload", form);
      setMessage("Upload successful! Extracting vendor and amount...");
      setFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Redirect to document detail page after a short delay
      if (response.data && response.data.id) {
        setTimeout(() => {
          navigate(`/documents/${response.data.id}`);
        }, 1500);
      } else {
        setMessage("Upload successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      let errorMessage = "Upload failed";
      
      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.detail || "Invalid file. Only PDF and image files are allowed.";
        } else if (err.response.status === 403) {
          errorMessage = "You don't have permission to upload files.";
        } else {
          errorMessage = err.response.data?.detail || `Upload failed: ${err.response.statusText}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Cannot connect to server. Make sure the backend is running.";
      } else {
        // Something else happened
        errorMessage = err.message || "Upload failed";
      }
      
      setMessage(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card title="Upload Invoice or Credit Note">
      <p className="text-sm text-gray-600 mb-4">Only invoices and credit notes are accepted (PDF or image).</p>
      <div className="space-y-4">
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg" 
          onChange={e => setFile(e.target.files[0])}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />
        <button 
          onClick={handleUpload} 
          disabled={isUploading || !file}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        {message && (
          <div className={`text-sm ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}
      </div>
    </Card>
  );
}
