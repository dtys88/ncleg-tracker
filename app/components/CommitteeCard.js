"use client";

import { useState } from "react";

export default function CommitteeCard({ committee }) {
  const [hovered, setHovered] = useState(false);
  const chamberColors = { H: "#60a5fa", S: "#c084fc", N: "#fbbf24" };
  const chamberNames = { H: "House", S: "Senate", N: "Joint" };
  const code = committee.sChamberCode;

  return (
    <a
      href={`https://www.ncleg.gov/Committees/CommitteeInfo/${
        code === "N" ? "NonStanding" : code === "H" ? "House" : "Senate"
      }/${committee.nCommitteeID}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px",
        padding: "12px 16px",
        transition: "all 0.2s ease",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: chamberColors[code] || "#94a3b8",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>
          {committee.sCommitteeName}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
          {chamberNames[code] || "Other"}
          {committee.bNonStandingCommittee ? " · Non-Standing" : " · Standing"}
          {committee.bSelectCommittee ? " · Select" : ""}
        </div>
      </div>
      <div style={{ fontSize: "14px", opacity: hovered ? 0.5 : 0.2, transition: "opacity 0.2s" }}>→</div>
    </a>
  );
}
