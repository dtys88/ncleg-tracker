"use client";

import { useState } from "react";

export default function CommitteeCard({ committee }) {
  const [hovered, setHovered] = useState(false);
  const c = committee;
  const chamberLabel = c.sChamberCode === "H" ? "House" : c.sChamberCode === "S" ? "Senate" : "Joint";
  const chamberColor = c.sChamberCode === "H" ? "var(--accent-blue)" : c.sChamberCode === "S" ? "var(--accent-purple)" : "var(--text-muted)";
  const chamberBg = c.sChamberCode === "H" ? "var(--accent-blue-light)" : c.sChamberCode === "S" ? "var(--accent-purple-light)" : "var(--bg-elevated)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontFamily: "var(--font-mono)",
            background: chamberBg,
            color: chamberColor,
          }}
        >
          {chamberLabel.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
        {c.sCommitteeName}
      </div>
    </div>
  );
}
