import React from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Card from "../components/Card";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#eab308", "#22c55e", "#ef4444"]; // Pending, Approved, Rejected
const LINE_COLORS = [
  "#0d9488", "#6366f1", "#ea580c", "#16a34a", "#dc2626", "#7c3aed", "#0891b2",
  "#ca8a04", "#db2777", "#059669", "#4f46e5", "#b45309", "#be123c", "#0e7490",
];

function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Insights() {
  const [insights, setInsights] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [start, setStart] = React.useState(() => getYesterdayISO());
  const [end, setEnd] = React.useState(() => getTodayISO());
  const [granularity, setGranularity] = React.useState("hour");

  const fetchInsights = () => {
    setLoading(true);
    const params = { granularity };
    if (start) params.start = start;
    if (end) params.end = end;
    api
      .get("/reports/insights", { params })
      .then((res) => setInsights(res.data))
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  };

  const setSinceYesterday = () => {
    const y = getYesterdayISO();
    const t = getTodayISO();
    setStart(y);
    setEnd(t);
    setGranularity("hour");
    setLoading(true);
    api
      .get("/reports/insights", { params: { granularity: "hour", start: y, end: t } })
      .then((res) => setInsights(res.data))
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchInsights();
  }, [granularity]);

  if (loading && !insights)
    return (
      <Card title="AI Insights">
        <div className="py-8 text-center text-gray-600">Loading insights...</div>
      </Card>
    );

  const pieData = insights?.status_counts?.filter((s) => s.value > 0) ?? [];
  const lineData = insights?.trends ?? [];
  const documentSeries = insights?.document_series ?? [];

  return (
    <div className="space-y-6">
      <Card title="AI Insights">
        <p className="text-sm text-gray-600 mb-4">
          Document counts, trends, and spending insights. Use filters below and open{" "}
          <Link to="/reports" className="text-teal-600 font-medium hover:underline">
            Reports
          </Link>{" "}
          for detailed filters and PDF/Excel export.
        </p>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <input
            type="date"
            className="p-2 border rounded"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="p-2 border rounded"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="To"
          />
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Trend by:</span>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="p-2 border rounded bg-white"
            >
              <option value="minute">Minute</option>
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </label>
          <button
            type="button"
            onClick={setSinceYesterday}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 border border-slate-300"
          >
            Since yesterday
          </button>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
          >
            Refresh
          </button>
          <Link
            to="/reports"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Open Reports →
          </Link>
        </div>
      </Card>

      {/* Document counts: Uploaded, Pending, Duplicates, Approved */}
      <Card title="Document Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
            <div className="text-sm text-gray-600">Documents Uploaded</div>
            <div className="text-3xl font-bold text-teal-700">{insights?.documents_uploaded ?? 0}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-700">{insights?.pending ?? 0}</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-gray-600">Duplicates</div>
            <div className="text-3xl font-bold text-red-700">{insights?.duplicates ?? 0}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-3xl font-bold text-green-700">{insights?.approved ?? 0}</div>
          </div>
        </div>
      </Card>

      {/* Pie chart: status distribution */}
      {pieData.length > 0 && (
        <Card title="Status Distribution (Pie Chart)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Documents"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Line chart: document and spend trends (default: since yesterday by hour) */}
      {insights && lineData.length === 0 && (
        <Card title="Document trends over time">
          <p className="text-slate-600 py-4">
            No document activity in the selected range ({start || "any"} to {end || "any"}). Try a wider date range, click &quot;Since yesterday&quot;, or upload documents.
          </p>
        </Card>
      )}
      {lineData.length > 0 && (
        <Card title="Document trends over time">
          <p className="text-sm text-slate-600 mb-4">
            Each line is one document (amount by {granularity}). Time on x-axis, amount ($) on y-axis.
          </p>
          <div className="w-full min-h-[380px]" style={{ height: "min(420px, 60vw)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 16, right: 24, left: 8, bottom: 56 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="period"
                  type="category"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  angle={lineData.length > 8 ? -40 : 0}
                  textAnchor={lineData.length > 8 ? "end" : "middle"}
                  interval="preserveStartEnd"
                  label={{
                    value: "Time",
                    position: "insideBottom",
                    offset: -12,
                    style: { fontSize: 12, fill: "#64748b" },
                  }}
                />
                <YAxis
                  label={{ value: "Amount ($)", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#64748b" } }}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                  width={44}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(value, key) => {
                    const doc = documentSeries.find((d) => d.key === key);
                    return [`$${Number(value).toFixed(2)}`, doc ? doc.name : key];
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                {documentSeries.length > 0
                  ? documentSeries.map((doc, i) => (
                      <Line
                        key={doc.key}
                        type="monotone"
                        dataKey={doc.key}
                        name={doc.name}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))
                  : (
                      <Line
                        type="monotone"
                        dataKey="spend"
                        name="Total spend"
                        stroke={LINE_COLORS[0]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {insights?.spending_insights && (
        <Card title="Spending Insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-teal-50 rounded">
              <div className="text-sm text-gray-600">Total Spend</div>
              <div className="text-2xl font-bold text-teal-700">
                ${insights.spending_insights.total_spend?.toFixed(2) ?? "0.00"}
              </div>
            </div>
            <div className="p-4 bg-teal-50 rounded">
              <div className="text-sm text-gray-600">Document Count</div>
              <div className="text-2xl font-bold text-teal-700">{insights.spending_insights.document_count ?? 0}</div>
            </div>
            <div className="p-4 bg-teal-50 rounded">
              <div className="text-sm text-gray-600">Average Amount</div>
              <div className="text-2xl font-bold text-teal-700">
                ${insights.spending_insights.average_amount ?? "0.00"}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <strong className="block mb-2">Top Vendors by Spend</strong>
            <ul className="list-disc list-inside space-y-1">
              {(insights.spending_insights.top_vendors || []).map((v) => (
                <li key={v.vendor}>
                  {v.vendor}: ${Number(v.total).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="block mb-2">Spend by Approval Status</strong>
            <ul className="list-disc list-inside">
              {Object.entries(insights.spending_insights.by_status || {}).map(([status, total]) => (
                <li key={status}>
                  {status}: ${Number(total).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/reports" className="text-teal-600 font-medium hover:underline">
              → View full reports and export PDF/Excel
            </Link>
          </div>
        </Card>
      )}

      {insights?.anomalies?.length > 0 && (
        <Card title="Anomalies (Unusually High Amounts)">
          <p className="text-sm text-gray-600 mb-2">Documents with amounts significantly above average.</p>
          <ul className="space-y-2">
            {insights.anomalies.map((a) => (
              <li key={a.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span>
                  {a.filename} — {a.vendor || "—"}
                </span>
                <strong className="text-red-600">${Number(a.amount).toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {insights && insights.documents_uploaded === 0 && (
        <Card title="No Data">
          <p className="text-gray-600 mb-4">No documents in the selected range. Upload invoices to see insights.</p>
          <Link to="/upload" className="text-teal-600 font-medium hover:underline">
            → Upload documents
          </Link>
        </Card>
      )}
    </div>
  );
}
