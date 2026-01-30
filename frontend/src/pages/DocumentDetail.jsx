import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Card from "../components/Card";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const fetchDocument = React.useCallback(() => {
    if (!id) return;
    
    api.get(`/documents/${id}`)
      .then(res => {
        setDoc(res.data);
        setError("");
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching document:", err);
        if (err.response?.status === 404) {
          setError("Document not found");
        } else {
          setError("Failed to load document. Please try again.");
        }
        setLoading(false);
      });
  }, [id]);

  React.useEffect(() => {
    fetchDocument();
    
    // Refresh document data periodically to get extraction results
    const interval = setInterval(fetchDocument, 3000);
    return () => clearInterval(interval);
  }, [fetchDocument]);

  if (loading) {
    return (
      <Card title="Loading Document...">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading document details...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Error">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Go to Dashboard
          </button>
        </div>
      </Card>
    );
  }

  if (!doc) {
    return (
      <Card title="Document Not Found">
        <div className="text-center py-8">
          <div className="text-gray-600 mb-4">Document not found</div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Go to Dashboard
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Document ${doc.id}`}>
      <div className="space-y-3">
        <div><strong>Filename:</strong> {doc.filename}</div>
        <div>
          <strong>Vendor:</strong> {doc.vendor || <span className="text-gray-400 italic">Extracting...</span>}
        </div>
        <div>
          <strong>Invoice #:</strong> {doc.invoice_number || <span className="text-gray-400 italic">Extracting...</span>}
        </div>
        <div>
          <strong>Date:</strong> {doc.date ? new Date(doc.date).toLocaleDateString() : <span className="text-gray-400 italic">Extracting...</span>}
        </div>
        <div>
          <strong>Amount:</strong> {doc.amount ? `$${doc.amount.toFixed(2)}` : <span className="text-gray-400 italic">Extracting...</span>}
        </div>
        <div>
          <strong>VAT:</strong> {doc.vat ? `$${doc.vat.toFixed(2)}` : <span className="text-gray-400 italic">Not found</span>}
        </div>
        <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${
          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>{doc.status}</span></div>
        <div><strong>Duplicate:</strong> {doc.is_duplicate ? <span className="text-red-600">Yes</span> : <span className="text-green-600">No</span>}</div>
        <div className="pt-4 border-t">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Card>
  );
}
