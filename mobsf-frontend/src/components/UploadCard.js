// src/components/UploadCard.js
import React, { useState, useRef, useEffect } from "react";
import { Card, Button, ProgressBar, Badge } from "react-bootstrap";
import {
  uploadFile,
  triggerScan,
  getScanLogs,
  saveJsonReport,
  getReportJSON,
} from "../api";

export default function UploadCard({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState(null);
  const pollRef = useRef(null);
  const errorCountRef = useRef(0);
  const backoffRef = useRef(5000);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const chosen = e.target.files?.[0];
    setFile(chosen || null);
    setMessage("");
    setProgress(0);
    setHash(null);
    if (!chosen) setStatus("idle");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setMessage("");
      setProgress(0);
      setHash(null);
      setStatus("idle");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const startPolling = (h) => {
    if (pollRef.current) clearInterval(pollRef.current);
    errorCountRef.current = 0;
    backoffRef.current = 5000;

    const readyKeywords = [
      "generating report",
      "generation complete",
      "completed",
      "finished",
      "saving to database",
      "saved to database",
      "report generated",
      "saving results",
      "saving to db",
    ];

    async function pollOnce() {
      try {
        const r = await getScanLogs(h);
        const logs = r.data.logs || [];
        const joined = JSON.stringify(logs).toLowerCase();

        const isReady = readyKeywords.some((k) => joined.includes(k));
        if (isReady) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus("ready");
          setMessage("Scan complete.");
          try {
            await saveJsonReport(h);
          } catch (e) {
            console.error("saveJsonReport error", e?.response?.data || e?.message || e);
          }
          onUploaded && onUploaded({ hash: h }); // tell App that scan finished
          return;
        }

        try {
          const probe = await getReportJSON(h);
          if (probe?.status === 200 && probe?.data) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setStatus("ready");
            setMessage("Scan complete.");
            try {
              await saveJsonReport(h);
            } catch (e) {
              console.error("saveJsonReport error", e);
            }
            onUploaded && onUploaded({ hash: h });
            return;
          }
        } catch (probeErr) {
          // ignore
        }

        setStatus("scanning");
        const last = logs.length ? logs[logs.length - 1] : null;
        if (last && last.status)
          setMessage(`${last.timestamp || ""} — ${last.status}`);
        else setMessage("Scanning... (waiting for logs)");
        errorCountRef.current = 0;
        backoffRef.current = 5000;
      } catch (err) {
        console.error(
          "scan_logs polling error:",
          err?.response?.status,
          err?.response?.data || err?.message || err
        );
        try {
          const probe = await getReportJSON(h);
          if (probe?.status === 200 && probe?.data) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setStatus("ready");
            setMessage("Scan complete.");
            try {
              await saveJsonReport(h);
            } catch (e) {
              console.error("saveJsonReport error", e);
            }
            onUploaded && onUploaded({ hash: h });
            return;
          }
        } catch (probeErr) {
          console.warn(
            "report_json probe failed:",
            probeErr?.response?.data || probeErr?.message || probeErr
          );
        }

        errorCountRef.current += 1;
        if (errorCountRef.current >= 6) {
          setMessage(
            "Temporary connection problems fetching logs. Will keep checking in background."
          );
        } else {
          setMessage("Polling logs... (temporary error, retrying)");
        }
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = setInterval(pollOnce, backoffRef.current);
          backoffRef.current = Math.min(backoffRef.current * 1.8, 60000);
        }
      }
    }

    pollOnce();
    pollRef.current = setInterval(pollOnce, backoffRef.current);
  };

  const handleUpload = async () => {
    if (!file) return setMessage("Choose an APK first.");
    setStatus("uploading");
    setProgress(2);
    setMessage("Uploading...");
    try {
      const res = await uploadFile(file, (pe) =>
        setProgress(Math.round((pe.loaded * 100) / pe.total))
      );
      const h = res.data.hash || res.data.MD5 || res.data.md5;
      setHash(h);
      setStatus("uploaded");
      setMessage("Uploaded — hash: " + h);
      setStatus("scanning");
      await triggerScan(h);
      setMessage("Scan triggered — polling logs...");
      startPolling(h);
    } catch (err) {
      console.error(
        "upload error:",
        err?.response?.status,
        err?.response?.data || err?.message || err
      );
      setStatus("error");
      const errMsg =
        err?.response?.data?.error || err?.message || "Upload failed";
      setMessage(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setMessage("");
    setHash(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusVariant =
    status === "ready"
      ? "success"
      : status === "error"
      ? "danger"
      : status === "scanning" || status === "uploading"
      ? "info"
      : "secondary";

  return (
    <Card className="saf-upload-card shadow-lg">
      <Card.Body>
        {/* Header line */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="saf-upload-icon">
              <i className="bi bi-cloud-arrow-up-fill" />
            </span>
            <div>
              <Card.Title className="mb-0 saf-upload-title">
                Upload &amp; Analyze APK
              </Card.Title>
            </div>
          </div>
          <div className="saf-status-pill">
            <span className="me-1 text-muted">Status:</span>
            <Badge bg={statusVariant} pill>
              {status || "idle"}
            </Badge>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="saf-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="saf-dropzone-folder">
            <i className="bi bi-folder-fill" />
          </div>
          <div className="saf-dropzone-text-main">
            Drag &amp; Drop or Click to Select
          </div>
          <div className="saf-dropzone-text-sub">
            Supports: <code>.apk</code>, <code>.xapk</code>,{" "}
            <code>.apks</code> files
          </div>
          <div className="saf-dropzone-tip">
            💡 Tip: Hold <strong>Ctrl/Cmd</strong> to select multiple files
            (first one will be scanned).
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,.zip,.xapk,.apks"
            onChange={handleChange}
            className="d-none"
          />
          {file && (
            <div className="mt-2 small text-muted">
              Selected: <strong>{file.name}</strong>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div>
            <Button
              variant="primary"
              className="saf-primary-btn"
              onClick={handleUpload}
              disabled={!file || status === "uploading" || status === "scanning"}
            >
              <span className="me-1">🚀</span>
              {status === "uploading" ? "Uploading…" : "Upload & Analyze"}
            </Button>
          </div>
          <Button variant="outline-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1" />
            Reset
          </Button>
        </div>

        {/* Progress + message */}
        <div className="mt-3">
          <ProgressBar
            now={progress}
            label={progress > 0 ? `${progress}%` : ""}
            animated={status === "uploading" || status === "scanning"}
          />
          <div className="mt-2 text-break small" style={{ whiteSpace: "pre-wrap" }}>
            {message}
          </div>
          {hash && (
            <div className="small text-muted mt-1">
              Hash: <code>{hash}</code>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
