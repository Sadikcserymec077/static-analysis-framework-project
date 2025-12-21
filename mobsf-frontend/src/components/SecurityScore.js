import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const COLORS = {
    high: '#ef4444',   // red-500
    medium: '#f59e0b', // amber-500
    info: '#3b82f6',   // blue-500
    secure: '#10b981', // emerald-500
    empty: '#e2e8f0',  // slate-200
    emptyDark: '#334155' // slate-700
};

export default function SecurityScore({ data }) {
    if (!data) return null;

    // Calculate score (reusing logic from HumanReport)
    const certSummary = data.certificate_analysis?.certificate_summary || {};
    const manifestSummary = data.manifest_analysis?.manifest_summary || data.manifest?.manifest_summary || {};
    const codeSummary = data.code_analysis?.summary || {};
    const networkSummary = data.network_security?.network_summary || {};

    const totalHigh = (certSummary.high || 0) + (manifestSummary.high || 0) + (codeSummary.high || 0) + (networkSummary.high || 0);
    const totalWarning = (certSummary.warning || 0) + (manifestSummary.warning || 0) + (codeSummary.warning || 0) + (networkSummary.warning || 0);
    const totalInfo = (certSummary.info || 0) + (manifestSummary.info || 0) + (codeSummary.info || 0) + (networkSummary.info || 0);
    const totalGood = (certSummary.secure || 0) + (manifestSummary.secure || 0) + (codeSummary.secure || 0) + (networkSummary.secure || 0) + (certSummary.good || 0) + (manifestSummary.good || 0) + (codeSummary.good || 0) + (networkSummary.good || 0);

    const permsObj = data.permissions || data.Permission || data.manifest_permissions || {};
    const dangerousPermsCount = Object.values(permsObj).filter(v => {
        const s = typeof v === 'string' ? v : (v.status || v.level || v.risk || v.description || '');
        return /(dangerous|danger|privileged|critical)/i.test(s);
    }).length;

    let score = data.security_score || data.securityScore || data.appsec?.security_score;
    if (score === undefined || score === null) {
        const effectiveHigh = totalHigh + dangerousPermsCount;
        const totalItems = effectiveHigh + totalWarning + totalInfo;
        const weightedPenalty = effectiveHigh * 10 + totalWarning * 5 + totalInfo * 1 - totalGood * 3;
        if (totalItems === 0) score = 100;
        else score = Math.max(0, Math.min(100, 100 - weightedPenalty));
        // ... (simplified heuristic for display)
        if (effectiveHigh > 5) score = Math.min(score, 40);
    }
    score = Math.round(score);

    const chartData = [
        { name: 'High', value: totalHigh, color: COLORS.high },
        { name: 'Medium', value: totalWarning, color: COLORS.medium },
        { name: 'Info', value: totalInfo, color: COLORS.info },
        { name: 'Secure', value: totalGood, color: COLORS.secure },
    ].filter(d => d.value > 0);

    if (chartData.length === 0) chartData.push({ name: 'No Issues', value: 1, color: COLORS.empty });

    const getVerdict = () => {
        if (score >= 80) return { text: 'Safe to Install', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: FaCheckCircle, border: 'border-emerald-200 dark:border-emerald-800' };
        if (score >= 50) return { text: 'Install with Caution', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: FaExclamationTriangle, border: 'border-amber-200 dark:border-amber-800' };
        return { text: 'Not Recommended', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: FaTimesCircle, border: 'border-red-200 dark:border-red-800' };
    };

    const verdict = getVerdict();
    const VerdictIcon = verdict.icon;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col transition-colors duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FaShieldAlt className="text-primary" /> Security Score
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${verdict.bg} ${verdict.color} ${verdict.border}`}>
                    <VerdictIcon /> {verdict.text}
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={75}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${verdict.color}`}>{score}</span>
                        <span className="text-xs text-slate-400 uppercase font-medium">Score</span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High Risk
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">{totalHigh}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Risk
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">{totalWarning}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Info / Low
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">{totalInfo}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Dangerous Permissions</span>
                            <span className="font-mono font-medium text-red-500 dark:text-red-400">{dangerousPermsCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
