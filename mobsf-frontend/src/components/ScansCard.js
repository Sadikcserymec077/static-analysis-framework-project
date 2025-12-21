import React, { useEffect, useState } from "react";
import { FaSearch, FaFilter, FaAndroid, FaCalendarAlt, FaChevronRight, FaSpinner, FaBox } from "react-icons/fa";
import { getScans } from "../api";

export default function ScansCard({ onSelect, refreshKey }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, high, medium

  useEffect(() => {
    fetchScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshKey !== undefined) fetchScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function fetchScans() {
    setLoading(true);
    try {
      // Fetching more items to allow client-side filtering for demo purposes
      // In a real app, search/filter should be server-side
      const r = await getScans(1, 50);
      setScans(r.data.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredScans = scans.filter(s => {
    const matchesSearch = (s.APP_NAME || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.PACKAGE_NAME || "").toLowerCase().includes(searchTerm.toLowerCase());

    // Mocking risk filter since API might not return score directly in list
    // In real implementation, check s.SECURITY_SCORE or similar
    if (filter === "all") return matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FaAndroid className="text-primary" /> Recent Scans
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              History of analyzed applications and their security reports.
            </p>
          </div>
          <button
            onClick={fetchScans}
            disabled={loading}
            className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin inline mr-1" /> : null}
            Refresh List
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by app name or package..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-slate-400 dark:text-slate-500" />
            <select
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-700 dark:text-slate-300"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Risks</option>
              {/* <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option> */}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading && scans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <FaSpinner className="animate-spin mx-auto mb-2" size={24} />
            Loading scans...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No scans found matching your criteria.
          </div>
        ) : (
          filteredScans.map((s) => (
            <div
              key={s.MD5 || s.id}
              className="group p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-4"
              onClick={() => onSelect && onSelect({ hash: s.MD5 || s.hash || s.HASH || s.id, ...s })}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm transition-all">
                <FaAndroid size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                    {s.APP_NAME || s.FILE_NAME || "(unnamed)"}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {s.SCAN_TYPE || "APK"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 truncate" title={s.PACKAGE_NAME}>
                    <FaBox size={10} /> {s.PACKAGE_NAME}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <FaCalendarAlt size={10} />
                    {s.TIMESTAMP ? new Date(s.TIMESTAMP).toLocaleDateString() : ""}
                  </span>
                  {s.VERSION_NAME && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-[10px]">v{s.VERSION_NAME}</span>
                  )}
                </div>
              </div>

              <div className="text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">
                <FaChevronRight />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
