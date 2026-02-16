"use client";

import { useState } from "react";

function PartyBadge({ party }) {
  const isR = party === "Republican" || party === "R";
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
        background: isR ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
        color: isR ? "#f87171" : "#60a5fa",
        border: `1px solid ${isR ? "rgba(239, 68, 68, 0.25)" : "rgba(59, 130, 246, 0.25)"}`,
      }}
    >
      {isR ? "R" : "D"}
    </span>
  );
}

function ChamberBadge({ chamber }) {
  const isHouse = chamber === "House";
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
        background: isHouse ? "#1a2740" : "#2d1a3a",
        color: isHouse ? "#60a5fa" : "#c084fc",
        border: `1px solid ${isHouse ? "#2a3f5f" : "#4a2d5f"}`,
      }}
    >
      {chamber.toUpperCase()}
    </span>
  );
}

function TypeBadge({ type }) {
  const config = {
    federal: { bg: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", border: "rgba(251, 191, 36, 0.25)", label: "FEDERAL" },
    regulatory: { bg: "rgba(74, 222, 128, 0.1)", color: "#4ade80", border: "rgba(74, 222, 128, 0.25)", label: "REGULATORY" },
    lobbyist: { bg: "rgba(244, 114, 182, 0.1)", color: "#f472b6", border: "rgba(244, 114, 182, 0.25)", label: "LOBBYIST" },
  };
  const c = config[type];
  if (!c) return null;
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
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.label}
    </span>
  );
}

export default function StakeholderCard({ member, type = "state" }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (e) => {
    e.preventDefault();
    setExpanded(!expanded);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
        padding: "16px",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onClick={handleToggle}
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Photo */}
        {member.photoUrl && (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.05)",
              border: `2px solid ${
                member.partyCode === "R"
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(59, 130, 246, 0.3)"
              }`,
            }}
          >
            <img
              src={member.photoUrl}
              alt={member.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name and badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>
              {member.name}
            </span>
            {member.partyCode && <PartyBadge party={member.partyCode} />}
            {member.chamber && <ChamberBadge chamber={member.chamber} />}
            {type !== "state" && <TypeBadge type={type} />}
          </div>

          {/* District and counties */}
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>
            {member.district ? `District ${member.district}` : member.title || ""}
            {member.counties && member.counties.length > 0 && (
              <span style={{ color: "#64748b" }}>
                {" "}· {member.counties.join(", ")}
              </span>
            )}
          </div>

          {/* Role/org for non-legislators */}
          {member.organization && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {member.organization}
            </div>
          )}

          {/* Expanded details */}
          {expanded && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {member.phone && (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Phone:</span>{" "}
                  <a
                    href={`tel:${member.phone}`}
                    style={{ color: "#94a3b8", textDecoration: "underline" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {member.phone}
                  </a>
                </div>
              )}
              {member.office && (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Office:</span> {member.office}
                </div>
              )}
              {member.assistant && (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Assistant:</span> {member.assistant}
                </div>
              )}
              {member.email && (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Email:</span>{" "}
                  <a
                    href={`mailto:${member.email}`}
                    style={{ color: "#94a3b8", textDecoration: "underline" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {member.email}
                  </a>
                </div>
              )}

              {/* Quick links for state legislators */}
              {member.profileUrl && (
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                  {[
                    { label: "Profile", url: member.profileUrl },
                    { label: "Committees", url: member.committeesUrl },
                    { label: "Votes", url: member.votesUrl },
                    { label: "Bills", url: member.billsUrl },
                  ]
                    .filter((l) => l.url)
                    .map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#4ade80",
                          background: "rgba(74, 222, 128, 0.08)",
                          border: "1px solid rgba(74, 222, 128, 0.2)",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        {link.label} →
                      </a>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <div
          style={{
            fontSize: "12px",
            color: "#475569",
            transition: "transform 0.2s",
            transform: expanded ? "rotate(90deg)" : "none",
            flexShrink: 0,
            marginTop: "4px",
          }}
        >
          ▸
        </div>
      </div>
    </div>
  );
}
