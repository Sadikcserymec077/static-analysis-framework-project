/**
 * Export scan results to CSV format
 * @param {Object} report - The full scan report object
 * @param {string} filename - The desired filename (without extension)
 */
export const downloadCSV = (report, filename) => {
    if (!report) return;

    const rows = [
        ["Category", "Severity", "Title", "Description", "File/Path", "Remediation"]
    ];

    // Helper to add row
    const addRow = (category, severity, title, desc, path, remediation) => {
        rows.push([
            category || "",
            severity || "",
            (title || "").replace(/"/g, '""'), // Escape quotes
            (desc || "").replace(/"/g, '""'),
            (path || "").replace(/"/g, '""'),
            (remediation || "").replace(/"/g, '""')
        ]);
    };

    // 1. Manifest
    const manifest = report.manifest_analysis || report.Manifest || {};
    const mFindings = manifest.manifest_findings || manifest.findings || [];
    mFindings.forEach(f => {
        addRow("Manifest", f.severity, f.title || f.name, f.description, f.path || f.file, f.remediation);
    });

    // 2. Code
    const code = report.code_analysis?.findings || {};
    Object.entries(code).forEach(([key, val]) => {
        const meta = val.metadata || {};
        const files = Object.keys(val.files || {}).join("; ");
        addRow("Code", meta.severity, meta.description || key, meta.description, files, "");
    });

    // 3. Permissions
    const perms = report.permissions || {};
    Object.entries(perms).forEach(([perm, details]) => {
        const status = details.status || details.level || "";
        if (/(dangerous|danger)/i.test(status)) {
            addRow("Permission", "High", perm, typeof details === 'object' ? details.description : status, "AndroidManifest.xml", "");
        }
    });

    // Convert to CSV string
    const csvContent = rows.map(e => e.map(c => `"${c}"`).join(",")).join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


