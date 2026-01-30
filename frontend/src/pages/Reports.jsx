import React from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Card from "../components/Card";

export default function Reports() {
  const [filters, setFilters] = React.useState({
    start: "",
    end: "",
    vendor: "",
    status: "",
    amount_min: "",
    amount_max: "",
  });
  const [summary, setSummary] = React.useState(null);
  const [vatReport, setVatReport] = React.useState(null);
  const [vendorAnalysis, setVendorAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchReports = () => {
    setLoading(true);
    const params = {};
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    if (filters.vendor) params.vendor = filters.vendor;
    if (filters.status) params.status = filters.status;
    if (filters.amount_min) params.amount_min = parseFloat(filters.amount_min);
    if (filters.amount_max) params.amount_max = parseFloat(filters.amount_max);
    const reportParams = { start: params.start, end: params.end, vendor: params.vendor, status: params.status };
    Promise.all([
      api.get("/reports/spend-summary", { params }),
      api.get("/reports/tax-vat-report", { params: reportParams }),
      api.get("/reports/vendor-analysis", { params: reportParams }),
    ])
      .then(([s, v, va]) => {
        setSummary(s.data);
        setVatReport(v.data);
        setVendorAnalysis(va.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportFile = async (format) => {
    const params = {};
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    if (filters.vendor) params.vendor = filters.vendor;
    if (filters.status) params.status = filters.status;
    if (filters.amount_min) params.amount_min = parseFloat(filters.amount_min);
    if (filters.amount_max) params.amount_max = parseFloat(filters.amount_max);
    try {
      const res = await api.get(`/reports/export/${format}`, { params, responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report.${format === "csv" ? "csv" : format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Report Filters">
        <p className="text-sm text-gray-600 mb-4">Filter by date range, vendor, approval status (Pending/Approved/Rejected), and amount. View charts and document counts on <Link to="/insights" className="text-teal-600 font-medium hover:underline">AI Insights</Link>.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input type="date" className="w-full p-2 border rounded" value={filters.start} onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input type="date" className="w-full p-2 border rounded" value={filters.end} onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="Vendor name" value={filters.vendor} onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
            <select className="w-full p-2 border rounded" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Min</label>
            <input type="number" step="0.01" className="w-full p-2 border rounded" placeholder="0" value={filters.amount_min} onChange={(e) => setFilters((f) => ({ ...f, amount_min: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Max</label>
            <input type="number" step="0.01" className="w-full p-2 border rounded" placeholder="0" value={filters.amount_max} onChange={(e) => setFilters((f) => ({ ...f, amount_max: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={fetchReports} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50">
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button onClick={() => exportFile("csv")} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Export CSV</button>
          <button onClick={() => exportFile("excel")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Export Excel</button>
          <button onClick={() => exportFile("pdf")} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Export PDF</button>
        </div>
      </Card>

      {summary && (
        <>
          <Card title="Spend Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Total Spend</div>
                <div className="text-2xl font-bold">${summary.total?.toFixed(2) ?? "0.00"}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Document Count</div>
                <div className="text-2xl font-bold">{summary.count ?? 0}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Top Vendors</div>
                <ul className="text-sm mt-1">
                  {(summary.top_vendors || []).slice(0, 5).map(([v, a]) => (
                    <li key={v}>{v}: ${Number(a).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          <Card title="Tax/VAT Report">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><strong>Total Amount:</strong> ${vatReport?.total_amount?.toFixed(2) ?? "0.00"}</div>
              <div><strong>Total VAT:</strong> ${vatReport?.total_vat?.toFixed(2) ?? "0.00"}</div>
            </div>
            <div className="text-sm text-gray-600">Items: {vatReport?.items?.length ?? 0} documents</div>
          </Card>
          {vendorAnalysis && (vendorAnalysis.vendors?.length > 0) && (
            <Card title="Vendor Analysis">
              <p className="text-sm text-gray-600 mb-2">Spend by vendor (filtered).</p>
              <ul className="space-y-1 text-sm">
                {(vendorAnalysis.vendors || []).slice(0, 10).map(([v, amount]) => (
                  <li key={v} className="flex justify-between"><span>{v}</span><span className="font-medium">${Number(amount).toFixed(2)}</span></li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
