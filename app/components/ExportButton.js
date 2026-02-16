"use client";

import { useState } from "react";
import { formatDate } from "@/lib/constants";

function generateCSV(bills, watchedIds) {
  const headers = ["Bill Number", "Title", "Chamber", "Last Action", "Date", "Health-Related", "Watched", "Link"];
  const rows = bills.map((b) => [
    b.billNumber,
    `"${b.title.replace(/"/g, '""')}"`,
    b.chamber,
    `"${b.description.replace(/"/g, '""')}"`,
    formatDate(b.pubDate),
    b.isHealth ? "Yes" : "No",
    watchedIds.has(b.id) ? "Yes" : "No",
    b.link,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function generatePDFHTML(bills, watchedIds, title) {
  const rows = bills
    .map(
      (b) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;font-weight:700;white-space:nowrap;">
          ${b.billNumber}
          ${watchedIds.has(b.id) ? '<span style="color:#d97706;"> ★</span>' : ""}
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">
          ${b.title}
          ${b.isHealth ? '<span style="display:inline-block;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:700;margin-left:6px;">HEALTH</span>' : ""}
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">${b.chamber}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${b.description}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;white-space:nowrap;">${formatDate(b.pubDate)}</td>
      </tr>`
    )
    .join("");

  const healthCount = bills.filter((b) => b.isHealth).length;
  const watchedCount = bills.filter((b) => watchedIds.has(b.id)).length;
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @media print {
      body { margin: 0.5in; }
      .no-print { display: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; margin: 40px; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #16a34a;padding-bottom:16px;">
    <div>
      <h1 style="margin:0;font-size:22px;color:#0f172a;">NC Leg Tracker</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${title}</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#64748b;">${now}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
        ${bills.length} bills · ${healthCount} health-related · ${watchedCount} watched
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#475569;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">Bill</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#475569;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">Title</th>
        <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;color:#475569;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">Chamber</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#475569;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">Last Action</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#475569;border-bottom:2px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">Date</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;">
    Generated from NC Leg Tracker · Data from ncleg.gov · North Carolina General Assembly
  </div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#16a34a;color:white;border:none;border-radius:8px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
    🖨 Print / Save as PDF
  </button>
</body>
</html>`;
}

export default function ExportButton({ bills, watchedIds, label }) {
  const [open, setOpen] = useState(false);

  const exportCSV = () => {
    const csv = generateCSV(bills, watchedIds);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ncleg-bills-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = () => {
    const html = generatePDFHTML(bills, watchedIds, label || "Legislative Bill Report");
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setOpen(false);
  };

  if (bills.length === 0) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "8px 14px",
          color: "var(--text-dim)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
          fontFamily: "var(--font-sans)",
          whiteSpace: "nowrap",
        }}
      >
        ↓ Export
      </button>

      {open && (
        <>
          {/* Backdrop to close menu */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              background: "#1a1f2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "4px",
              zIndex: 100,
              minWidth: "180px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <button
              onClick={exportCSV}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 14px",
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "6px",
                fontFamily: "var(--font-sans)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.target.style.background = "none")}
            >
              📊 Export as CSV (Excel)
            </button>
            <button
              onClick={exportPDF}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 14px",
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "6px",
                fontFamily: "var(--font-sans)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.target.style.background = "none")}
            >
              📄 Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
