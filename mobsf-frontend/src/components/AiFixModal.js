import React, { useState, useEffect } from 'react';
import { FaRobot, FaTimes, FaMagic, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const API_BASE = "http://localhost:4000/api";

export default function AiFixModal({ isOpen, onClose, finding }) {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && finding) {
            fetchExplanation();
        } else {
            setResponse(null);
            setError(null);
        }
    }, [isOpen, finding]);

    const fetchExplanation = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use the finding title or description as the query
            const query = finding.title || finding.description;
            const res = await axios.post(`${API_BASE}/ai/explain`, { query });
            setResponse(res.data);
        } catch (err) {
            setError("Failed to get AI explanation. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FaRobot size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">AI Security Assistant</h3>
                            <p className="text-xs text-indigo-100">Powered by Local Expert System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-white dark:bg-slate-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                            <p className="text-slate-500 dark:text-slate-400 animate-pulse">Analyzing vulnerability...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
                            <FaExclamationTriangle />
                            {error}
                        </div>
                    ) : response ? (
                        <div className="space-y-6">

                            {/* Context */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Analyzing</h4>
                                <p className="font-medium text-slate-800 dark:text-white">{finding?.title}</p>
                            </div>

                            {/* Risk Analysis */}
                            <div>
                                <h4 className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2">
                                    <FaExclamationTriangle /> Why is this dangerous?
                                </h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{response.risk}</p>
                            </div>

                            {/* Fix */}
                            <div>
                                <h4 className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                                    <FaMagic /> Recommended Fix
                                </h4>
                                <div className="prose prose-sm max-w-none bg-slate-900 rounded-lg p-4 text-slate-300 overflow-x-auto">
                                    <pre className="whitespace-pre-wrap font-mono text-sm">
                                        {/* Simple markdown rendering for code blocks */}
                                        {response.fix.split('```').map((part, i) => {
                                            if (i % 2 === 1) {
                                                // Code block
                                                const [lang, ...code] = part.split('\n');
                                                return (
                                                    <code key={i} className="block bg-black/30 p-2 rounded my-2 text-emerald-400">
                                                        {code.join('\n')}
                                                    </code>
                                                );
                                            }
                                            // Text
                                            return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />;
                                        })}
                                    </pre>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium shadow-sm shadow-indigo-200 dark:shadow-none"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
}
