import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { FaChartLine, FaShieldAlt, FaBug, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE = "http://localhost:4000/api";

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`${API_BASE}/analytics`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading analytics...</div>;
    if (!data) return <div className="p-12 text-center text-slate-500 dark:text-slate-400">No data available.</div>;

    const severityData = [
        { name: 'High', value: data.severityCounts.high },
        { name: 'Medium', value: data.severityCounts.medium },
        { name: 'Info', value: data.severityCounts.info },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Security Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Overview of your application security posture.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors duration-200">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <FaShieldAlt size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Score</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{data.avgScore}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors duration-200">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <FaChartLine size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Scans</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalScans}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Score Trend */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Security Score Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.recentScores}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Severity Distribution */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Vulnerability Severity</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Top Vulnerabilities */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <FaExclamationTriangle className="text-amber-500" />
                    Top 5 Common Vulnerabilities
                </h3>
                <div className="space-y-4">
                    {data.topVulnerabilities.map((vuln, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                    {i + 1}
                                </span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{vuln.name}</span>
                            </div>
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                {vuln.count} occurrences
                            </span>
                        </div>
                    ))}
                    {data.topVulnerabilities.length === 0 && (
                        <div className="text-center text-slate-500 dark:text-slate-400 italic py-4">No vulnerabilities found yet.</div>
                    )}
                </div>
            </div>

        </div>
    );
}
