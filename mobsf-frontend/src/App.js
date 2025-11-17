// src/App.js
import React, { useState } from "react";
import NavBar from "./components/NavBar";
import UploadCard from "./components/UploadCard";
import ReportPanel from "./components/ReportPanel";
import ReportsPage from "./components/ReportsPage";
import "./App.css";

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
    <div className="saf-app">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="saf-main">
        {/* DASHBOARD: upload + (optionally) latest report */}
        {activeTab === "dashboard" && (
          <div className="container saf-main-container">
            {!latestHash ? (
              <div className="row justify-content-center">
                <div className="col-xl-8 col-lg-9 col-md-10">
                  <UploadCard onUploaded={handleUploaded} />
                </div>
              </div>
            ) : (
              <>
                <div className="row mb-3">
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Latest Scan Report</h5>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setLatestHash(null)}
                    >
                      <i className="bi bi-arrow-left-short me-1" />
                      Upload another APK
                    </button>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <ReportPanel hash={latestHash} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* REPORTS: recent scans + full ReportPanel for selected APK */}
        {activeTab === "reports" && (
          <ReportsPage refreshKey={scansRefreshKey} />
        )}
      </main>
    </div>
  );
}

export default App;
