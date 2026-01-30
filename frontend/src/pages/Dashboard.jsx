import React from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import api from "../api";

const translations = {
  en: {
    dashboard: "Dashboard",
    subtitle: "Document Management System",
    overview: "Overview",
    documents: "Documents",
    pending: "Pending",
    duplicates: "Duplicates",
    recentDocuments: "Recent Documents",
    vendor: "Vendor",
    amount: "Amount",
    processing: "Processing...",
    quickActions: "Quick Actions",
    uploadDocument: "Upload Document",
    viewApprovals: "View Approvals",
    reports: "Reports",
    aiInsights: "AI Insights",
    language: "Language",
    approved: "Approved",
    rejected: "Rejected",
    invoiceNo: "Invoice #",
    date: "Date",
    vat: "VAT",
    duplicate: "Duplicate",
    step: "Step",
    viewDetails: "View details",
    uploaded: "Uploaded",
  },
  af: {
    dashboard: "Dashboard",
    subtitle: "Dokumentbestuurstelsel",
    overview: "Oorsig",
    documents: "Dokumente",
    pending: "Hangend",
    duplicates: "Duplikate",
    recentDocuments: "Onlangse Dokumente",
    vendor: "Verskaffer",
    amount: "Bedrag",
    processing: "Verwerk...",
    quickActions: "Vinnige Aksies",
    uploadDocument: "Laai Dokument Op",
    viewApprovals: "Bekyk Goedkeurings",
    reports: "Verslae",
    aiInsights: "KI-insigte",
    language: "Taal",
    approved: "Goedkeur",
    rejected: "Afgekeur",
    invoiceNo: "Faktuur #",
    date: "Datum",
    vat: "BTW",
    duplicate: "Duplikaat",
    step: "Stap",
    viewDetails: "Bekyk besonderhede",
    uploaded: "Opgelaai",
  },
  zu: {
    dashboard: "Ideshibhodi",
    subtitle: "Uhlelo Lokuphatha Amadokhumenti",
    overview: "Umbono",
    documents: "Amadokhumenti",
    pending: "Alindile",
    duplicates: "Amakhophi",
    recentDocuments: "Amadokhumenti Asanda Kuvela",
    vendor: "Umthengisi",
    amount: "Inani",
    processing: "Iyacubungula...",
    quickActions: "Izenzo Eisheshayo",
    uploadDocument: "Layisha Idokhumenti",
    viewApprovals: "Buka Ukuvunyelwa",
    reports: "Imibiko",
    aiInsights: "Ukubona kwe-AI",
    language: "Ulimi",
    approved: "Kuvunyelwe",
    rejected: "Kwaliwe",
    invoiceNo: "I-Invoyisi #",
    date: "Usuku",
    vat: "I-VAT",
    duplicate: "Ikhophi",
    step: "Isigaba",
    viewDetails: "Buka imininingwane",
    uploaded: "Ilayishiwe",
  },
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "af", label: "Afrikaans" },
  { value: "zu", label: "isiZulu" },
];

export default function Dashboard() {
  const [docs, setDocs] = React.useState([]);
  const [lang, setLang] = React.useState(() => localStorage.getItem("dms_lang") || "en");

  const t = translations[lang] || translations.en;

  React.useEffect(() => {
    localStorage.setItem("dms_lang", lang);
  }, [lang]);

  const fetchDocuments = () => {
    api.get("/documents").then(res => setDocs(res.data)).catch(() => {});
  };

  React.useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel = (status) => (status === "approved" ? t.approved : status === "rejected" ? t.rejected : t.pending);

  return (
    <div className="relative min-h-[60vh] space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{t.dashboard}</h1>
        <p className="text-slate-500 mt-1">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title={t.overview}>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-slate-600">{t.documents}</span><strong className="text-slate-800">{docs.length}</strong></div>
            <div className="flex justify-between"><span className="text-slate-600">{t.pending}</span><strong className="text-slate-800">{docs.filter(d => d.status === "pending").length}</strong></div>
            <div className="flex justify-between"><span className="text-slate-600">{t.duplicates}</span><strong className="text-slate-800">{docs.filter(d => d.is_duplicate).length}</strong></div>
          </div>
        </Card>

        <Card title={t.recentDocuments}>
          <ul className="space-y-4">
            {docs.slice(0, 5).map(d => (
              <li key={d.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="font-medium text-slate-800 truncate min-w-0">{d.filename}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${d.status === "approved" ? "bg-green-100 text-green-700" : d.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel(d.status)}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-sm text-slate-600">
                  {d.vendor && <div><span className="text-slate-500">{t.vendor}:</span> <span className="font-medium text-slate-700">{d.vendor}</span></div>}
                  {d.invoice_number && <div><span className="text-slate-500">{t.invoiceNo}:</span> <span className="text-slate-700">{d.invoice_number}</span></div>}
                  {d.date && <div><span className="text-slate-500">{t.date}:</span> <span className="text-slate-700">{new Date(d.date).toLocaleDateString()}</span></div>}
                  {d.amount != null && <div><span className="text-slate-500">{t.amount}:</span> <span className="font-semibold text-slate-800">${d.amount.toFixed(2)}</span></div>}
                  {d.vat != null && d.vat > 0 && <div><span className="text-slate-500">{t.vat}:</span> <span className="text-slate-700">${d.vat.toFixed(2)}</span></div>}
                  {!d.vendor && !d.amount && !d.invoice_number && <div className="text-xs text-slate-400 italic">{t.processing}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {d.is_duplicate && <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600">{t.duplicate}</span>}
                  <span className="text-xs text-slate-400">{t.step} {d.current_step}/3</span>
                  <span className="text-xs text-slate-400">{t.uploaded} {new Date(d.created_at).toLocaleDateString()}</span>
                  <Link to={`/documents/${d.id}`} className="text-xs text-teal-600 font-medium hover:underline ml-auto">{t.viewDetails} →</Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t.quickActions}>
          <div className="flex flex-col gap-2">
            <Link to="/upload" className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-center transition-colors">{t.uploadDocument}</Link>
            <Link to="/approvals" className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-center transition-colors">{t.viewApprovals}</Link>
            <Link to="/reports" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition-colors">{t.reports}</Link>
            <Link to="/insights" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg text-center transition-colors">{t.aiInsights}</Link>
          </div>
        </Card>
      </div>

      {/* Language option - bottom right corner */}
      <div className="absolute bottom-0 right-0 flex items-center gap-2 pt-2">
        <span className="text-sm text-slate-500">{t.language}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
