import React from 'react';
import { FaBars, FaShieldAlt, FaChartLine, FaFileAlt, FaExchangeAlt, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import logo from '../logo.png';

export default function NavBar({ activeTab, onTabChange, toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-4 lg:px-8 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          >
            <FaBars size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none" />
            Static Analysis Framework
          </div>
          <div className="hidden lg:flex ml-8 gap-1">
            <NavButton
              active={activeTab === "dashboard"}
              onClick={() => onTabChange("dashboard")}
              icon={FaShieldAlt}
              label="Dashboard"
            />
            <NavButton
              active={activeTab === "reports"}
              onClick={() => onTabChange("reports")}
              icon={FaFileAlt}
              label="Reports"
            />

          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-md">
            JSHR
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
        }
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
