import React from "react";
import api from "../api";
import Card from "../components/Card";

const STEP_LABELS = {
  1: "Approval 1: Reviewer",
  2: "Approval 2: Manager",
  3: "Approval 3: Finance/Admin",
};

export default function Approvals() {
  const [docs, setDocs] = React.useState([]);

  const fetchDocs = () => {
    api.get("/documents").then(res => setDocs(res.data.filter(d => d.status === "pending"))).catch(() => {});
  };

  React.useEffect(() => {
    fetchDocs();
  }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/documents/${id}/approve`, null, { params: { action } });
      // Refetch so list updates (step change or doc removed when approved/rejected)
      fetchDocs();
    } catch (err) {
      const msg = err.response?.data?.detail || "Action failed";
      alert(Array.isArray(msg) ? msg.map((m) => m.msg || m).join(", ") : msg);
    }
  };

  return (
    <Card title="Pending Approvals (3-Step Workflow)">
      <p className="text-sm text-gray-600 mb-4">Status: Pending / Approved / Rejected. Exactly 3 stages: Reviewer → Manager → Finance/Admin.</p>
      <ul className="space-y-3">
        {docs.map(d => (
          <li key={d.id} className="flex justify-between items-center border-b pb-3 last:border-0">
            <div>
              <div className="font-medium">{d.filename}</div>
              <div className="text-sm text-gray-500">Vendor: {d.vendor || "—"} | Amount: {d.amount != null ? `$${d.amount.toFixed(2)}` : "—"}</div>
              <div className="text-xs text-teal-600 mt-1">{STEP_LABELS[d.current_step] || `Step ${d.current_step}`}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(d.id, "approve")} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => act(d.id, "reject")} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
