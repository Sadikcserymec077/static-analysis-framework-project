import React, { useState } from "react";
import { FaChevronDown, FaChevronRight, FaBug, FaShieldAlt, FaInfoCircle, FaExclamationTriangle, FaCode, FaNetworkWired, FaFileCode, FaKey, FaShieldVirus, FaMagic } from "react-icons/fa";
import AiFixModal from "./AiFixModal";

const SEVERITY_COLORS = {
  high: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30",
  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30",
  secure: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30",
};

const SeverityBadge = ({ sev }) => {
  if (!sev) return null;
  const s = (sev || "").toLowerCase();
  let style = SEVERITY_COLORS.info;
  let label = "Info";

  if (s.includes("high") || s.includes("critical")) {
    style = SEVERITY_COLORS.high;
    label = "High";
  } else if (s.includes("warn") || s.includes("medium") || s === "warning") {
    style = SEVERITY_COLORS.medium;
    label = "Medium";
  } else if (s === "secure" || s === "good") {
    style = SEVERITY_COLORS.secure;
    label = "Secure";
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
};

export default function HumanReport({ data }) {
  const [expandedSections, setExpandedSections] = useState({
    high: true,
    medium: false,
    info: false,
    dangerous: false,
  });
  const [aiFinding, setAiFinding] = useState(null);

  if (!data) return <div className="text-slate-500 dark:text-slate-400 italic p-4">No report loaded.</div>;

  // Collect findings
  const allFindings = [];

  const addFinding = (category, title, severity, description, path, remediation, extra = {}) => {
    allFindings.push({
      category,
      title: title || `${category} Issue`,
      severity: (severity || "info").toLowerCase(),
      description: description || "",
      path: path || "",
      remediation: remediation || null,
      ...extra
    });
  };

  // 1. Certificate Analysis
  const certFindings = data.certificate_analysis?.certificate_findings || [];
  certFindings.forEach((f) => {
    if (Array.isArray(f) && f.length >= 3) {
      addFinding("Certificate", f[2], f[0], f[1]);
    }
  });

  // 2. Manifest Analysis
  const manifestAnalysis = data.manifest_analysis || data.Manifest || data.manifest || {};
  const manifestFindingsRaw = Array.isArray(manifestAnalysis.manifest_findings)
    ? manifestAnalysis.manifest_findings
    : Array.isArray(manifestAnalysis.findings)
      ? manifestAnalysis.findings
      : [];
  manifestFindingsRaw.forEach((f) => {
    if (f && typeof f === "object") {
      addFinding("Manifest", f.title || f.name, f.severity, f.description, f.path || f.file, f.remediation);
    }
  });

  // 3. Code Analysis
  const codeFindings = data.code_analysis?.findings || {};
  Object.entries(codeFindings).forEach(([key, finding]) => {
    if (finding && finding.metadata) {
      const meta = finding.metadata;
      const files = finding.files || {};
      const fileList = Object.keys(files).join(", ");
      addFinding("Code", meta.description || key, meta.severity, meta.description, fileList, null, {
        cwe: meta.cwe,
        owasp: meta["owasp-mobile"],
        masvs: meta.masvs,
      });
    }
  });

  // 4. Network Security
  const networkFindings = data.network_security?.network_findings || [];
  networkFindings.forEach((f) => {
    if (f && typeof f === "object") {
      addFinding("Network", f.title || f.name, f.severity, f.description, f.path || "", f.remediation);
    }
  });

  // 5. API Findings
  const apiFindings = Array.isArray(data.api) ? data.api : Array.isArray(data.api_findings) ? data.api_findings : [];
  apiFindings.forEach((f) => {
    if (f && typeof f === "object") {
      addFinding("API", f.title || f.name, f.severity || f.level, f.description, f.path || "", f.remediation);
    }
  });

  // 6. Dangerous Permissions
  const permsObj = data.permissions || data.Permission || data.manifest_permissions || {};
  Object.entries(permsObj).forEach(([perm, details]) => {
    const status = typeof details === 'string' ? details : (details.status || details.level || details.risk || details.description || '');
    if (/(dangerous|danger|privileged|critical)/i.test(status)) {
      addFinding(
        "Dangerous Permission",
        perm,
        "high",
        typeof details === 'object' ? details.description || status : status,
        "AndroidManifest.xml",
        null,
        { permission: perm }
      );
    }
  });

  // Filter by severity
  const highFindings = allFindings.filter(f => {
    const s = f.severity;
    return (s.includes("high") || s.includes("critical")) && f.category !== "Dangerous Permission";
  });
  const medFindings = allFindings.filter(f => {
    const s = f.severity;
    return (s.includes("warn") || s.includes("medium") || s === "warning") && f.category !== "Dangerous Permission";
  });
  const infoFindings = allFindings.filter(f => {
    const s = f.severity;
    return !(s.includes("high") || s.includes("critical") || s.includes("warn") || s.includes("medium") || s === "warning" || s === "secure" || s === "good") && f.category !== "Dangerous Permission";
  });
  const dangerousPerms = allFindings.filter(f => f.category === "Dangerous Permission");

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, count, type, isOpen, onClick, colorClass }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-2 ${isOpen ? 'rounded-b-none border-b-0' : ''}`}
    >
      <div className="flex items-center gap-3">
        {isOpen ? <FaChevronDown className="text-slate-400" /> : <FaChevronRight className="text-slate-400" />}
        <span className={`font-semibold ${colorClass}`}>{title}</span>
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-full font-medium">
          {count}
        </span>
      </div>
    </button>
  );

  const FindingCard = ({ finding }) => {
    let Icon = FaBug;
    if (finding.category === 'Certificate') Icon = FaKey;
    if (finding.category === 'Manifest') Icon = FaFileCode;
    if (finding.category === 'Network') Icon = FaNetworkWired;
    if (finding.category === 'Code') Icon = FaCode;
    if (finding.category === 'Dangerous Permission') Icon = FaShieldVirus;

    return (
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-x border-slate-200 dark:border-slate-800 first:border-t-0 last:rounded-b-lg hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-slate-400 dark:text-slate-500 shrink-0">
            <Icon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 px-1.5 rounded">
                {finding.category}
              </span>
              <h4 className={`text-sm font-semibold break-words ${finding.category === 'Dangerous Permission' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`} dangerouslySetInnerHTML={{ __html: finding.title }} />
              <SeverityBadge sev={finding.severity} />
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-words">{finding.description}</p>

            {(finding.path || finding.cwe || finding.owasp) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                {finding.path && (
                  <div className="flex items-center gap-1">
                    <FaFileCode className="shrink-0" />
                    <span className="font-mono truncate max-w-xs" title={finding.path}>{finding.path}</span>
                  </div>
                )}
                {finding.cwe && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    <span>CWE: {finding.cwe}</span>
                  </div>
                )}
                {finding.owasp && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    <span>OWASP: {finding.owasp}</span>
                  </div>
                )}
              </div>
            )}

            {finding.remediation && (
              <div className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-xs mb-1">
                  <FaShieldAlt /> Remediation
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono bg-white dark:bg-slate-900 p-2 rounded border border-emerald-100/50 dark:border-emerald-900/30">
                  {finding.remediation}
                </div>
              </div>
            )}

            {/* AI Button */}
            <div className="mt-3">
              <button
                onClick={() => setAiFinding(finding)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                <FaMagic /> Ask AI to Fix
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FaExclamationTriangle className="text-slate-400 dark:text-slate-500" />
          Security Findings
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Total Issues: <span className="font-medium text-slate-900 dark:text-white">{allFindings.length}</span>
        </div>
      </div>

      {/* High Severity */}
      <div>
        <SectionHeader
          title="High Severity"
          count={highFindings.length}
          isOpen={expandedSections.high}
          onClick={() => toggleSection('high')}
          colorClass="text-red-600 dark:text-red-400"
        />
        {expandedSections.high && (
          <div className="shadow-sm rounded-b-lg overflow-hidden">
            {highFindings.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm italic">
                No high severity issues found.
              </div>
            ) : (
              highFindings.map((f, i) => <FindingCard key={i} finding={f} />)
            )}
          </div>
        )}
      </div>

      {/* Medium Severity */}
      <div>
        <SectionHeader
          title="Medium Severity"
          count={medFindings.length}
          isOpen={expandedSections.medium}
          onClick={() => toggleSection('medium')}
          colorClass="text-amber-600 dark:text-amber-400"
        />
        {expandedSections.medium && (
          <div className="shadow-sm rounded-b-lg overflow-hidden">
            {medFindings.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm italic">
                No medium severity issues found.
              </div>
            ) : (
              medFindings.map((f, i) => <FindingCard key={i} finding={f} />)
            )}
          </div>
        )}
      </div>

      {/* Info / Other */}
      <div>
        <SectionHeader
          title="Information / Low Risk"
          count={infoFindings.length}
          isOpen={expandedSections.info}
          onClick={() => toggleSection('info')}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        {expandedSections.info && (
          <div className="shadow-sm rounded-b-lg overflow-hidden">
            {infoFindings.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm italic">
                No informational issues found.
              </div>
            ) : (
              infoFindings.map((f, i) => <FindingCard key={i} finding={f} />)
            )}
          </div>
        )}
      </div>

      {/* Dangerous Permissions */}
      <div>
        <SectionHeader
          title="Dangerous Permissions"
          count={dangerousPerms.length}
          isOpen={expandedSections.dangerous}
          onClick={() => toggleSection('dangerous')}
          colorClass="text-red-700 dark:text-red-400"
        />
        {expandedSections.dangerous && (
          <div className="shadow-sm rounded-b-lg overflow-hidden">
            {dangerousPerms.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm italic">
                No dangerous permissions found.
              </div>
            ) : (
              dangerousPerms.map((f, i) => <FindingCard key={i} finding={f} />)
            )}
          </div>
        )}
      </div>

      <AiFixModal
        isOpen={!!aiFinding}
        onClose={() => setAiFinding(null)}
        finding={aiFinding}
      />
    </div>
  );
}
