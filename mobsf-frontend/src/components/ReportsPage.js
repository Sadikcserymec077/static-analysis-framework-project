import React, { useState } from "react";
import ScansCard from "./ScansCard";
import ReportPanel from "./ReportPanel";
import { FaArrowLeft } from "react-icons/fa";

export default function ReportsPage({ refreshKey }) {
  // view: "list" = show only recent scans, "detail" = show only report
  const [view, setView] = useState("list");
  const [selectedHash, setSelectedHash] = useState(null);

  const handleSelectScan = (scan) => {
    const hash = scan.MD5 || scan.hash || scan.md5;
    if (!hash) return;
    setSelectedHash(hash);
    setView("detail"); // override scan list and show full report
  };

  const handleBackToList = () => {
    setView("list");
    // keep selectedHash if you want user to be able to reopen quickly
    // or setSelectedHash(null) to clear selection
  };

  return (
    <div className="w-full">
      {view === "detail" && (
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <FaArrowLeft />
            Back to Recent Scans
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ScansCard onSelect={handleSelectScan} refreshKey={refreshKey} />
        </div>
      )}

      {view === "detail" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {selectedHash ? (
            <ReportPanel hash={selectedHash} />
          ) : (
            <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors duration-200">
              <p className="text-slate-500 dark:text-slate-400">No scan selected.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
