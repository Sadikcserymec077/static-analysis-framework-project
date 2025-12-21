import React, { useState } from "react";
import Layout from "./components/Layout";
import UploadCard from "./components/UploadCard";
import ReportPanel from "./components/ReportPanel";
import ReportsPage from "./components/ReportsPage";

import { FaArrowLeft } from "react-icons/fa";
import "./App.css";

import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [latestHash, setLatestHash] = useState(null);
  const [scansRefreshKey, setScansRefreshKey] = useState(0);

  // called by UploadCard when a scan finishes
  const handleUploaded = ({ hash }) => {
    setLatestHash(hash);
    setScansRefreshKey((k) => k + 1); // so Reports page refreshes list
  };

  return (
    <ThemeProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {/* DASHBOARD: upload + (optionally) latest report */}
        {activeTab === "dashboard" && (
          <div className="w-full">
            {!latestHash ? (
              <div className="flex justify-center">
                <div className="w-full max-w-3xl">
                  <UploadCard onUploaded={handleUploaded} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Latest Scan Report</h2>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setLatestHash(null)}
                  >
                    <FaArrowLeft />
                    Upload another APK
                  </button>
                </div>
                <div className="w-full">
                  <ReportPanel hash={latestHash} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS: recent scans + full ReportPanel for selected APK */}
        {activeTab === "reports" && (
          <ReportsPage refreshKey={scansRefreshKey} />
        )}


      </Layout>
    </ThemeProvider>
  );
}

export default App;
