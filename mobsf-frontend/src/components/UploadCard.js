import React, { useState, useRef, useEffect } from "react";
import {
  FaAndroid,
  FaCloudUploadAlt,
  FaFile,
  FaShieldAlt,
  FaInfoCircle,
  FaSpinner,
  FaListAlt,
  FaTimesCircle
} from "react-icons/fa";
import {
  uploadFile,
  triggerScan,
  getScanLogs,
  saveJsonReport,
  getReportJSON,
} from "../api";
import LogsModal from "./LogsModal";
import CircularProgress from "./CircularProgress";

export default function UploadCard({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, uploading, uploaded, scanning, ready, error
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

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
    handleFileSelection(chosen);
  };

  const handleFileSelection = (chosen) => {
    setFile(chosen || null);
    setMessage("");
    setProgress(0);
    setHash(null);
    setLogs([]);
    if (!chosen) setStatus("idle");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleFileSelection(dropped);
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
      "Saving to Database",
      "saved to database",
      "report generated",
      "saving results",
      "saving to db",
      "pdf saved",
      "report saved",
    ];

    async function pollOnce() {
      let logsFound = false;
      try {
        const r = await getScanLogs(h);
        const newLogs = r.data.logs || [];
        console.log("Polling logs:", newLogs);
        setLogs(newLogs);
        logsFound = true;
        const joined = JSON.stringify(newLogs).toLowerCase();

        const isReady = readyKeywords.some((k) => joined.includes(k.toLowerCase()));
        if (isReady) {
          finishScan();
          return;
        }

        setStatus("scanning");
        const last = newLogs.length ? newLogs[newLogs.length - 1] : null;
        if (last && last.status)
          setMessage(`${last.status}`);
        else
          setMessage("Scanning... (waiting for logs)");

        errorCountRef.current = 0;
        backoffRef.current = 5000;
      } catch (err) {
        console.error("scan_logs polling error:", err);
        if (!logsFound) {
          setMessage(`Polling logs failed: ${err.message || "Network Error"}. Retrying...`);
        }
      }

      // Always try to check if report is ready via getReportJSON, even if logs fail
      try {
        const probe = await getReportJSON(h);
        if (probe?.status === 200 && probe?.data) {
          finishScan();
          return;
        }
      } catch (probeErr) {
        // ignore probe error
      }

      // Schedule next poll
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = setInterval(pollOnce, backoffRef.current);
        // Only increase backoff if we actually had an error
        if (!logsFound) {
          backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
        }
      }
    }

    async function finishScan() {
      if (!pollRef.current) return; // already finished
      clearInterval(pollRef.current);
      pollRef.current = null;
      setStatus("ready");
      setMessage("Scan complete.");
      try {
        await saveJsonReport(h);
      } catch (e) {
        console.error("saveJsonReport error", e?.response?.data || e?.message || e);
      }
      onUploaded && onUploaded({ hash: h });
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
      console.error("upload error:", err);
      setStatus("error");
      const errMsg = err?.response?.data?.error || err?.message || "Upload failed";
      setMessage(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setMessage("");
    setHash(null);
    setStatus("idle");
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };



  return (
    <div className="w-full">
      <LogsModal show={showLogs} onHide={() => setShowLogs(false)} logs={logs} />

      {/* Main Upload Card */}
      <div className="w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FaAndroid className="text-primary" size={24} />
              Upload & Analyze APK
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Upload your Android application package (.apk) for static security analysis.
            </p>
          </div>

          <div className="p-6">
            {/* Upload/Dropzone Area */}
            {(status === 'idle' || status === 'ready' || status === 'error') ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${file
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".apk,.zip,.xapk,.apks"
                  onChange={handleChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                      <FaFile size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white break-all max-w-md">
                      {file.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <FaTimesCircle /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <FaCloudUploadAlt size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                      Drop your APK here
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      or click to browse files
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                      <FaInfoCircle size={12} />
                      Only .apk files are supported
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Progress / Scanning State
              <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                {status === 'uploading' ? (
                  <CircularProgress percentage={progress} size={140} />
                ) : (
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <FaShieldAlt className="text-primary animate-pulse" size={40} />
                  </div>
                )}

                <h3 className="mt-6 text-xl font-bold text-slate-800 dark:text-white">
                  {status === 'uploading' ? 'Uploading APK...' : 'Analyzing Security...'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  {message || "Please wait while we process your application."}
                </p>

                {status === 'scanning' && (
                  <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 w-full max-w-md">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span>Analysis Log</span>
                      <button onClick={() => setShowLogs(true)} className="text-primary hover:underline">View Full Logs</button>
                    </div>
                    <div className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">
                      {logs.length > 0 ? logs[logs.length - 1].status : "Initializing scanner..."}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons (Only show when idle/ready/error) */}
            {(status === 'idle' || status === 'ready' || status === 'error') && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className={`
                    px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all flex items-center gap-2
                    ${!file
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 hover:shadow-md active:scale-95'
                    }
                  `}
                >
                  <FaShieldAlt /> Upload & Analyze
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
