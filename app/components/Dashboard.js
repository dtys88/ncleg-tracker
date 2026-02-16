"use client";

import { useState, useEffect, useCallback } from "react";
import { SESSION_YEAR } from "@/lib/constants";
import BillCard from "./BillCard";
import CommitteeCard from "./CommitteeCard";
import StatCard from "./StatCard";
import ExportButton from "./ExportButton";

const TABS = [
  { id: "bills", label: "All Bills", icon: "📋" },
  { id: "recent", label: "Last 7 Days", icon: "⚡" },
  { id: "watchlist", label: "Watchlist", icon: "★" },
  { id: "chaptered", label: "Enacted", icon: "✅" },
  { id: "governor", label: "Governor", icon: "🖊" },
  { id: "committees", label: "Committees", icon: "🏛" },
];

function loadWatchlist() {
  if (typeof window === "undefined") return new Set();
  try { const s = localStorage.getItem("ncleg-watchlist"); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
}
function saveWatchlist(ids) { try { localStorage.setItem("ncleg-watchlist", JSON.stringify([...ids])); } catch {} }

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
  const [watchedIds, setWatchedIds] = useState(new Set());

  useEffect(() => { setWatchedIds(loadWatchlist()); }, []);
  const toggleWatch = useCallback((billId) => {
    setWatchedIds((prev) => { const next = new Set(prev); if (next.has(billId)) next.delete(billId); else next.add(billId); saveWatchlist(next); return next; });
  }, []);

  const fetchBills = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [allRes, committeeRes] = await Promise.allSettled([fetch("/api/bills?feed=all"), fetch("/api/committees")]);
      if (allRes.status === "fulfilled" && allRes.value.ok) { const data = await allRes.value.json(); if (data.success) setBills(data.bills); else throw new Error(data.error); }
      else throw new Error("Could not load bills data");
      if (committeeRes.status === "fulfilled" && committeeRes.value.ok) { const data = await committeeRes.value.json(); if (data.success) { setCommittees(data.committees); setCommitteeSummary(data.summary); } }
      setLastRefresh(new Date());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  const fetchTabData = useCallback(async (tab) => {
    if (tab === "chaptered" && chapteredBills.length === 0) { try { const res = await fetch("/api/bills?feed=chaptered"); if (res.ok) { const data = await res.json(); if (data.success) setChapteredBills(data.bills); } } catch {} }
    if (tab === "governor" && governorBills.length === 0) {
      try {
        const [signedRes, pendingRes] = await Promise.allSettled([fetch("/api/bills?feed=governor-signed"), fetch("/api/bills?feed=governor-pending")]);
        const combined = [];
        for (const res of [signedRes, pendingRes]) { if (res.status === "fulfilled" && res.value.ok) { const data = await res.value.json(); if (data.success) combined.push(...data.bills); } }
        const seen = new Set();
        setGovernorBills(combined.filter((b) => { if (seen.has(b.id)) return false; seen.add(b.id); return true; }));
      } catch {}
    }
  }, [chapteredBills.length, governorBills.length]);

  useEffect(() => { fetchBills(); }, [fetchBills]);
  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);
  useEffect(() => { setVisibleCount(50); }, [searchQuery, chamberFilter, healthOnly, activeTab]);

  const filterBills = (billList) => billList
    .filter((b) => {
      if (searchQuery) { const q = searchQuery.toLowerCase(); if (!b.title.toLowerCase().includes(q) && !b.billNumber.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) return false; }
      if (chamberFilter !== "all" && b.chamber.toLowerCase() !== chamberFilter) return false;
      if (healthOnly && !b.isHealth) return false;
      return true;
    })
    .sort((a, b) => { const da = new Date(a.pubDate), db = new Date(b.pubDate); return sortOrder === "newest" ? db - da : da - db; });

  const filteredBills = filterBills(bills);
  const recentBills = filteredBills.filter((b) => (new Date() - new Date(b.pubDate)) / 864e5 <= 7);
  const filteredChaptered = filterBills(chapteredBills);
  const filteredGovernor = filterBills(governorBills);
  const watchlistBills = filterBills(bills.filter((b) => watchedIds.has(b.id)));
  const healthBillCount = bills.filter((b) => b.isHealth).length;
  const houseBillCount = bills.filter((b) => b.chamber === "House").length;
  const senateBillCount = bills.filter((b) => b.chamber === "Senate").length;
  const recentCount = bills.filter((b) => (new Date() - new Date(b.pubDate)) / 864e5 <= 7).length;

  const getDisplayBills = () => { switch (activeTab) { case "recent": return recentBills; case "watchlist": return watchlistBills; case "chaptered": return filteredChaptered; case "governor": return filteredGovernor; default: return filteredBills; } };
  const getExportLabel = () => { switch (activeTab) { case "recent": return "Bills — Last 7 Days"; case "watchlist": return "Watchlist Bills"; case "chaptered": return "Enacted Bills"; case "governor": return "Governor Action Bills"; default: return "All Bills"; } };
  const displayBills = getDisplayBills();
  const filteredCommittees = committees.filter((c) => { if (searchQuery) return c.sCommitteeName.toLowerCase().includes(searchQuery.toLowerCase()); if (chamberFilter === "house") return c.sChamberCode === "H"; if (chamberFilter === "senate") return c.sChamberCode === "S"; return true; });
  const isBillTab = activeTab !== "committees";

  return (
    <div className="dashboard-root">
      <div className="container">

        {/* ─── HEADER ─── */}
        <header className="header">
          <div className="header-top">
            <div>
              <div className="logo-row">
                <div className="logo-mark">NC</div>
                <div>
                  <h1 className="logo-text">Leg Tracker</h1>
                  <p className="subtitle">{SESSION_YEAR}–{parseInt(SESSION_YEAR) + 1} Session · North Carolina General Assembly</p>
                </div>
              </div>
            </div>
            <div className="header-actions">
              {lastRefresh && <span className="refresh-timestamp">Updated {lastRefresh.toLocaleTimeString()}</span>}
              <button onClick={fetchBills} disabled={loading} className="refresh-btn">↻ Refresh</button>
            </div>
          </div>
          {!loading && !error && (
            <div className="stats-grid">
              <StatCard label="Total Bills" value={bills.length} icon="📋" />
              <StatCard label="Health-Related" value={healthBillCount} accent="var(--accent-green)" icon="🏥" />
              <StatCard label="Watching" value={watchedIds.size} accent="var(--accent-yellow)" icon="★" />
              <StatCard label="House" value={houseBillCount} accent="var(--accent-blue)" icon="🔵" />
              <StatCard label="Senate" value={senateBillCount} accent="var(--accent-purple)" icon="🟣" />
              <StatCard label="Last 7 Days" value={recentCount} accent="var(--accent-yellow)" icon="⚡" />
            </div>
          )}
        </header>

        {/* ─── TABS ─── */}
        <nav className="tabs-nav">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""} ${tab.id === "watchlist" && activeTab === "watchlist" ? "tab-watchlist" : ""}`}>
              {tab.icon} {tab.label}
              {tab.id === "watchlist" && watchedIds.size > 0 && <span className="watchlist-count">{watchedIds.size}</span>}
            </button>
          ))}
        </nav>

        {/* ─── FILTERS ─── */}
        <div className="filters-row">
          <div className="search-wrapper">
            <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search bills, keywords, numbers..." className="search-input" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="search-clear">✕</button>}
          </div>
          <div className="filter-group">
            {["all", "house", "senate"].map((val) => (
              <button key={val} onClick={() => setChamberFilter(val)} className={`filter-btn ${chamberFilter === val ? "filter-active" : ""}`}>
                {val === "all" ? "All" : val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
            {isBillTab && (
              <>
                <button onClick={() => setHealthOnly(!healthOnly)} className={`filter-btn ${healthOnly ? "filter-health-active" : ""}`}>🏥 Health</button>
                <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")} className="filter-btn">{sortOrder === "newest" ? "↓ New" : "↑ Old"}</button>
                <ExportButton bills={displayBills} watchedIds={watchedIds} label={getExportLabel()} />
              </>
            )}
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <main className="content">
          {loading ? (
            <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading from NC General Assembly...</div></div>
          ) : error ? (
            <div className="error-container"><div className="error-text">⚠ {error}</div><p className="error-detail">The NC General Assembly API may be temporarily unavailable.</p><button onClick={fetchBills} className="retry-btn">Retry</button></div>
          ) : activeTab === "committees" ? (
            <>
              <div className="results-count">{filteredCommittees.length} active committees{committeeSummary && <span className="results-detail"> · {committeeSummary.house} House · {committeeSummary.senate} Senate · {committeeSummary.joint} Joint</span>}</div>
              <div className="committees-grid">{filteredCommittees.map((c) => <CommitteeCard key={c.nCommitteeID} committee={c} />)}</div>
            </>
          ) : (
            <>
              <div className="results-count">
                {displayBills.length} bills{healthOnly && " (health-related)"}{activeTab === "recent" && " with action in the last 7 days"}{activeTab === "watchlist" && " on your watchlist"}{activeTab === "chaptered" && " enacted into law"}{activeTab === "governor" && " with governor action"}{searchQuery && ` matching "${searchQuery}"`}
              </div>
              {activeTab === "watchlist" && watchedIds.size === 0 && (
                <div className="watchlist-empty">
                  <div className="watchlist-empty-star">★</div>
                  <div className="watchlist-empty-title">Your watchlist is empty</div>
                  <div className="watchlist-empty-text">Click the star icon on any bill to add it to your watchlist. Watched bills persist in your browser.</div>
                  <button onClick={() => setActiveTab("bills")} className="watchlist-empty-btn">Browse All Bills →</button>
                </div>
              )}
              <div className="bills-list">
                {displayBills.length === 0 && !(activeTab === "watchlist" && watchedIds.size === 0) ? (
                  <div className="empty-state">No bills match your current filters.</div>
                ) : (
                  <>
                    {displayBills.slice(0, visibleCount).map((bill, i) => (
                      <BillCard key={`${bill.id}-${i}`} bill={bill} index={i} isWatched={watchedIds.has(bill.id)} onToggleWatch={toggleWatch} />
                    ))}
                    {displayBills.length > visibleCount && (
                      <button onClick={() => setVisibleCount((v) => v + 50)} className="load-more-btn">Load more ({displayBills.length - visibleCount} remaining)</button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>

        <footer className="footer">
          <div className="footer-text">
            Data from <a href="https://www.ncleg.gov" target="_blank" rel="noopener noreferrer">ncleg.gov</a> · Click any bill to view sponsors, history & official summaries
          </div>
        </footer>
      </div>

      <style jsx>{`
        .dashboard-root { min-height: 100vh; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 28px; }

        /* Header */
        .header { padding: 36px 0 28px; }
        .header-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .logo-row { display: flex; align-items: center; gap: 14px; }
        .logo-mark {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #059669, #10b981);
          color: white; font-size: 14px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: -0.02em; font-family: var(--font-mono);
          box-shadow: 0 2px 8px rgba(5,150,105,0.25);
        }
        .logo-text { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1.1; letter-spacing: -0.02em; }
        .subtitle { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .refresh-timestamp { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); }
        .refresh-btn {
          background: var(--accent-green); color: white;
          border: none; border-radius: var(--radius-sm);
          padding: 9px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(5,150,105,0.2);
        }
        .refresh-btn:hover { background: #047857; }
        .refresh-btn:disabled { opacity: 0.5; cursor: wait; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 24px; }

        /* Tabs */
        .tabs-nav { display: flex; gap: 2px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 20px; overflow-x: auto; }
        .tab-btn {
          background: transparent; border: none; border-bottom: 2px solid transparent;
          padding: 11px 16px; color: var(--text-muted); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-active { border-bottom-color: var(--accent-green); color: var(--text-primary); }
        .tab-watchlist { border-bottom-color: var(--accent-yellow); }
        .watchlist-count {
          background: var(--accent-yellow-light); color: var(--accent-yellow);
          padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; font-family: var(--font-mono);
        }

        /* Filters */
        .filters-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-wrapper { position: relative; flex: 1 1 280px; }
        .search-icon-svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-dim); pointer-events: none; }
        .search-input {
          width: 100%; background: var(--bg-card); border: 1px solid var(--border-medium);
          border-radius: var(--radius-sm); padding: 9px 36px 9px 40px;
          color: var(--text-secondary); font-size: 13px; font-family: var(--font-sans);
          outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .search-input:focus { border-color: var(--accent-green); box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }
        .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 12px; padding: 4px; }
        .filter-group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .filter-btn {
          background: var(--bg-card); border: 1px solid var(--border-medium);
          border-radius: var(--radius-sm); padding: 8px 14px;
          color: var(--text-muted); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .filter-btn:hover { background: var(--bg-card-hover); color: var(--text-secondary); border-color: var(--border-strong); }
        .filter-active { background: var(--text-primary); color: white; border-color: var(--text-primary); }
        .filter-active:hover { background: var(--text-secondary); color: white; }
        .filter-health-active { background: var(--accent-green-light); border-color: rgba(5,150,105,0.3); color: var(--accent-green); }

        /* Content */
        .content { padding-bottom: 60px; }
        .results-count { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; font-weight: 500; }
        .results-detail { color: var(--text-dim); }
        .bills-list { display: flex; flex-direction: column; gap: 8px; }
        .committees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 8px; }
        .empty-state { text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 14px; }

        /* Watchlist empty */
        .watchlist-empty { text-align: center; padding: 60px 20px; }
        .watchlist-empty-star { font-size: 48px; margin-bottom: 16px; color: var(--text-faint); }
        .watchlist-empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .watchlist-empty-text { font-size: 13px; color: var(--text-muted); max-width: 380px; margin: 0 auto 20px; line-height: 1.6; }
        .watchlist-empty-btn {
          background: var(--accent-yellow-light); border: 1px solid rgba(217,119,6,0.2);
          border-radius: var(--radius-sm); padding: 10px 24px;
          color: var(--accent-yellow); font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: var(--font-sans);
        }

        .load-more-btn {
          background: var(--bg-card); border: 1px solid var(--border-medium);
          border-radius: var(--radius-md); padding: 14px;
          color: var(--text-muted); font-size: 13px; font-weight: 600;
          cursor: pointer; text-align: center; margin-top: 8px;
          box-shadow: var(--shadow-sm); transition: all 0.15s ease;
        }
        .load-more-btn:hover { background: var(--bg-card-hover); color: var(--text-secondary); }

        /* Loading / Error */
        .loading-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; }
        .spinner { width: 32px; height: 32px; border: 3px solid var(--border-subtle); border-top-color: var(--accent-green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loading-text { font-size: 13px; color: var(--text-muted); }
        .error-container { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 24px; text-align: center; }
        .error-text { font-size: 14px; color: #dc2626; font-weight: 600; margin-bottom: 8px; }
        .error-detail { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }
        .retry-btn { background: #fee2e2; border: 1px solid #fecaca; border-radius: var(--radius-sm); padding: 8px 20px; color: #dc2626; font-size: 13px; font-weight: 600; cursor: pointer; }

        /* Footer */
        .footer { border-top: 1px solid var(--border-subtle); padding: 20px 0 40px; text-align: center; }
        .footer-text { font-size: 11px; color: var(--text-dim); }
        .footer-text a { color: var(--text-muted); text-decoration: underline; }

        @media (max-width: 640px) {
          .container { padding: 0 16px; }
          .header { padding-top: 20px; }
          .logo-text { font-size: 18px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .tab-btn { padding: 10px 12px; font-size: 12px; }
          .committees-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
