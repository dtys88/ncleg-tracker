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
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;white-space:nowrap;color:#1e293b;">
          ${b.billNumber}${watchedIds.has(b.id) ? '<span style="color:#d97706;"> ★</span>' : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#374151;">
          ${b.title}
          ${b.isHealth ? '<span style="display:inline-block;background:#d1fae5;color:#059669;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;margin-left:6px;">HEALTH</span>' : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:12px;color:#6b7280;text-align:center;">${b.chamber}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:12px;color:#6b7280;">${b.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(b.pubDate)}</td>
      </tr>`
    )
    .join("");

  const healthCount = bills.filter((b) => b.isHealth).length;
  const watchedCount = bills.filter((b) => watchedIds.has(b.id)).length;
  const now = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@media print { body { margin: 0.5in; } .no-print { display: none; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } }
body { font-family: 'DM Sans', -apple-system, sans-serif; color: #1e293b; margin: 40px; }</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #059669;padding-bottom:16px;">
<div><h1 style="margin:0;font-size:20px;color:#111827;font-weight:700;">NC Leg Tracker</h1><p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${title}</p></div>
<div style="text-align:right;"><div style="font-size:12px;color:#6b7280;">${now}</div><div style="font-size:12px;color:#9ca3af;margin-top:2px;">${bills.length} bills · ${healthCount} health-related · ${watchedCount} watched</div></div></div>
<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8f9fb;">
<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;border-bottom:2px solid #e2e5eb;text-transform:uppercase;letter-spacing:0.05em;">Bill</th>
<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;border-bottom:2px solid #e2e5eb;text-transform:uppercase;letter-spacing:0.05em;">Title</th>
<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;border-bottom:2px solid #e2e5eb;text-transform:uppercase;letter-spacing:0.05em;">Chamber</th>
<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;border-bottom:2px solid #e2e5eb;text-transform:uppercase;letter-spacing:0.05em;">Last Action</th>
<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;border-bottom:2px solid #e2e5eb;text-transform:uppercase;letter-spacing:0.05em;">Date</th>
</tr></thead><tbody>${rows}</tbody></table>
<div style="margin-top:24px;padding-top:12px;border-top:1px solid #eef0f4;font-size:10px;color:#9ca3af;">Generated from NC Leg Tracker · Data from ncleg.gov</div>
<button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#059669;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(5,150,105,0.3);">🖨 Print / Save as PDF</button>
</body></html>`;
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
      <button onClick={() => setOpen(!open)} style={{ background: "var(--bg-card)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", padding: "8px 14px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", fontFamily: "var(--font-sans)", whiteSpace: "nowrap", boxShadow: "var(--shadow-sm)" }}>
        ↓ Export
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "6px", background: "#ffffff", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-md)", padding: "4px", zIndex: 100, minWidth: "190px", boxShadow: "var(--shadow-lg)" }}>
            <button onClick={exportCSV} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "10px 14px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", textAlign: "left", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-sans)" }}
              onMouseEnter={(e) => (e.target.style.background = "var(--bg-card-hover)")} onMouseLeave={(e) => (e.target.style.background = "none")}>
              📊 Export as CSV (Excel)
            </button>
            <button onClick={exportPDF} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "10px 14px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", textAlign: "left", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-sans)" }}
              onMouseEnter={(e) => (e.target.style.background = "var(--bg-card-hover)")} onMouseLeave={(e) => (e.target.style.background = "none")}>
              📄 Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
