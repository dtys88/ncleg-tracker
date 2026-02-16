"use client";

import { useState } from "react";
import { formatDate, daysAgo } from "@/lib/constants";

function StatusBadge({ type }) {
  const styles = {
    health: { bg: "#d1fae5", color: "#059669", label: "HEALTH" },
    house: { bg: "#dbeafe", color: "#2563eb", label: "HOUSE" },
    senate: { bg: "#ede9fe", color: "#7c3aed", label: "SENATE" },
    watched: { bg: "#fef3c7", color: "#d97706", label: "WATCHING" },
  };
  const s = styles[type] || styles.house;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "var(--font-mono)", background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function BillDetail({ billNumber }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const billCode = billNumber.replace(/\s+/g, "").replace(/^(H|S)[BRJ]*/i, "$1");

  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bill-detail?bill=${billCode}`);
        if (res.ok) { const data = await res.json(); if (data.success) setDetail(data); else setError(data.error); }
        else setError("Could not load bill details");
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  });

  if (loading) {
    return (
      <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Loading bill details...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
        Could not load details.{" "}
        <a href={`https://www.ncleg.gov/BillLookup/2025/${billCode}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-green)", textDecoration: "underline", fontWeight: 600 }}>
          View on ncleg.gov →
        </a>
      </div>
    );
  }

  const primarySponsors = detail.sponsors.filter((s) => s.primary);
  const coSponsors = detail.sponsors.filter((s) => !s.primary);

  return (
    <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "14px", paddingTop: "14px" }}>

      {detail.summary && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Official Summary</div>
          <div style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.65, background: "var(--bg-inset)", borderRadius: "var(--radius-sm)", padding: "12px 14px", border: "1px solid var(--border-subtle)" }}>
            {detail.summary.length > 600 ? detail.summary.substring(0, 600) + "..." : detail.summary}
          </div>
        </div>
      )}

      {detail.sponsors.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            Sponsors {primarySponsors.length > 0 && `(${primarySponsors.length} primary, ${coSponsors.length} co-sponsors)`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {primarySponsors.map((s) => (
              <a key={s.memberId} href={s.profileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-elevated)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", padding: "4px 10px", textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}>
                {s.name} ★
              </a>
            ))}
            {coSponsors.slice(0, 10).map((s) => (
              <a key={s.memberId} href={s.profileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "4px 10px", textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}>
                {s.name}
              </a>
            ))}
            {coSponsors.length > 10 && <span style={{ fontSize: "12px", color: "var(--text-dim)", padding: "4px 8px" }}>+{coSponsors.length - 10} more</span>}
          </div>
        </div>
      )}

      {detail.votes.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Roll Call Votes</div>
          {detail.votes.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)", padding: "5px 0" }}>
              <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "11px", minWidth: "80px" }}>{v.date}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{v.subject}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: v.result === "PASS" ? "var(--accent-green)" : "var(--accent-red)" }}>{v.aye}–{v.no}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: v.result === "PASS" ? "var(--accent-green)" : "var(--accent-red)", background: v.result === "PASS" ? "var(--accent-green-light)" : "#fee2e2", padding: "2px 7px", borderRadius: "4px" }}>{v.result}</span>
            </div>
          ))}
        </div>
      )}

      {detail.history.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Action History ({detail.history.length})</div>
          <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
            {detail.history.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", fontSize: "12px", padding: "5px 0", borderBottom: i < detail.history.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "11px", minWidth: "80px", flexShrink: 0 }}>{h.date}</span>
                <span style={{ color: "var(--text-muted)", minWidth: "50px", flexShrink: 0, fontWeight: 500 }}>{h.chamber}</span>
                <span style={{ color: "var(--text-tertiary)" }}>{h.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.keywords.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Keywords ({detail.keywords.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {detail.keywords.slice(0, 8).map((kw, i) => (
              <span key={i} style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-inset)", border: "1px solid var(--border-subtle)", borderRadius: "4px", padding: "2px 8px", fontWeight: 500 }}>{kw}</span>
            ))}
            {detail.keywords.length > 8 && <span style={{ fontSize: "10px", color: "var(--text-dim)", padding: "2px 8px" }}>+{detail.keywords.length - 8} more</span>}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <a href={detail.billUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-green)", background: "var(--accent-green-dim)", borderRadius: "var(--radius-sm)", padding: "6px 14px", textDecoration: "none", transition: "background 0.15s" }}>
          Full Bill Page →
        </a>
        {detail.summaryUrl && (
          <a href={detail.summaryUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-blue)", background: "rgba(37,99,235,0.06)", borderRadius: "var(--radius-sm)", padding: "6px 14px", textDecoration: "none" }}>
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

  const handleStarClick = (e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch(bill.id); };
  const handleExpand = (e) => { e.preventDefault(); setExpanded(!expanded); };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered || expanded ? "var(--bg-card)" : "var(--bg-card)",
        border: `1px solid ${isWatched ? "rgba(217,119,6,0.3)" : bill.isHealth ? "rgba(5,150,105,0.2)" : "var(--border-subtle)"}`,
        borderLeft: isWatched ? "3px solid #d97706" : bill.isHealth ? "3px solid #059669" : "3px solid transparent",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        transition: "all 0.2s ease",
        cursor: "pointer",
        boxShadow: hovered || expanded ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
      onClick={handleExpand}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <button onClick={handleStarClick} title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "0 4px 0 0", marginTop: "1px", flexShrink: 0, transition: "transform 0.15s", transform: hovered ? "scale(1.1)" : "scale(1)", opacity: isWatched ? 1 : 0.2, color: isWatched ? "#d97706" : "var(--text-dim)" }}>
          ★
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.01em" }}>{bill.billNumber}</span>
            <StatusBadge type={bill.chamber.toLowerCase()} />
            {bill.isHealth && <StatusBadge type="health" />}
            {isWatched && <StatusBadge type="watched" />}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.45, marginBottom: "5px" }}>{bill.title}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{bill.description}</div>
          {expanded && <BillDetail billNumber={bill.billNumber} />}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: "72px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{daysAgo(bill.pubDate)}</div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>{formatDate(bill.pubDate)}</div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "8px", transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "none" }}>▸ detail</div>
        </div>
      </div>
    </div>
  );
}
