"use client";

import { useState, useEffect, useCallback } from "react";
import { SESSION_YEAR, formatDate, daysAgo } from "@/lib/constants";
import BillCard from "./BillCard";
import CommitteeCard from "./CommitteeCard";
import StatCard from "./StatCard";
import ExportButton from "./ExportButton";
import StakeholderCard from "./StakeholderCard";

// NC Congressional delegation — static since it changes only every 2 years
const NC_CONGRESSIONAL = [
  { id: "fed-budd", name: "Ted Budd", partyCode: "R", chamber: "Senate", title: "U.S. Senator", organization: "U.S. Senate", phone: "202-224-3154", profileUrl: "https://www.budd.senate.gov", district: 0, counties: ["Statewide"] },
  { id: "fed-tillis", name: "Thom Tillis", partyCode: "R", chamber: "Senate", title: "U.S. Senator", organization: "U.S. Senate", phone: "202-224-6342", profileUrl: "https://www.tillis.senate.gov", district: 0, counties: ["Statewide"] },
  { id: "fed-cd1", name: "Don Davis", partyCode: "D", title: "U.S. Representative, District 1", organization: "U.S. House", phone: "202-225-3101", district: 1 },
  { id: "fed-cd2", name: "Deborah Ross", partyCode: "D", title: "U.S. Representative, District 2", organization: "U.S. House", phone: "202-225-3032", district: 2 },
  { id: "fed-cd3", name: "Greg Murphy", partyCode: "R", title: "U.S. Representative, District 3", organization: "U.S. House", phone: "202-225-3415", district: 3 },
  { id: "fed-cd4", name: "Valerie Foushee", partyCode: "D", title: "U.S. Representative, District 4", organization: "U.S. House", phone: "202-225-1784", district: 4 },
  { id: "fed-cd5", name: "Virginia Foxx", partyCode: "R", title: "U.S. Representative, District 5", organization: "U.S. House", phone: "202-225-2071", district: 5 },
  { id: "fed-cd6", name: "Addison McDowell", partyCode: "R", title: "U.S. Representative, District 6", organization: "U.S. House", phone: "202-225-3065", district: 6 },
  { id: "fed-cd7", name: "David Rouzer", partyCode: "R", title: "U.S. Representative, District 7", organization: "U.S. House", phone: "202-225-2731", district: 7 },
  { id: "fed-cd8", name: "Dan Bishop", partyCode: "R", title: "U.S. Representative, District 8", organization: "U.S. House", phone: "202-225-1976", district: 8 },
  { id: "fed-cd9", name: "Richard Hudson", partyCode: "R", title: "U.S. Representative, District 9", organization: "U.S. House", phone: "202-225-3715", district: 9 },
  { id: "fed-cd10", name: "Patrick McHenry", partyCode: "R", title: "U.S. Representative, District 10", organization: "U.S. House", phone: "202-225-2576", district: 10 },
  { id: "fed-cd11", name: "Chuck Edwards", partyCode: "R", title: "U.S. Representative, District 11", organization: "U.S. House", phone: "202-225-6401", district: 11 },
  { id: "fed-cd12", name: "Alma Adams", partyCode: "D", title: "U.S. Representative, District 12", organization: "U.S. House", phone: "202-225-1510", district: 12 },
  { id: "fed-cd13", name: "Jeff Jackson", partyCode: "D", title: "U.S. Representative, District 13", organization: "U.S. House", phone: "202-225-1784", district: 13 },
  { id: "fed-cd14", name: "Tim Moore", partyCode: "R", title: "U.S. Representative, District 14", organization: "U.S. House", phone: "202-225-2576", district: 14 },
];

// Key regulatory officials — manually maintained
const REGULATORY_OFFICIALS = [
  { id: "reg-1", name: "Devdutta Sangvai", title: "Secretary", organization: "NC Dept. of Health & Human Services", phone: "919-855-4800" },
  { id: "reg-2", name: "Mark Payne", title: "Director, Division of Health Service Regulation", organization: "NC DHHS", phone: "919-855-3765" },
];

const TABS = [
  { id: "bills", label: "All Bills", icon: "📋" },
  { id: "recent", label: "Last 7 Days", icon: "⚡" },
  { id: "watchlist", label: "Watchlist", icon: "★" },
  { id: "stakeholders", label: "Stakeholders", icon: "👤" },
  { id: "chaptered", label: "Enacted", icon: "✅" },
  { id: "governor", label: "Governor", icon: "🖊" },
  { id: "committees", label: "Committees", icon: "🏛" },
];

const STAKEHOLDER_SUBTABS = [
  { id: "nc-legislators", label: "NC Legislators" },
  { id: "congressional", label: "Congressional" },
  { id: "regulatory", label: "Regulatory" },
];

function loadWatchlist() {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem("ncleg-watchlist");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
}

function saveWatchlist(ids) {
  try { localStorage.setItem("ncleg-watchlist", JSON.stringify([...ids])); } catch {}
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("bills");
  const [stakeholderSubTab, setStakeholderSubTab] = useState("nc-legislators");
  const [bills, setBills] = useState([]);
  const [chapteredBills, setChapteredBills] = useState([]);
  const [governorBills, setGovernorBills] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [committeeSummary, setCommitteeSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSummary, setMemberSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [healthOnly, setHealthOnly] = useState(false);
  const [partyFilter, setPartyFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(50);
  const [watchedIds, setWatchedIds] = useState(new Set());

  useEffect(() => { setWatchedIds(loadWatchlist()); }, []);

  const toggleWatch = useCallback((billId) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      saveWatchlist(next);
      return next;
    });
  }, []);

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
      } else throw new Error("Could not load bills data");
      if (committeeRes.status === "fulfilled" && committeeRes.value.ok) {
        const data = await committeeRes.value.json();
        if (data.success) { setCommittees(data.committees); setCommitteeSummary(data.summary); }
      }
      setLastRefresh(new Date());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const fetchMembers = useCallback(async () => {
    if (members.length > 0) return;
    setMembersLoading(true);
    try {
      const res = await fetch("/api/members?chamber=all");
      if (res.ok) {
        const data = await res.json();
        if (data.success) { setMembers(data.members); setMemberSummary(data.summary); }
      }
    } catch {}
    finally { setMembersLoading(false); }
  }, [members.length]);

  const fetchTabData = useCallback(async (tab) => {
    if (tab === "stakeholders") fetchMembers();
    if (tab === "chaptered" && chapteredBills.length === 0) {
      try {
        const res = await fetch("/api/bills?feed=chaptered");
        if (res.ok) { const data = await res.json(); if (data.success) setChapteredBills(data.bills); }
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
        const seen = new Set();
        setGovernorBills(combined.filter((b) => { if (seen.has(b.id)) return false; seen.add(b.id); return true; }));
      } catch {}
    }
  }, [chapteredBills.length, governorBills.length, fetchMembers]);

  useEffect(() => { fetchBills(); }, [fetchBills]);
  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);
  useEffect(() => { setVisibleCount(50); }, [searchQuery, chamberFilter, healthOnly, activeTab]);

  // ─── FILTERING ──────────────────────────────
  const filterBills = (billList) => {
    return billList
      .filter((b) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!b.title.toLowerCase().includes(q) && !b.billNumber.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) return false;
        }
        if (chamberFilter !== "all" && b.chamber.toLowerCase() !== chamberFilter) return false;
        if (healthOnly && !b.isHealth) return false;
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.pubDate), db = new Date(b.pubDate);
        return sortOrder === "newest" ? db - da : da - db;
      });
  };

  const filteredBills = filterBills(bills);
  const recentBills = filteredBills.filter((b) => (new Date() - new Date(b.pubDate)) / 864e5 <= 7);
  const filteredChaptered = filterBills(chapteredBills);
  const filteredGovernor = filterBills(governorBills);
  const watchlistBills = filterBills(bills.filter((b) => watchedIds.has(b.id)));

  const healthBillCount = bills.filter((b) => b.isHealth).length;
  const houseBillCount = bills.filter((b) => b.chamber === "House").length;
  const senateBillCount = bills.filter((b) => b.chamber === "Senate").length;
  const recentCount = bills.filter((b) => (new Date() - new Date(b.pubDate)) / 864e5 <= 7).length;

  const getDisplayBills = () => {
    switch (activeTab) {
      case "recent": return recentBills;
      case "watchlist": return watchlistBills;
      case "chaptered": return filteredChaptered;
      case "governor": return filteredGovernor;
      default: return filteredBills;
    }
  };
  const getExportLabel = () => {
    switch (activeTab) {
      case "recent": return "Bills — Last 7 Days";
      case "watchlist": return "Watchlist Bills";
      case "chaptered": return "Enacted Bills";
      case "governor": return "Governor Action Bills";
      default: return "All Bills";
    }
  };

  const displayBills = getDisplayBills();

  const filteredCommittees = committees.filter((c) => {
    if (searchQuery) return c.sCommitteeName.toLowerCase().includes(searchQuery.toLowerCase());
    if (chamberFilter === "house") return c.sChamberCode === "H";
    if (chamberFilter === "senate") return c.sChamberCode === "S";
    return true;
  });

  // Stakeholder filtering
  const getDisplayStakeholders = () => {
    let list = [];
    switch (stakeholderSubTab) {
      case "nc-legislators": list = members; break;
      case "congressional": list = NC_CONGRESSIONAL; break;
      case "regulatory": list = REGULATORY_OFFICIALS; break;
    }
    return list.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${m.name} ${m.title || ""} ${m.organization || ""} ${(m.counties || []).join(" ")}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (stakeholderSubTab === "nc-legislators") {
        if (chamberFilter === "house" && m.chamber !== "House") return false;
        if (chamberFilter === "senate" && m.chamber !== "Senate") return false;
        if (partyFilter === "R" && m.partyCode !== "R") return false;
        if (partyFilter === "D" && m.partyCode !== "D") return false;
      }
      return true;
    });
  };

  const displayStakeholders = getDisplayStakeholders();

  const isBillTab = ["bills", "recent", "watchlist", "chaptered", "governor"].includes(activeTab);

  return (
    <div className="dashboard-root">
      <div className="bg-gradient" />
      <div className="container">

        {/* ─── HEADER ─── */}
        <header className="header">
          <div className="header-top">
            <div>
              <div className="logo-row">
                <div className="logo-bar" />
                <h1 className="logo-text">NC LEG TRACKER</h1>
              </div>
              <p className="subtitle">North Carolina General Assembly · {SESSION_YEAR}–{parseInt(SESSION_YEAR) + 1} Session</p>
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
              className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""} ${tab.id === "watchlist" ? "tab-watchlist" : ""}`}>
              {tab.icon} {tab.label}
              {tab.id === "watchlist" && watchedIds.size > 0 && <span className="watchlist-count">{watchedIds.size}</span>}
            </button>
          ))}
        </nav>

        {/* ─── STAKEHOLDER SUB-TABS ─── */}
        {activeTab === "stakeholders" && (
          <div className="subtabs-row">
            {STAKEHOLDER_SUBTABS.map((st) => (
              <button key={st.id} onClick={() => setStakeholderSubTab(st.id)}
                className={`subtab-btn ${stakeholderSubTab === st.id ? "subtab-active" : ""}`}>
                {st.label}
              </button>
            ))}
          </div>
        )}

        {/* ─── FILTERS ─── */}
        <div className="filters-row">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "stakeholders" ? "Search by name, county, title..." : "Search bills, keywords, numbers..."}
              className="search-input" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="search-clear">✕</button>}
          </div>
          <div className="filter-group">
            {(isBillTab || (activeTab === "stakeholders" && stakeholderSubTab === "nc-legislators")) && (
              <>
                {["all", "house", "senate"].map((val) => (
                  <button key={val} onClick={() => setChamberFilter(val)}
                    className={`filter-btn ${chamberFilter === val ? "filter-active" : ""}`}>
                    {val === "all" ? "All Chambers" : val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                ))}
              </>
            )}
            {activeTab === "stakeholders" && stakeholderSubTab === "nc-legislators" && (
              <>
                {["all", "R", "D"].map((val) => (
                  <button key={val} onClick={() => setPartyFilter(val)}
                    className={`filter-btn ${partyFilter === val ? "filter-active" : ""}`}
                    style={partyFilter === val && val === "R" ? { background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }
                      : partyFilter === val && val === "D" ? { background: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa" } : {}}>
                    {val === "all" ? "All Parties" : val === "R" ? "Republican" : "Democrat"}
                  </button>
                ))}
              </>
            )}
            {isBillTab && (
              <>
                <button onClick={() => setHealthOnly(!healthOnly)}
                  className={`filter-btn ${healthOnly ? "filter-health-active" : ""}`}>
                  🏥 Health Only
                </button>
                <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")} className="filter-btn">
                  {sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}
                </button>
                <ExportButton bills={displayBills} watchedIds={watchedIds} label={getExportLabel()} />
              </>
            )}
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <main className="content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <div className="loading-text">Loading from NC General Assembly...</div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-text">⚠ {error}</div>
              <p className="error-detail">The NC General Assembly API may be temporarily unavailable.</p>
              <button onClick={fetchBills} className="retry-btn">Retry</button>
            </div>

          /* ─── STAKEHOLDERS TAB ─── */
          ) : activeTab === "stakeholders" ? (
            <>
              <div className="results-count">
                {membersLoading ? "Loading legislators..." : `${displayStakeholders.length} stakeholders`}
                {stakeholderSubTab === "nc-legislators" && memberSummary && (
                  <span className="results-detail">
                    {" "}· {memberSummary.republican} R · {memberSummary.democrat} D
                  </span>
                )}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              {membersLoading ? (
                <div className="loading-container">
                  <div className="spinner" />
                  <div className="loading-text">Loading legislators...</div>
                </div>
              ) : (
                <div className="stakeholders-grid">
                  {displayStakeholders.map((m) => (
                    <StakeholderCard
                      key={m.id}
                      member={m}
                      type={stakeholderSubTab === "congressional" ? "federal" : stakeholderSubTab === "regulatory" ? "regulatory" : "state"}
                    />
                  ))}
                  {displayStakeholders.length === 0 && (
                    <div className="empty-state">No stakeholders match your filters.</div>
                  )}
                </div>
              )}
            </>

          /* ─── COMMITTEES TAB ─── */
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
                {filteredCommittees.map((c) => <CommitteeCard key={c.nCommitteeID} committee={c} />)}
              </div>
            </>

          /* ─── BILL TABS ─── */
          ) : (
            <>
              <div className="results-count">
                {displayBills.length} bills
                {healthOnly && " (health-related)"}
                {activeTab === "recent" && " with action in the last 7 days"}
                {activeTab === "watchlist" && " on your watchlist"}
                {activeTab === "chaptered" && " enacted into law"}
                {activeTab === "governor" && " with governor action"}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              {activeTab === "watchlist" && watchedIds.size === 0 && (
                <div className="watchlist-empty">
                  <div className="watchlist-empty-star">★</div>
                  <div className="watchlist-empty-title">Your watchlist is empty</div>
                  <div className="watchlist-empty-text">Click the star icon on any bill to add it to your watchlist. Watched bills are saved in your browser.</div>
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
                      <button onClick={() => setVisibleCount((v) => v + 50)} className="load-more-btn">
                        Load more ({displayBills.length - visibleCount} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>

        <footer className="footer">
          <div className="footer-text">
            Data sourced from <a href="https://www.ncleg.gov" target="_blank" rel="noopener noreferrer">ncleg.gov</a>
            {" "}· NC General Assembly Web Services API · Health bills flagged via keyword matching
          </div>
        </footer>
      </div>

      <style jsx>{`
        .dashboard-root { min-height: 100vh; position: relative; overflow-x: hidden; }
        .bg-gradient { position: fixed; inset: 0; background: radial-gradient(ellipse 80% 60% at 20% 10%, rgba(74,222,128,0.03) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(96,165,250,0.03) 0%, transparent 50%); pointer-events: none; z-index: 0; }
        .container { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .header { padding: 40px 0 32px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .logo-bar { width: 8px; height: 32px; background: linear-gradient(180deg, #4ade80, #22c55e); border-radius: 4px; }
        .logo-text { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: var(--text-primary); line-height: 1; }
        .subtitle { font-size: 13px; color: var(--text-dim); margin-left: 20px; font-weight: 500; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .refresh-timestamp { font-size: 11px; color: var(--text-faint); font-family: var(--font-mono); }
        .refresh-btn { background: var(--accent-green-bg); border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 10px 20px; color: var(--accent-green); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.02em; }
        .refresh-btn:hover { background: rgba(74,222,128,0.15); }
        .refresh-btn:disabled { opacity: 0.5; cursor: wait; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 28px; }
        .tabs-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 12px 16px; color: var(--text-dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .tab-btn:hover { color: var(--text-muted); }
        .tab-active { background: var(--bg-elevated); border-bottom-color: var(--accent-green); color: var(--text-secondary); }
        .tab-watchlist.tab-active { border-bottom-color: var(--accent-yellow); }
        .watchlist-count { background: rgba(251,191,36,0.2); color: var(--accent-yellow); padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; font-family: var(--font-mono); }
        .subtabs-row { display: flex; gap: 6px; margin-bottom: 16px; }
        .subtab-btn { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 16px; color: var(--text-dim); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: var(--font-sans); }
        .subtab-btn:hover { background: var(--bg-card-hover); }
        .subtab-active { background: var(--bg-elevated); border-color: var(--border-strong); color: var(--text-secondary); }
        .filters-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-wrapper { position: relative; flex: 1 1 280px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.4; pointer-events: none; }
        .search-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border-medium); border-radius: 8px; padding: 10px 36px 10px 40px; color: var(--text-secondary); font-size: 13px; font-family: var(--font-sans); outline: none; transition: border-color 0.2s ease; }
        .search-input:focus { border-color: rgba(74,222,128,0.4); }
        .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 12px; padding: 4px; }
        .filter-group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .filter-btn { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 14px; color: var(--text-dim); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
        .filter-btn:hover { background: var(--bg-card-hover); color: var(--text-muted); }
        .filter-active { background: var(--bg-elevated); border-color: var(--border-strong); color: var(--text-secondary); }
        .filter-health-active { background: var(--accent-green-dim); border-color: rgba(74,222,128,0.35); color: var(--accent-green); }
        .content { padding-bottom: 60px; }
        .results-count { font-size: 12px; color: var(--text-faint); margin-bottom: 16px; font-weight: 500; }
        .results-detail { color: var(--text-ghost); }
        .bills-list { display: flex; flex-direction: column; gap: 6px; }
        .committees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 8px; }
        .stakeholders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 8px; }
        .empty-state { text-align: center; padding: 48px 20px; color: var(--text-faint); font-size: 14px; }
        .watchlist-empty { text-align: center; padding: 60px 20px; margin-bottom: 20px; }
        .watchlist-empty-star { font-size: 48px; margin-bottom: 16px; filter: grayscale(1) opacity(0.2); }
        .watchlist-empty-title { font-size: 18px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; }
        .watchlist-empty-text { font-size: 13px; color: var(--text-dim); max-width: 400px; margin: 0 auto 20px; line-height: 1.6; }
        .watchlist-empty-btn { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25); border-radius: 8px; padding: 10px 24px; color: var(--accent-yellow); font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-sans); }
        .load-more-btn { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; color: var(--text-dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; text-align: center; margin-top: 8px; }
        .load-more-btn:hover { background: var(--bg-card-hover); color: var(--text-muted); }
        .loading-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; }
        .spinner { width: 36px; height: 36px; border: 3px solid var(--border-subtle); border-top-color: var(--accent-green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loading-text { font-size: 13px; color: var(--text-dim); }
        .error-container { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 24px; text-align: center; }
        .error-text { font-size: 14px; color: #fca5a5; margin-bottom: 8px; }
        .error-detail { font-size: 12px; color: var(--text-dim); margin-bottom: 16px; }
        .retry-btn { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 8px 20px; color: #fca5a5; font-size: 13px; font-weight: 600; cursor: pointer; }
        .footer { border-top: 1px solid rgba(255,255,255,0.04); padding: 20px 0 40px; text-align: center; }
        .footer-text { font-size: 11px; color: var(--text-ghost); }
        .footer-text a { color: var(--text-faint); text-decoration: underline; }
        @media (max-width: 640px) {
          .container { padding: 0 16px; }
          .header { padding-top: 24px; }
          .logo-text { font-size: 22px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .tab-btn { padding: 10px 12px; font-size: 12px; }
          .committees-grid, .stakeholders-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
