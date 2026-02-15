"use client";

import { useState } from "react";
import { formatDate, daysAgo } from "@/lib/constants";

function StatusBadge({ type }) {
  const styles = {
    health: { bg: "#1a3a2a", color: "#4ade80", border: "#2d5a3d", label: "HEALTH" },
    house: { bg: "#1a2740", color: "#60a5fa", border: "#2a3f5f", label: "HOUSE" },
    senate: { bg: "#2d1a3a", color: "#c084fc", border: "#4a2d5f", label: "SENATE" },
  };
  const s = styles[type] || styles.house;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-mono)",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

export default function BillCard({ bill, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={bill.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${bill.isHealth ? "rgba(74, 222, 128, 0.15)" : "rgba(255,255,255,0.06)"}`,
        borderLeft: bill.isHealth ? "3px solid #4ade80" : "3px solid transparent",
        borderRadius: "8px",
        padding: "16px 20px",
        transition: "all 0.2s ease",
        transform: hovered ? "translateX(2px)" : "none",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "0.02em",
              }}
            >
              {bill.billNumber}
            </span>
            <StatusBadge type={bill.chamber.toLowerCase()} />
            {bill.isHealth && <StatusBadge type="health" />}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#cbd5e1",
              fontWeight: 500,
              lineHeight: 1.4,
              marginBottom: "6px",
            }}
          >
            {bill.title}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {bill.description}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: "70px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
            {daysAgo(bill.pubDate)}
          </div>
          <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
            {formatDate(bill.pubDate)}
          </div>
        </div>
      </div>
    </a>
  );
}
