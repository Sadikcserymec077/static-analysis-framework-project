// src/components/ReportsPage.js
import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import ScansCard from "./ScansCard";
import ReportPanel from "./ReportPanel";

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
    <div className="container saf-main-container">
      <div className="row mb-3">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Reports</h5>

          {view === "detail" && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={handleBackToList}
            >
              <i className="bi bi-arrow-left-short me-1" />
              Back to Recent Scans
            </Button>
          )}
        </div>
      </div>

      {view === "list" && (
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-8 col-sm-10 col-12">
            {/* ONLY recent scans list */}
            <ScansCard onSelect={handleSelectScan} refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {view === "detail" && (
        <div className="row">
          <div className="col-12">
            {selectedHash ? (
              // FULL report panel (summary + PDF preview/download)
              <ReportPanel hash={selectedHash} />
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="text-muted">
                    No scan selected. Click{" "}
                    <strong>Back to Recent Scans</strong> and choose an APK.
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
