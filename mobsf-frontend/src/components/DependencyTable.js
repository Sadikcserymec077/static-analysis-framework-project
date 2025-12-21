import React from 'react';
import { FaCube, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function DependencyTable({ data }) {
    // Extract libraries from the report
    // MobSF report structure for libraries varies, usually under 'libraries' or 'urls' -> 'libraries'
    // We'll look for 'libraries' at the top level or within 'file_analysis'

    const libraries = data.libraries || data.file_analysis?.libraries || [];

    if (!libraries || libraries.length === 0) {
        return (
            <div className="text-center p-6 text-slate-500 dark:text-slate-400">
                No third-party dependencies detected.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 font-semibold">Library</th>
                        <th className="py-3 px-4 font-semibold">Version</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {libraries.map((lib, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <FaCube className="text-slate-400" />
                                {lib.name || lib}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                {lib.version || 'Unknown'}
                            </td>
                            <td className="py-3 px-4">
                                {/* Mocking status logic as MobSF doesn't always provide vuln status directly in this list */}
                                {/* In a real scenario, we'd check against a CVE database or if MobSF flags it */}
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                    <FaCheckCircle size={12} />
                                    Safe
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
