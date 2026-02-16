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
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "var(--font-mono)", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function BillDetail({ billNumber, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract bill code from bill number (e.g., "HB 2" -> "H2", "SB 257" -> "S257")
  const billCode = billNumber.replace(/\s+/g, "").replace(/^(H|S)[BRJ]*/i, "$1");

  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bill-detail?bill=${billCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDetail(data);
          else setError(data.error);
        } else setError("Could not load bill details");
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  });

  if (loading) {
    return (
      <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "12px", color: "#64748b" }}>Loading bill details...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>
        Could not load details.{" "}
        <a href={`https://www.ncleg.gov/BillLookup/2025/${billCode}`} target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "underline" }}>
          View on ncleg.gov →
        </a>
      </div>
    );
  }

  const primarySponsors = detail.sponsors.filter((s) => s.primary);
  const coSponsors = detail.sponsors.filter((s) => !s.primary);

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "12px", paddingTop: "12px" }}>
      {/* Summary */}
      {detail.summary && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Official Summary
          </div>
          <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", borderRadius: "6px", padding: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
            {detail.summary.length > 600 ? detail.summary.substring(0, 600) + "..." : detail.summary}
          </div>
        </div>
      )}

      {/* Sponsors */}
      {detail.sponsors.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Sponsors {primarySponsors.length > 0 && `(${primarySponsors.length} primary, ${coSponsors.length} co-sponsors)`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {primarySponsors.map((s) => (
              <a key={s.memberId} href={s.profileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 10px", textDecoration: "none", transition: "background 0.15s" }}
                onClick={(e) => e.stopPropagation()}>
                {s.name} ★
              </a>
            ))}
            {coSponsors.slice(0, 10).map((s) => (
              <a key={s.memberId} href={s.profileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#94a3b8", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "4px 10px", textDecoration: "none", transition: "background 0.15s" }}
                onClick={(e) => e.stopPropagation()}>
                {s.name}
              </a>
            ))}
            {coSponsors.length > 10 && (
              <span style={{ fontSize: "12px", color: "#475569", padding: "4px 8px" }}>
                +{coSponsors.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Votes */}
      {detail.votes.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Roll Call Votes
          </div>
          {detail.votes.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#94a3b8", padding: "4px 0" }}>
              <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "11px", minWidth: "80px" }}>{v.date}</span>
              <span>{v.subject}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: v.result === "PASS" ? "#4ade80" : "#f87171" }}>
                {v.aye}–{v.no}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: v.result === "PASS" ? "#4ade80" : "#f87171", background: v.result === "PASS" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                {v.result}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action History */}
      {detail.history.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Action History ({detail.history.length} actions)
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
            {detail.history.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", fontSize: "12px", padding: "4px 0", borderBottom: i < detail.history.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <span style={{ color: "#475569", fontFamily: "var(--font-mono)", fontSize: "11px", minWidth: "80px", flexShrink: 0 }}>{h.date}</span>
                <span style={{ color: "#64748b", minWidth: "50px", flexShrink: 0 }}>{h.chamber}</span>
                <span style={{ color: "#94a3b8" }}>{h.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {detail.keywords.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Keywords
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {detail.keywords.map((kw, i) => (
              <span key={i} style={{ fontSize: "10px", color: "#64748b", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px", padding: "2px 8px" }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <a href={detail.billUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ fontSize: "11px", fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "4px", padding: "6px 12px", textDecoration: "none" }}>
          Full Bill Page →
        </a>
        {detail.summaryUrl && (
          <a href={detail.summaryUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            style={{ fontSize: "11px", fontWeight: 600, color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "4px", padding: "6px 12px", textDecoration: "none" }}>
            Official Summary →
          </a>
        )}
      </div>
    </div>
  );
}

export default function BillCard({ bill, index, isWatched, onToggleWatch }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleStarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWatch(bill.id);
  };

  const handleExpand = (e) => {
    e.preventDefault();
    setExpanded(!expanded);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered || expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isWatched ? "rgba(251,191,36,0.2)" : bill.isHealth ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)"}`,
        borderLeft: isWatched ? "3px solid #fbbf24" : bill.isHealth ? "3px solid #4ade80" : "3px solid transparent",
        borderRadius: "8px",
        padding: "16px 20px",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onClick={handleExpand}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        {/* Star */}
        <button onClick={handleStarClick} title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "0 4px 0 0", marginTop: "1px", flexShrink: 0, transition: "transform 0.15s", transform: hovered ? "scale(1.1)" : "scale(1)", filter: isWatched ? "none" : "grayscale(1) opacity(0.3)" }}>
          ★
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.02em" }}>
              {bill.billNumber}
            </span>
            <StatusBadge type={bill.chamber.toLowerCase()} />
            {bill.isHealth && <StatusBadge type="health" />}
            {isWatched && <StatusBadge type="watched" />}
          </div>
          <div style={{ fontSize: "14px", color: "#cbd5e1", fontWeight: 500, lineHeight: 1.4, marginBottom: "6px" }}>
            {bill.title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
            {bill.description}
          </div>

          {/* Expanded detail view */}
          {expanded && <BillDetail billNumber={bill.billNumber} />}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, minWidth: "70px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{daysAgo(bill.pubDate)}</div>
          <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{formatDate(bill.pubDate)}</div>
          <div style={{ fontSize: "10px", color: "#475569", marginTop: "6px", transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "none" }}>▸ detail</div>
        </div>
      </div>
    </div>
  );
}
