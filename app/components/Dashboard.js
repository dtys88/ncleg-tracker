"use client";

import { useState, useEffect, useCallback } from "react";
import { SESSION_YEAR, formatDate, daysAgo } from "@/lib/constants";
import BillCard from "./BillCard";
import CommitteeCard from "./CommitteeCard";
import StatCard from "./StatCard";

const TABS = [
  { id: "bills", label: "All Bills", icon: "📋" },
  { id: "recent", label: "Last 7 Days", icon: "⚡" },
  { id: "chaptered", label: "Enacted", icon: "✅" },
  { id: "governor", label: "Governor Action", icon: "🖊" },
  { id: "committees", label: "Committees", icon: "🏛" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("bills");
  const [bills, setBills] = useState([]);
  const [chapteredBills, setChapteredBills] = useState([]);
  const [governorBills, setGovernorBills] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [committeeSummary, setCommitteeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [healthOnly, setHealthOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(50);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, committeeRes] = await Promise.allSettled([
        fetch("/api/bills?feed=all"),
        fetch("/api/committees"),
      ]);

      if (allRes.status === "fulfilled" && allRes.value.ok) {
        const data = await allRes.value.json();
        if (data.success) setBills(data.bills);
        else throw new Error(data.error);
      } else {
        throw new Error("Could not load bills data");
      }

      if (committeeRes.status === "fulfilled" && committeeRes.value.ok) {
        const data = await committeeRes.value.json();
        if (data.success) {
          setCommittees(data.committees);
          setCommitteeSummary(data.summary);
        }
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTabData = useCallback(async (tab) => {
    if (tab === "chaptered" && chapteredBills.length === 0) {
      try {
        const res = await fetch("/api/bills?feed=chaptered");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setChapteredBills(data.bills);
        }
      } catch {}
    }
    if (tab === "governor" && governorBills.length === 0) {
      try {
        const [signedRes, pendingRes] = await Promise.allSettled([
          fetch("/api/bills?feed=governor-signed"),
          fetch("/api/bills?feed=governor-pending"),
        ]);
        const combined = [];
        for (const res of [signedRes, pendingRes]) {
          if (res.status === "fulfilled" && res.value.ok) {
            const data = await res.value.json();
            if (data.success) combined.push(...data.bills);
          }
        }
        // Deduplicate by id
        const seen = new Set();
        const deduped = combined.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
        setGovernorBills(deduped);
      } catch {}
    }
  }, [chapteredBills.length, governorBills.length]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, chamberFilter, healthOnly, activeTab]);

  // Filtering logic
  const filterBills = (billList) => {
    return billList
      .filter((b) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !b.title.toLowerCase().includes(q) &&
            !b.billNumber.toLowerCase().includes(q) &&
            !b.description.toLowerCase().includes(q)
          )
            return false;
        }
        if (chamberFilter !== "all" && b.chamber.toLowerCase() !== chamberFilter) return false;
        if (healthOnly && !b.isHealth) return false;
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.pubDate);
        const db = new Date(b.pubDate);
        return sortOrder === "newest" ? db - da : da - db;
      });
  };

  const filteredBills = filterBills(bills);
  const recentBills = filteredBills.filter((b) => {
    const diff = (new Date() - new Date(b.pubDate)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const filteredChaptered = filterBills(chapteredBills);
  const filteredGovernor = filterBills(governorBills);

  const healthBillCount = bills.filter((b) => b.isHealth).length;
  const houseBillCount = bills.filter((b) => b.chamber === "House").length;
  const senateBillCount = bills.filter((b) => b.chamber === "Senate").length;
  const recentCount = bills.filter((b) => {
    const diff = (new Date() - new Date(b.pubDate)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const getDisplayBills = () => {
    switch (activeTab) {
      case "recent": return recentBills;
      case "chaptered": return filteredChaptered;
      case "governor": return filteredGovernor;
      default: return filteredBills;
    }
  };

  const displayBills = getDisplayBills();

  const filteredCommittees = committees.filter((c) => {
    if (searchQuery) {
      return c.sCommitteeName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (chamberFilter === "house") return c.sChamberCode === "H";
    if (chamberFilter === "senate") return c.sChamberCode === "S";
    return true;
  });

  return (
    <div className="dashboard-root">
      {/* Background gradient */}
      <div className="bg-gradient" />

      <div className="container">
        {/* ─── HEADER ─────────────────────────────────── */}
        <header className="header">
          <div className="header-top">
            <div>
              <div className="logo-row">
                <div className="logo-bar" />
                <h1 className="logo-text">NC LEG TRACKER</h1>
              </div>
              <p className="subtitle">
                North Carolina General Assembly · {SESSION_YEAR}–{parseInt(SESSION_YEAR) + 1} Session
              </p>
            </div>
            <div className="header-actions">
              {lastRefresh && (
                <span className="refresh-timestamp">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchBills}
                disabled={loading}
                className="refresh-btn"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Stats row */}
          {!loading && !error && (
            <div className="stats-grid">
              <StatCard label="Total Bills" value={bills.length} icon="📋" />
              <StatCard label="Health-Related" value={healthBillCount} accent="var(--accent-green)" icon="🏥" />
              <StatCard label="House" value={houseBillCount} accent="var(--accent-blue)" icon="🔵" />
              <StatCard label="Senate" value={senateBillCount} accent="var(--accent-purple)" icon="🟣" />
              <StatCard label="Last 7 Days" value={recentCount} accent="var(--accent-yellow)" icon="⚡" />
            </div>
          )}
        </header>

        {/* ─── TABS ───────────────────────────────────── */}
        <nav className="tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* ─── FILTERS ────────────────────────────────── */}
        <div className="filters-row">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bills, keywords, numbers..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="search-clear"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            {["all", "house", "senate"].map((val) => (
              <button
                key={val}
                onClick={() => setChamberFilter(val)}
                className={`filter-btn ${chamberFilter === val ? "filter-active" : ""}`}
              >
                {val === "all" ? "All Chambers" : val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}

            <button
              onClick={() => setHealthOnly(!healthOnly)}
              className={`filter-btn ${healthOnly ? "filter-health-active" : ""}`}
            >
              🏥 Health Only
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="filter-btn"
            >
              {sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}
            </button>
          </div>
        </div>

        {/* ─── CONTENT ────────────────────────────────── */}
        <main className="content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <div className="loading-text">Loading from NC General Assembly...</div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-text">⚠ {error}</div>
              <p className="error-detail">
                The NC General Assembly API may be temporarily unavailable.
              </p>
              <button onClick={fetchBills} className="retry-btn">
                Retry
              </button>
            </div>
          ) : activeTab === "committees" ? (
            <>
              <div className="results-count">
                {filteredCommittees.length} active committees
                {committeeSummary && (
                  <span className="results-detail">
                    {" "}· {committeeSummary.house} House · {committeeSummary.senate} Senate · {committeeSummary.joint} Joint
                  </span>
                )}
              </div>
              <div className="committees-grid">
                {filteredCommittees.map((c) => (
                  <CommitteeCard key={c.nCommitteeID} committee={c} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="results-count">
                {displayBills.length} bills
                {healthOnly && " (health-related)"}
                {activeTab === "recent" && " with action in the last 7 days"}
                {activeTab === "chaptered" && " enacted into law"}
                {activeTab === "governor" && " with governor action"}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              <div className="bills-list">
                {displayBills.length === 0 ? (
                  <div className="empty-state">
                    No bills match your current filters.
                  </div>
                ) : (
                  <>
                    {displayBills.slice(0, visibleCount).map((bill, i) => (
                      <BillCard key={`${bill.id}-${i}`} bill={bill} index={i} />
                    ))}
                    {displayBills.length > visibleCount && (
                      <button
                        onClick={() => setVisibleCount((v) => v + 50)}
                        className="load-more-btn"
                      >
                        Load more ({displayBills.length - visibleCount} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>

        {/* ─── FOOTER ─────────────────────────────────── */}
        <footer className="footer">
          <div className="footer-text">
            Data sourced from{" "}
            <a href="https://www.ncleg.gov" target="_blank" rel="noopener noreferrer">
              ncleg.gov
            </a>{" "}
            · NC General Assembly Web Services API · Health bills flagged via keyword matching
          </div>
        </footer>
      </div>

      <style jsx>{`
        .dashboard-root {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }
        .bg-gradient {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(74, 222, 128, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 90%, rgba(96, 165, 250, 0.03) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        .container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Header */
        .header { padding: 40px 0 32px; }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .logo-bar {
          width: 8px;
          height: 32px;
          background: linear-gradient(180deg, #4ade80, #22c55e);
          border-radius: 4px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1;
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-dim);
          margin-left: 20px;
          font-weight: 500;
        }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .refresh-timestamp {
          font-size: 11px;
          color: var(--text-faint);
          font-family: var(--font-mono);
        }
        .refresh-btn {
          background: var(--accent-green-bg);
          border: 1px solid rgba(74, 222, 128, 0.25);
          border-radius: 8px;
          padding: 10px 20px;
          color: var(--accent-green);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }
        .refresh-btn:hover { background: rgba(74, 222, 128, 0.15); }
        .refresh-btn:disabled { opacity: 0.5; cursor: wait; }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-top: 28px;
        }

        /* Tabs */
        .tabs-nav {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 20px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 12px 20px;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--text-muted); }
        .tab-active {
          background: var(--bg-elevated);
          border-bottom-color: var(--accent-green);
          color: var(--text-secondary);
        }

        /* Filters */
        .filters-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }
        .search-wrapper {
          position: relative;
          flex: 1 1 300px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          opacity: 0.4;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-medium);
          border-radius: 8px;
          padding: 10px 36px 10px 40px;
          color: var(--text-secondary);
          font-size: 13px;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .search-input:focus { border-color: rgba(74, 222, 128, 0.4); }
        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 12px;
          padding: 4px;
        }
        .filter-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .filter-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 8px 14px;
          color: var(--text-dim);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .filter-btn:hover { background: var(--bg-card-hover); color: var(--text-muted); }
        .filter-active {
          background: var(--bg-elevated);
          border-color: var(--border-strong);
          color: var(--text-secondary);
        }
        .filter-health-active {
          background: var(--accent-green-dim);
          border-color: rgba(74, 222, 128, 0.35);
          color: var(--accent-green);
        }

        /* Content */
        .content { padding-bottom: 60px; }
        .results-count {
          font-size: 12px;
          color: var(--text-faint);
          margin-bottom: 16px;
          font-weight: 500;
        }
        .results-detail { color: var(--text-ghost); }
        .bills-list { display: flex; flex-direction: column; gap: 6px; }
        .committees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 8px;
        }
        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: var(--text-faint);
          font-size: 14px;
        }
        .load-more-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 14px;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          margin-top: 8px;
        }
        .load-more-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-muted);
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-subtle);
          border-top-color: var(--accent-green);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loading-text { font-size: 13px; color: var(--text-dim); }

        /* Error */
        .error-container {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          padding: 24px;
          text-align: center;
        }
        .error-text { font-size: 14px; color: #fca5a5; margin-bottom: 8px; }
        .error-detail { font-size: 12px; color: var(--text-dim); margin-bottom: 16px; }
        .retry-btn {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          padding: 8px 20px;
          color: #fca5a5;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Footer */
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding: 20px 0 40px;
          text-align: center;
        }
        .footer-text { font-size: 11px; color: var(--text-ghost); }
        .footer-text a {
          color: var(--text-faint);
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .container { padding: 0 16px; }
          .header { padding-top: 24px; }
          .logo-text { font-size: 22px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .tab-btn { padding: 10px 14px; font-size: 12px; }
          .committees-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
