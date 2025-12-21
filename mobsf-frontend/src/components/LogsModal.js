import React, { useEffect, useState, useRef } from 'react';
import { FaTimes, FaTerminal } from 'react-icons/fa';

export default function LogsModal({ show, onHide, logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <FaTerminal className="text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-lg">Scan Logs</h3>
          </div>
          <button
            onClick={onHide}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 bg-slate-900 font-mono text-sm text-slate-300"
        >
          {logs && logs.length === 0 && (
            <div className="text-slate-500 italic">Waiting for logs...</div>
          )}
          <ul className="space-y-1">
            {logs?.map((l, i) => (
              <li key={i} className="break-words border-b border-slate-800/50 pb-1 last:border-0">
                <span className="text-slate-500 mr-2">
                  {l.timestamp ? l.timestamp.split(' ')[1] : ''}
                </span>
                <span className={l.status?.toLowerCase().includes('error') ? 'text-red-400' : 'text-slate-300'}>
                  {l.status || JSON.stringify(l)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end">
          <button
            onClick={onHide}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-sm transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
