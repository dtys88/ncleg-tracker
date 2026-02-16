"use client";

import { useState } from "react";
import { formatDate, daysAgo } from "@/lib/constants";

function StatusBadge({ type }) {
  const styles = {
    health: { bg: "#1a3a2a", color: "#4ade80", border: "#2d5a3d", label: "HEALTH" },
    house: { bg: "#1a2740", color: "#60a5fa", border: "#2a3f5f", label: "HOUSE" },
    senate: { bg: "#2d1a3a", color: "#c084fc", border: "#4a2d5f", label: "SENATE" },
    watched: { bg: "#3a2d1a", color: "#fbbf24", border: "#5f4a2d", label: "WATCHING" },
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

export default function BillCard({ bill, index, isWatched, onToggleWatch }) {
  const [hovered, setHovered] = useState(false);

  const handleStarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWatch(bill.id);
  };

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
        border: `1px solid ${
          isWatched
            ? "rgba(251, 191, 36, 0.2)"
            : bill.isHealth
            ? "rgba(74, 222, 128, 0.15)"
            : "rgba(255,255,255,0.06)"
        }`,
        borderLeft: isWatched
          ? "3px solid #fbbf24"
          : bill.isHealth
          ? "3px solid #4ade80"
          : "3px solid transparent",
        borderRadius: "8px",
        padding: "16px 20px",
        transition: "all 0.2s ease",
        transform: hovered ? "translateX(2px)" : "none",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        {/* Star button */}
        <button
          onClick={handleStarClick}
          title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            padding: "0 4px 0 0",
            marginTop: "1px",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            filter: isWatched ? "none" : "grayscale(1) opacity(0.3)",
          }}
        >
          ★
        </button>

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
            {isWatched && <StatusBadge type="watched" />}
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
