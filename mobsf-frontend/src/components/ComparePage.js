import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExchangeAlt, FaArrowRight, FaPlusCircle, FaMinusCircle, FaCheckCircle, FaSearch, FaHistory, FaTrash } from 'react-icons/fa';

const API_BASE = "http://localhost:4000/api";

export default function ComparePage() {
    const [reports, setReports] = useState([]);
    const [leftHash, setLeftHash] = useState("");
    const [rightHash, setRightHash] = useState("");
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchReports();
        loadHistory();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`${API_BASE}/reports`);
            if (res.data && res.data.reports) {
                setReports(res.data.reports);
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        }
    };

    const loadHistory = () => {
        const saved = localStorage.getItem('compare_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    };

    const saveToHistory = (left, right, result) => {
        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            leftHash: left,
            rightHash: right,
            summary: {
                new: result.new.length,
                fixed: result.fixed.length,
                common: result.common.length
            }
        };
        const updated = [newEntry, ...history].slice(0, 10); // Keep last 10
        setHistory(updated);
        localStorage.setItem('compare_history', JSON.stringify(updated));
    };

    const deleteHistoryItem = (id) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        localStorage.setItem('compare_history', JSON.stringify(updated));
    };

    const handleCompare = async () => {
        if (!leftHash || !rightHash) return;
        setLoading(true);
        setComparison(null);

        try {
            // Fetch both reports
            const [leftRes, rightRes] = await Promise.all([
                axios.get(`${API_BASE}/report_json/save?hash=${leftHash}`),
                axios.get(`${API_BASE}/report_json/save?hash=${rightHash}`)
            ]);

            const leftData = leftRes.data.data;
            const rightData = rightRes.data.data;

            // Extract findings for comparison
            const extractFindings = (data) => {
                const findings = [];

                // Manifest
                const manifest = data.manifest_analysis || data.Manifest || {};
                const mFindings = manifest.manifest_findings || manifest.findings || [];
                mFindings.forEach(f => findings.push({
                    id: `manifest-${f.title || f.name}`,
                    category: 'Manifest',
                    title: f.title || f.name,
                    severity: f.severity
                }));

                // Code
                const code = data.code_analysis?.findings || {};
                Object.entries(code).forEach(([key, val]) => {
                    findings.push({
                        id: `code-${key}`,
                        category: 'Code',
                        title: val.metadata?.description || key,
                        severity: val.metadata?.severity
                    });
                });

                // Permissions
                const perms = data.permissions || {};
                Object.entries(perms).forEach(([perm, details]) => {
                    const status = details.status || details.level || '';
                    if (/(dangerous|danger)/i.test(status)) {
                        findings.push({
                            id: `perm-${perm}`,
                            category: 'Permission',
                            title: perm,
                            severity: 'high'
                        });
                    }
                });

                return findings;
            };

            const leftFindings = extractFindings(leftData);
            const rightFindings = extractFindings(rightData);

            // Diff Logic
            const leftMap = new Map(leftFindings.map(f => [f.id, f]));
            const rightMap = new Map(rightFindings.map(f => [f.id, f]));

            const newIssues = rightFindings.filter(f => !leftMap.has(f.id));
            const fixedIssues = leftFindings.filter(f => !rightMap.has(f.id));
            const commonIssues = rightFindings.filter(f => leftMap.has(f.id));

            const result = {
                new: newIssues,
                fixed: fixedIssues,
                common: commonIssues,
                leftMeta: { hash: leftHash, count: leftFindings.length },
                rightMeta: { hash: rightHash, count: rightFindings.length }
            };

            setComparison(result);
            saveToHistory(leftHash, rightHash, result);

        } catch (err) {
            console.error("Comparison failed", err);
            alert("Failed to compare reports. Ensure both scans are valid.");
        } finally {
            setLoading(false);
        }
    };

    const loadFromHistory = (item) => {
        setLeftHash(item.leftHash);
        setRightHash(item.rightHash);
        // We re-run comparison to ensure fresh data, or we could save full diff in history (heavy)
        // For now, just setting state and letting user click compare is safer, OR auto-trigger:
        // But auto-trigger requires useEffect or refactoring handleCompare to accept args.
        // Let's just set values and scroll up.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">

            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Scan Comparison</h2>
                <p className="text-slate-500 dark:text-slate-400">Select two scans to visualize progress and regressions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Comparison Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Selectors */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center transition-colors duration-200">

                        <div className="w-full max-w-xs space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Baseline Scan (Old)</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                                value={leftHash}
                                onChange={(e) => setLeftHash(e.target.value)}
                            >
                                <option value="">Select Scan A...</option>
                                {reports.map(r => (
                                    <option key={r.hash} value={r.hash}>{r.hash.substring(0, 8)}... ({new Date(r.jsonUpdated).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-slate-400 dark:text-slate-500 pt-6">
                            <FaArrowRight size={24} />
                        </div>

                        <div className="w-full max-w-xs space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Comparison Scan (New)</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                                value={rightHash}
                                onChange={(e) => setRightHash(e.target.value)}
                            >
                                <option value="">Select Scan B...</option>
                                {reports.map(r => (
                                    <option key={r.hash} value={r.hash}>{r.hash.substring(0, 8)}... ({new Date(r.jsonUpdated).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleCompare}
                                disabled={!leftHash || !rightHash || loading}
                                className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                            >
                                {loading ? 'Comparing...' : <><FaExchangeAlt /> Compare</>}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {comparison && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* FIXED */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl overflow-hidden">
                                <div className="bg-emerald-100/50 dark:bg-emerald-900/30 p-4 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                                        <FaCheckCircle /> Fixed Issues
                                    </h3>
                                    <span className="bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-sm font-bold shadow-sm">
                                        {comparison.fixed.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                                    {comparison.fixed.length === 0 && <p className="text-emerald-600/60 dark:text-emerald-400/60 italic text-sm text-center py-4">No fixed issues.</p>}
                                    {comparison.fixed.map((f, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
                                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">{f.category}</div>
                                            <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">{f.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* NEW */}
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl overflow-hidden">
                                <div className="bg-red-100/50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                                    <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                                        <FaPlusCircle /> New Issues
                                    </h3>
                                    <span className="bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-sm font-bold shadow-sm">
                                        {comparison.new.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                                    {comparison.new.length === 0 && <p className="text-red-600/60 dark:text-red-400/60 italic text-sm text-center py-4">No new issues.</p>}
                                    {comparison.new.map((f, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-red-100/50 dark:border-red-900/30">
                                            <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">{f.category}</div>
                                            <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">{f.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PERSISTENT */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <FaMinusCircle /> Persistent
                                    </h3>
                                    <span className="bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-sm font-bold shadow-sm">
                                        {comparison.common.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                                    {comparison.common.length === 0 && <p className="text-slate-500 dark:text-slate-400 italic text-sm text-center py-4">No persistent issues.</p>}
                                    {comparison.common.map((f, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{f.category}</div>
                                            <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">{f.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Sidebar: History */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200 sticky top-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FaHistory className="text-indigo-500" /> Recent Comparisons
                        </h3>
                        <div className="space-y-3">
                            {history.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">No history yet.</p>
                            )}
                            {history.map(item => (
                                <div key={item.id} className="group p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer relative" onClick={() => loadFromHistory(item)}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 mb-2">
                                        <span className="truncate w-16">{item.leftHash.substring(0, 6)}</span>
                                        <FaArrowRight size={10} className="text-slate-400" />
                                        <span className="truncate w-16">{item.rightHash.substring(0, 6)}</span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                            {item.summary.fixed} Fixed
                                        </span>
                                        <span className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                            {item.summary.new} New
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
