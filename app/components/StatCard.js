"use client";

export default function StatCard({ label, value, accent, icon }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 800,
          color: accent || "#e2e8f0",
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
