import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import MamboChat from "./components/MamboChat";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
      <footer className="mt-auto py-4 px-6 border-t border-slate-200 bg-white text-center text-sm text-slate-500">
        Created and developed by <strong className="text-slate-700">Mampotje Mabusela</strong>
      </footer>
      <MamboChat />
    </div>
  );
}
