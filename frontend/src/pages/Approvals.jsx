import React from "react";
import api from "../api";
import Card from "../components/Card";

const STEP_LABELS = {
  1: "Step 1: Reviewer or Viewer",
  2: "Step 2: Manager or Approver",
  3: "Step 3: Finance/Admin",
};

export default function Approvals() {
  const [docs, setDocs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const fetchDocs = React.useCallback(() => {
    setLoadError(false);
    api
      .get("/documents")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setDocs(list.filter(d => String(d.status || "").toLowerCase() === "pending"));
      })
      .catch(() => {
        setDocs([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 5000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  const act = async (id, action) => {
    try {
      await api.post(`/documents/${id}/approve`, null, { params: { action } });
      fetchDocs();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = typeof detail === "string" ? detail : "Action failed";
      if (err.response?.status === 403) {
        msg = "Not authorized for this step. Step 1: Reviewer/Viewer; Step 2: Manager; Step 3: Admin. Log in with the right role or as Admin.";
      }
      alert(Array.isArray(detail) ? detail.map(m => m.msg || m).join(", ") : msg);
    }
  };

  return (
    <Card title="Pending Approvals (3-Step Workflow)">
      <p className="text-sm text-gray-600 mb-4">
        Each document must pass 3 steps: <strong>Step 1</strong> Reviewer/Viewer → <strong>Step 2</strong> Manager → <strong>Step 3</strong> Admin. Approve to advance; Reject to reject.
      </p>
      {loading && docs.length === 0 && !loadError ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : loadError ? (
        <p className="text-sm text-amber-600">Could not load pending list. Check your connection and try again.</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No pending documents. Every uploaded document is flagged for approval—upload one and it will appear here with Approve/Reject options.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map(d => (
            <li key={d.id} className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-200 pb-3 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800">{d.filename}</div>
                <div className="text-sm text-gray-500 mt-1">Vendor: {d.vendor || "—"} | Amount: {d.amount != null ? `$${Number(d.amount).toFixed(2)}` : "—"}</div>
                <div className="text-xs text-teal-600 mt-1 font-medium">{STEP_LABELS[Number(d.current_step)] || `Step ${d.current_step}/3`}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => act(d.id, "approve")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded">
                  Approve
                </button>
                <button type="button" onClick={() => act(d.id, "reject")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
