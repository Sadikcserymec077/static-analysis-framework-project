import React from 'react';

export default function CircularProgress({
    percentage = 0,
    size = 120,
    strokeWidth = 8,
    color = "text-primary",
    trackColor = "text-slate-200 dark:text-slate-700"
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                className="transform -rotate-90"
                width={size}
                height={size}
            >
                {/* Track */}
                <circle
                    className={trackColor}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress */}
                <circle
                    className={`${color} transition-all duration-300 ease-out`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-700 dark:text-white">
                    {Math.round(percentage)}%
                </span>
            </div>
        </div>
    );
}
