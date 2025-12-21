import React, { useState } from 'react';
import { FaAndroid, FaBox, FaCodeBranch, FaFingerprint, FaRuler, FaFileCode, FaTimes, FaSpinner } from 'react-icons/fa';
import { getManifest } from '../api';

export default function AppDetailsCard({ data }) {
    const [showModal, setShowModal] = useState(false);
    const [manifestContent, setManifestContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!data) return null;

    const appName = data.app_name || data.APP_NAME || data.file_name || "(unknown)";
    const packageName = data.package_name || data.PACKAGE_NAME || "(unknown)";
    const versionName = data.version_name || data.VERSION_NAME || "-";
    const versionCode = data.version_code || data.VERSION_CODE || "-";
    const size = data.size || data.file_size || data.apk_size || "unknown";
    const md5 = data.md5 || data.MD5 || "-";
    const targetSdk = data.target_sdk || data.TargetSdkVersion || "-";
    const minSdk = data.min_sdk || data.MinSdkVersion || "-";

    const details = [
        { label: 'Package', value: packageName, icon: FaBox },
        { label: 'Version', value: `${versionName} (${versionCode})`, icon: FaCodeBranch },
        { label: 'Size', value: size, icon: FaRuler },
        { label: 'SDK Target/Min', value: `${targetSdk} / ${minSdk}`, icon: FaAndroid },
        { label: 'MD5', value: md5, icon: FaFingerprint, mono: true },
    ];

    const handleViewManifest = async () => {
        if (manifestContent) {
            setShowModal(true);
            return;
        }

        setLoading(true);
        setError(null);
        setShowModal(true);

        try {
            const res = await getManifest(md5);
            // MobSF returns { content: "xml string", ... } or just the string depending on endpoint
            // Based on server.js proxy, it returns res.data. 
            // Let's assume res.data is the object returned by MobSF.
            // If MobSF returns raw text, axios might parse it or keep it as string.
            // Usually MobSF /api/v1/manifest_view returns JSON: { "content": "..." } or similar.
            // Let's handle both.
            const content = typeof res.data === 'object' ? (res.data.content || JSON.stringify(res.data, null, 2)) : res.data;
            setManifestContent(content);
        } catch (err) {
            console.error("Manifest fetch failed", err);
            // Fallback to parsed analysis if available
            if (data.manifest_analysis || data.Manifest) {
                const analysis = data.manifest_analysis || data.Manifest;
                setManifestContent("// Raw XML not available. Showing parsed analysis:\n" + JSON.stringify(analysis, null, 2));
            } else {
                const errData = err.response?.data?.error || err.message;
                const errMsg = typeof errData === 'object' ? JSON.stringify(errData) : errData;
                setError("Failed to load manifest. " + errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col transition-colors duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <FaAndroid size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{appName}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Application Details</p>
                        </div>
                    </div>
                    <button
                        onClick={handleViewManifest}
                        className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                        title="View AndroidManifest.xml"
                    >
                        <FaFileCode size={18} />
                    </button>
                </div>

                <div className="p-4 flex-1">
                    <div className="space-y-3">
                        {details.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <div className="mt-1 text-slate-400 dark:text-slate-500">
                                    <item.icon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
                                        {item.label}
                                    </p>
                                    <p className={`text-sm text-slate-700 dark:text-slate-200 truncate ${item.mono ? 'font-mono text-xs' : 'font-medium'}`} title={item.value}>
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Manifest Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FaFileCode className="text-indigo-600 dark:text-indigo-400" />
                                AndroidManifest.xml
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0 bg-slate-900 text-slate-300 font-mono text-sm relative">
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FaSpinner className="animate-spin text-indigo-500 text-3xl" />
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center text-red-400">
                                    <p>{error}</p>
                                </div>
                            ) : (
                                <pre className="p-4">{manifestContent}</pre>
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
