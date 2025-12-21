import React, { useState } from 'react';
import NavBar from './NavBar';

const Layout = ({ children, activeTab, onTabChange }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar when tab changes (mobile)
    const handleTabChange = (tab) => {
        onTabChange(tab);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans flex flex-col transition-colors duration-200">
            <NavBar
                activeTab={activeTab}
                onTabChange={onTabChange}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`
                fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-white text-lg">Menu</span>
                </div>
                <div className="p-4 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'reports', label: 'Reports' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`
                                w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === item.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        &copy; {new Date().getFullYear()} Static Analysis Framework
                    </div>
                </div>
            </div>

            <div className="flex flex-1 pt-16">
                <main className="flex-1 p-4 lg:p-8 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>

            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto hidden lg:block transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Static Analysis Framework for Android Applications
                </div>
            </footer>
        </div>
    );
};

export default Layout;
