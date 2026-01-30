import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
