import React, { useState, useEffect } from "react";
import { savePdfReport, saveJsonReport, getReportJSON } from "../api";
import HumanReport from "./HumanReport";
import AppDetailsCard from "./AppDetailsCard";
import SecurityScore from "./SecurityScore";
import DependencyTable from "./DependencyTable";
import { FaFilePdf, FaDownload, FaEye, FaSpinner, FaFileCsv, FaFileCode, FaCubes } from "react-icons/fa";
import { downloadCSV } from "../utils/exportUtils";

export default function ReportPanel({ hash, initialJsonPath }) {
  const [report, setReport] = useState(null);
  const [jsonPath, setJsonPath] = useState(initialJsonPath || null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [msg, setMsg] = useState("");
  const [viewMode, setViewMode] = useState("none"); // 'none' | 'json' | 'pdf'

  useEffect(() => {
    // Reset when hash changes
    setReport(null);
    setJsonPath(initialJsonPath || null);
    setPdfUrl(null);
    setMsg("");
    setViewMode("none");

    if (!hash) return;

    // Auto-load saved JSON report when a new hash is selected
    (async () => {
      setLoading(true);
      setMsg("Loading report...");
      try {
        const r = await saveJsonReport(hash);
        const payload = r.data.data || r.data;
        setReport(payload);
        setJsonPath(r.data.path || `/reports/json/${hash}`);
        setViewMode("json");
        setMsg("");
      } catch (e) {
        // fallback to GET proxy
        try {
          const r2 = await getReportJSON(hash);
          setReport(r2.data);
          setViewMode("json");
          setMsg("");
        } catch (e2) {
          setMsg("Failed to load report JSON: " + (e2?.response?.data || e2?.message || e?.message));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [hash, initialJsonPath]);

  const handleShowSummary = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    if (report) {
      setViewMode("json");
      return;
    }
    setLoading(true);
    setMsg("Loading summary...");
    try {
      const r = await saveJsonReport(hash);
      const payload = r.data.data || r.data;
      setReport(payload);
      setJsonPath(r.data.path || `/reports/json/${hash}`);
      setViewMode("json");
      setMsg("");
    } catch (e) {
      try {
        const r2 = await getReportJSON(hash);
        setReport(r2.data);
        setViewMode("json");
        setMsg("");
      } catch (e2) {
        setMsg("Failed to load summary: " + (e2?.response?.data || e2?.message || e?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    setLoading(true); setMsg("Fetching PDF...");
    try {
      const r = await savePdfReport(hash); // blob
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setViewMode("pdf");
      setMsg("PDF preview loaded below.");
    } catch (e) {
      setMsg("PDF fetch failed: " + (e?.response?.data || e?.message));
    } finally { setLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    setMsg("Preparing PDF for download...");
    try {
      const r = await savePdfReport(hash);
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${hash}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg("Download started.");
    } catch (e) {
      setMsg("Download failed: " + (e?.response?.data || e?.message));
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    downloadCSV(report, `scan_report_${hash}`);
  };



  const closePdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setViewMode("json"); // Go back to summary
  };

  if (!hash) {
    return (
      <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors duration-200">
        <p className="text-slate-500 dark:text-slate-400">Select a scan to view the report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Scan Report</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">MD5: {hash}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShowSummary}
            disabled={loading || viewMode === 'json'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'json' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FaEye /> Summary
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <button
            onClick={handleExportCSV}
            disabled={!report}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Export as CSV"
          >
            <FaFileCsv className="text-emerald-600 dark:text-emerald-400" /> CSV
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <button
            onClick={handlePreviewPDF}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'pdf' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FaFilePdf /> Preview PDF
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FaDownload /> Download PDF
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
          {loading && <FaSpinner className="animate-spin" />}
          {msg}
        </div>
      )}

      {loading && !report && (
        <div className="flex justify-center py-12">
          <FaSpinner className="animate-spin text-primary text-4xl" />
        </div>
      )}

      {/* Report Content */}
      {viewMode === 'json' && report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Section: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-full">
              <AppDetailsCard data={report} />
            </div>
            <div className="h-full">
              <SecurityScore data={report} />
            </div>
          </div>

          {/* Bottom Section: Findings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-200">
            <HumanReport data={report} />
          </div>

          {/* Dependencies Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FaCubes className="text-indigo-500" />
              Third-Party Dependencies
            </h3>
            <DependencyTable data={report} />
          </div>
        </div>
      )}

      {viewMode === 'pdf' && pdfUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in duration-300 transition-colors duration-200">
          <div className="flex justify-end mb-4">
            <button onClick={closePdf} className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">Close PDF Preview</button>
          </div>
          <iframe
            title="report-pdf"
            src={pdfUrl}
            className="w-full h-[800px] rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}
    </div>
  );
}
