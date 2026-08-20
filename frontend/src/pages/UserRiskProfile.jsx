import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield, ShieldCheck, ArrowLeft, RefreshCw, AlertTriangle, User,
  Activity, Smartphone, CreditCard, MapPin, Bell, Ban, TrendingUp,
  Search, X, ArrowRight, CheckCircle, Eye, LogOut
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function UserRiskProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const loadProfile = async () => {
    try {
      setError("");
      profile ? setRefreshing(true) : setLoading(true);

      if (!token) {
        setError("Please login before viewing your risk profile.");
        return;
      }

      const response = await axios.get(`${API_URL}/api/fraud/user-risk`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data);
    } catch (err) {
      console.error("User risk profile error:", err);
      if (!err.response) {
        setError("Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000.");
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(err.response.data?.detail || "Unable to load user risk profile.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const riskLevel = String(profile?.risk_level || "LOW").toUpperCase();
  const riskScore = Math.min(100, Math.max(0, Number(profile?.risk_score || 0)));
  const riskClass = riskLevel.toLowerCase();

  const transactions = profile?.transactions || [];
  const devices = profile?.devices || [];
  const beneficiaries = profile?.beneficiaries || [];
  const locations = profile?.locations || [];
  const alerts = profile?.alerts || [];

  const stats = {
    transactions: profile?.statistics?.transactions ?? transactions.length,
    alerts: profile?.statistics?.alerts ?? alerts.length,
    blocked:
      profile?.statistics?.blocked ??
      transactions.filter(t => String(t.decision || "").toUpperCase() === "BLOCK").length,
    devices: profile?.statistics?.devices ?? devices.length,
    beneficiaries: profile?.statistics?.beneficiaries ?? beneficiaries.length,
    locations: profile?.statistics?.locations ?? locations.length,
  };

  const averageRisk = transactions.length
    ? Math.round(transactions.reduce((sum, t) => sum + Number(t.risk_score || 0), 0) / transactions.length)
    : 0;

  const highRisk = transactions.filter(
    t => String(t.risk_level || "").toUpperCase() === "HIGH"
  ).length;

  const allowed = transactions.filter(
    t => String(t.decision || "").toUpperCase() === "ALLOW"
  ).length;

  const review = transactions.filter(
    t => String(t.decision || "").toUpperCase() === "REVIEW"
  ).length;

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions
      .filter(t => {
        const decision = String(t.decision || "REVIEW").toUpperCase();
        const matchesFilter = filter === "ALL" || decision === filter;
        const text = [
          t.id, t.transaction_id, t.amount, t.risk_score,
          t.risk_level, t.decision
        ].filter(Boolean).join(" ").toLowerCase();

        return matchesFilter && (!q || text.includes(q));
      })
      .slice(0, 10);
  }, [transactions, filter, search]);

  const riskColor =
    riskLevel === "HIGH" ? "#dc2626" :
    riskLevel === "MEDIUM" ? "#d97706" : "#16a34a";

  const riskMessage =
    riskLevel === "HIGH"
      ? "Immediate investigation recommended."
      : riskLevel === "MEDIUM"
      ? "Additional verification is recommended."
      : "Current behavior appears within the normal range.";

  const money = value =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const nav = path => navigate(path);

  return (
    <div className="urp-page" data-page="user-risk">
      <header className="urp-nav">
        <button className="urp-brand" onClick={() => nav("/dashboard")}>
          <span className="urp-brand-icon"><Shield size={21} /></span>
          <span>
            <b>FraudShield AI</b>
            <small>Real-Time Transaction Protection</small>
          </span>
        </button>

        <nav className="urp-nav-links">
          <button onClick={() => nav("/dashboard")}><ShieldCheck size={15}/> Dashboard</button>
          <button onClick={() => nav("/transaction")}><ShieldCheck size={15}/> Transaction</button>
          <button onClick={() => nav("/voice-phishing")}>🎙 Voice Phishing</button>
          <button onClick={() => nav("/analytics")}>▥ Analytics</button>
          <button onClick={() => nav("/fraud-network")}><Activity size={15}/> Network</button>
          <button onClick={() => nav("/alerts")}><Bell size={15}/> Alerts</button>
          <button className="active"><User size={15}/> Risk Profile</button>
        </nav>

        <button className="urp-logout" onClick={logout}>
          <LogOut size={15}/> Logout
        </button>
      </header>

      <main className="urp-main">
        <div className="urp-topline">
          <button className="urp-back" onClick={() => nav("/dashboard")}>
            <ArrowLeft size={15}/> Dashboard
          </button>
          <button className="urp-refresh" onClick={loadProfile} disabled={loading || refreshing}>
            <RefreshCw size={15} className={loading || refreshing ? "spin" : ""}/>
            {loading || refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </button>
        </div>

        <section className="urp-heading">
          <div>
            <span className="urp-kicker"><span/> USER RISK INTELLIGENCE</span>
            <h1>User Risk Profile</h1>
            <p>Consolidated behavioral intelligence across transactions, devices, beneficiaries, locations and fraud alerts.</p>
          </div>
          <div className={`urp-live ${riskClass}`}>
            <span>●</span> PROFILE {riskLevel}
          </div>
        </section>

        {error && (
          <div className="urp-error">
            <AlertTriangle size={18}/>
            <span>{error}</span>
            <button onClick={loadProfile}>Retry</button>
          </div>
        )}

        {loading && !profile ? (
          <div className="urp-loading">
            <RefreshCw size={38} className="spin"/>
            <h2>Building user risk profile...</h2>
            <p>FraudShield is collecting available security signals.</p>
          </div>
        ) : (
          <>
            <section className="urp-profile-card">
              <div className="urp-identity">
                <div className="urp-avatar"><User size={30}/></div>
                <div>
                  <span className="urp-mini-label">PROTECTED USER</span>
                  <h2>{profile?.user?.name || profile?.name || "Current User"}</h2>
                  <p>{profile?.user?.email || profile?.email || "Authenticated FraudShield account"}</p>
                </div>
              </div>

              <div className="urp-risk-score">
                <div className="urp-score-ring" style={{"--score": `${riskScore}%`, "--risk": riskColor}}>
                  <strong>{riskScore}</strong>
                  <span>/100</span>
                </div>
                <div>
                  <span>OVERALL RISK</span>
                  <b style={{color: riskColor}}>{riskLevel}</b>
                  <small>{riskMessage}</small>
                </div>
              </div>
            </section>

            <section className="urp-stat-grid">
              <Stat icon={Activity} label="Transactions" value={stats.transactions}/>
              <Stat icon={Bell} label="Fraud Alerts" value={stats.alerts}/>
              <Stat icon={Ban} label="Blocked" value={stats.blocked} danger/>
              <Stat icon={TrendingUp} label="Average Risk" value={`${averageRisk}/100`}/>
              <Stat icon={AlertTriangle} label="High Risk" value={highRisk} danger/>
              <Stat icon={CheckCircle} label="Allowed" value={allowed}/>
              <Stat icon={Eye} label="Needs Review" value={review}/>
              <Stat icon={ShieldCheck} label="Current Score" value={`${riskScore}/100`}/>
            </section>

            <section className="urp-grid-3">
              <EntityCard icon={Smartphone} title="Devices" value={stats.devices} items={devices}/>
              <EntityCard icon={CreditCard} title="Beneficiaries" value={stats.beneficiaries} items={beneficiaries}/>
              <EntityCard icon={MapPin} title="Locations" value={stats.locations} items={locations}/>
            </section>

            <section className="urp-card">
              <div className="urp-card-head">
                <div>
                  <span className="urp-mini-label">BEHAVIORAL RISK</span>
                  <h2>Risk Assessment</h2>
                  <p>Current score calculated from the available fraud and transaction signals.</p>
                </div>
                <Shield size={23}/>
              </div>

              <div className="urp-meter-head">
                <span>Overall Risk Score</span>
                <b style={{color: riskColor}}>{riskScore}/100</b>
              </div>
              <div className="urp-meter">
                <div style={{width: `${riskScore}%`, background: riskColor}}/>
              </div>

              <div className="urp-risk-scale">
                <span>0 — LOW</span><span>34 — MEDIUM</span><span>67 — HIGH</span><span>100</span>
              </div>

              {profile?.risk_reasons?.length > 0 && (
                <div className="urp-reasons">
                  <h3><AlertTriangle size={15}/> Why this score?</h3>
                  <div className="urp-reason-grid">
                    {profile.risk_reasons.map((reason, i) => (
                      <div key={i}><span>{i + 1}</span>{reason}</div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="urp-card">
              <div className="urp-card-head">
                <div>
                  <span className="urp-mini-label">TRANSACTION HISTORY</span>
                  <h2>Recent Transactions</h2>
                  <p>Review individual transaction decisions and risk scores.</p>
                </div>
                <Activity size={23}/>
              </div>

              <div className="urp-controls">
                <div className="urp-search">
                  <Search size={15}/>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search transaction, risk or decision..."
                  />
                </div>
                <div className="urp-filters">
                  {["ALL", "BLOCK", "REVIEW", "ALLOW"].map(f => (
                    <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <Empty icon={Activity} title="No transactions found" text="Analyze a transaction to begin building this user's risk history."/>
              ) : (
                <div className="urp-table">
                  <div className="urp-table-head">
                    <span>TRANSACTION</span><span>AMOUNT</span><span>RISK</span><span>DECISION</span><span/>
                  </div>
                  {filteredTransactions.map((t, i) => {
                    const level = String(t.risk_level || "LOW").toUpperCase();
                    const decision = String(t.decision || "REVIEW").toUpperCase();
                    return (
                      <button className="urp-row" key={t.id || t.transaction_id || i} onClick={() => setSelectedTransaction(t)}>
                        <span className="mono">{t.id || t.transaction_id || "—"}</span>
                        <strong>{money(t.amount)}</strong>
                        <span><i className={`risk-dot ${level.toLowerCase()}`}/>{level} · {t.risk_score ?? 0}</span>
                        <b className={`decision ${decision.toLowerCase()}`}>{decision}</b>
                        <ArrowRight size={15}/>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="urp-card">
              <div className="urp-card-head">
                <div>
                  <span className="urp-mini-label">ALERT HISTORY</span>
                  <h2>Recent Fraud Alerts</h2>
                  <p>Fraud events currently associated with this user.</p>
                </div>
                <Bell size={23}/>
              </div>

              {alerts.length === 0 ? (
                <Empty icon={ShieldCheck} title="No fraud alerts" text="No fraud alerts are currently associated with this user."/>
              ) : (
                <div className="urp-alert-list">
                  {alerts.slice(0, 8).map((a, i) => {
                    const level = String(a.risk_level || "LOW").toUpperCase();
                    return (
                      <div className="urp-alert-row" key={a.id || i}>
                        <span className={`alert-icon ${level.toLowerCase()}`}><AlertTriangle size={15}/></span>
                        <div>
                          <strong>{a.transaction_id || a.id || "Fraud Alert"}</strong>
                          <small>{a.decision || "REVIEW"} · Score {a.risk_score ?? 0}/100</small>
                        </div>
                        <b>{money(a.amount)}</b>
                        <span className={`risk-badge ${level.toLowerCase()}`}>{level}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="urp-primary" onClick={() => nav("/alerts")}>
                Open Fraud Alerts <ArrowRight size={15}/>
              </button>
            </section>
          </>
        )}
      </main>

      {selectedTransaction && (
        <div className="urp-modal-backdrop" onClick={() => setSelectedTransaction(null)}>
          <div className="urp-modal" onClick={e => e.stopPropagation()}>
            <button className="urp-close" onClick={() => setSelectedTransaction(null)}><X size={17}/></button>
            <span className="urp-mini-label">TRANSACTION INVESTIGATION</span>
            <h2>{selectedTransaction.id || selectedTransaction.transaction_id || "Transaction"}</h2>
            <p>Review the transaction risk signals associated with this user.</p>

            <div className="urp-detail-grid">
              <Detail label="Amount" value={money(selectedTransaction.amount)}/>
              <Detail label="Risk Score" value={`${selectedTransaction.risk_score ?? 0}/100`}/>
              <Detail label="Risk Level" value={String(selectedTransaction.risk_level || "LOW").toUpperCase()}/>
              <Detail label="Decision" value={String(selectedTransaction.decision || "REVIEW").toUpperCase()}/>
            </div>

            {selectedTransaction.reasons && (
              <div className="urp-modal-reasons">
                <b>Risk signals</b>
                <p>{selectedTransaction.reasons}</p>
              </div>
            )}

            <div className="urp-modal-actions">
              <button className="urp-primary" onClick={() => { setSelectedTransaction(null); nav("/transaction"); }}>
                Open Transaction Analyzer <ArrowRight size={15}/>
              </button>
              <button className="urp-secondary" onClick={() => { setSelectedTransaction(null); nav("/alerts"); }}>
                View Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .urp-page{min-height:100vh;background:#f5f7fb;color:#0f172a;font-family:Inter,Arial,sans-serif}
        .urp-nav{height:70px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:22px;padding:0 28px;position:sticky;top:0;z-index:50}
        .urp-brand{display:flex;align-items:center;gap:10px;border:0;background:none;padding:0;cursor:pointer;text-align:left;min-width:205px}
        .urp-brand-icon{width:40px;height:40px;border-radius:11px;background:#0f172a;color:#fff;display:grid;place-items:center}
        .urp-brand b{display:block;font-size:16px}.urp-brand small{display:block;color:#64748b;font-size:9px;margin-top:2px}
        .urp-nav-links{display:flex;gap:4px;align-items:center;flex:1;overflow:auto}
        .urp-nav-links button{white-space:nowrap;border:0;background:transparent;color:#64748b;padding:9px 10px;border-radius:8px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer}
        .urp-nav-links button:hover,.urp-nav-links button.active{background:#eff6ff;color:#2563eb}
        .urp-logout{border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;cursor:pointer}
        .urp-main{max-width:1280px;margin:auto;padding:28px}
        .urp-topline{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .urp-back,.urp-refresh{border:1px solid #dbe3ed;background:#fff;color:#475569;border-radius:9px;padding:9px 13px;display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;cursor:pointer}
        .urp-refresh{background:#0f172a;color:#fff;border-color:#0f172a}.urp-refresh:disabled{opacity:.55;cursor:not-allowed}
        .urp-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}
        .urp-kicker,.urp-mini-label{font-size:10px;letter-spacing:1.4px;font-weight:900;color:#2563eb}
        .urp-kicker{display:flex;align-items:center;gap:7px}.urp-kicker span{width:7px;height:7px;background:#22c55e;border-radius:50%}
        .urp-heading h1{font-size:31px;margin:9px 0 7px;letter-spacing:-.7px}.urp-heading p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
        .urp-live{padding:9px 12px;border-radius:999px;font-size:10px;font-weight:900;background:#ecfdf5;color:#15803d;border:1px solid #bbf7d0}
        .urp-live.high{background:#fff1f2;color:#dc2626;border-color:#fecdd3}.urp-live.medium{background:#fffbeb;color:#b45309;border-color:#fde68a}
        .urp-error{background:#fff1f2;border:1px solid #fecdd3;color:#be123c;border-radius:11px;padding:13px;display:flex;align-items:center;gap:9px;margin-bottom:18px;font-size:12px}
        .urp-error button{margin-left:auto;border:0;background:#be123c;color:#fff;border-radius:7px;padding:6px 10px;font-weight:700;cursor:pointer}
        .urp-loading{min-height:420px;display:grid;place-items:center;align-content:center;color:#2563eb}.urp-loading h2{color:#0f172a;margin:14px 0 5px;font-size:18px}.urp-loading p{color:#64748b;font-size:12px}
        .spin{animation:urpSpin 1s linear infinite}@keyframes urpSpin{to{transform:rotate(360deg)}}
        .urp-profile-card{background:#0f172a;color:#fff;border-radius:18px;padding:25px;display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:18px;box-shadow:0 12px 30px rgba(15,23,42,.12)}
        .urp-identity{display:flex;align-items:center;gap:15px}.urp-avatar{width:58px;height:58px;border-radius:15px;background:#1e293b;border:1px solid #334155;display:grid;place-items:center;color:#60a5fa}
        .urp-identity .urp-mini-label{color:#60a5fa}.urp-identity h2{margin:5px 0 3px;font-size:21px}.urp-identity p{margin:0;color:#94a3b8;font-size:12px}
        .urp-risk-score{display:flex;align-items:center;gap:14px}.urp-score-ring{width:86px;height:86px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--risk) var(--score),#334155 0);position:relative}
        .urp-score-ring:after{content:"";position:absolute;inset:7px;background:#0f172a;border-radius:50%}.urp-score-ring strong,.urp-score-ring span{position:relative;z-index:1}.urp-score-ring strong{font-size:23px}.urp-score-ring span{font-size:9px;color:#94a3b8;margin-top:20px;margin-left:-22px}
        .urp-risk-score>div:last-child span,.urp-risk-score>div:last-child b,.urp-risk-score>div:last-child small{display:block}.urp-risk-score>div:last-child span{font-size:9px;color:#94a3b8;letter-spacing:1px}.urp-risk-score>div:last-child b{font-size:18px;margin:3px 0}.urp-risk-score>div:last-child small{color:#94a3b8;font-size:10px;max-width:190px}
        .urp-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.urp-stat{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:16px;display:flex;gap:12px;align-items:center}.urp-stat-icon{width:38px;height:38px;border-radius:10px;background:#eff6ff;color:#2563eb;display:grid;place-items:center}.urp-stat.danger .urp-stat-icon{background:#fff1f2;color:#dc2626}.urp-stat span{display:block;color:#64748b;font-size:10px;font-weight:700}.urp-stat strong{display:block;color:#0f172a;font-size:18px;margin-top:3px}
        .urp-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}.urp-entity{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px}.urp-entity-head{display:flex;align-items:center;gap:9px}.urp-entity-head svg{color:#2563eb}.urp-entity-head h3{margin:0;font-size:14px}.urp-entity-count{margin-left:auto;font-weight:900;color:#0f172a}.urp-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}.urp-tag{background:#f8fafc;border:1px solid #e2e8f0;color:#475569;border-radius:7px;padding:7px 9px;font-size:10px;display:flex;align-items:center;gap:5px}.urp-empty-inline{color:#94a3b8;font-size:11px;margin:14px 0 0}
        .urp-card{background:#fff;border:1px solid #e2e8f0;border-radius:15px;padding:21px;margin-bottom:18px}.urp-card-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:18px}.urp-card-head>svg{color:#2563eb}.urp-card-head h2{margin:5px 0 4px;font-size:18px}.urp-card-head p{margin:0;color:#64748b;font-size:11px}.urp-meter-head{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:8px}.urp-meter{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden}.urp-meter>div{height:100%;border-radius:999px;transition:width .5s}.urp-risk-scale{display:flex;justify-content:space-between;color:#94a3b8;font-size:9px;margin-top:7px}.urp-reasons{margin-top:20px;border-top:1px solid #eef2f7;padding-top:16px}.urp-reasons h3{display:flex;align-items:center;gap:7px;font-size:12px;margin:0 0 10px;color:#334155}.urp-reason-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.urp-reason-grid div{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:8px;padding:9px;font-size:11px;display:flex;gap:8px}.urp-reason-grid span{width:18px;height:18px;background:#ffedd5;border-radius:50%;display:grid;place-items:center;font-weight:900}
        .urp-controls{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.urp-search{flex:1 1 280px;border:1px solid #dbe3ed;border-radius:9px;display:flex;align-items:center;gap:8px;padding:0 11px;color:#94a3b8}.urp-search input{border:0;outline:0;width:100%;padding:10px 0;font-size:11px}.urp-filters{display:flex;gap:5px}.urp-filters button{border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}.urp-filters button.selected{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
        .urp-table{border:1px solid #e2e8f0;border-radius:11px;overflow:hidden}.urp-table-head,.urp-row{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr 25px;align-items:center;gap:10px;padding:11px 13px}.urp-table-head{background:#f8fafc;color:#94a3b8;font-size:9px;font-weight:900}.urp-row{width:100%;border:0;border-top:1px solid #eef2f7;background:#fff;text-align:left;cursor:pointer;color:#475569;font-size:11px}.urp-row:hover{background:#f8fbff}.urp-row .mono{font-family:monospace;color:#334155}.urp-row strong{color:#0f172a}.urp-row>svg{color:#94a3b8}.risk-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}.risk-dot.high{background:#ef4444}.risk-dot.medium{background:#f59e0b}.risk-dot.low{background:#22c55e}.decision{font-size:9px}.decision.block{color:#dc2626}.decision.review{color:#d97706}.decision.allow{color:#16a34a}
        .urp-alert-list{display:flex;flex-direction:column}.urp-alert-row{display:grid;grid-template-columns:36px 1fr auto auto;align-items:center;gap:11px;padding:12px 0;border-top:1px solid #eef2f7}.alert-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center}.alert-icon.high{background:#fff1f2;color:#dc2626}.alert-icon.medium{background:#fffbeb;color:#d97706}.alert-icon.low{background:#ecfdf5;color:#16a34a}.urp-alert-row strong{display:block;font-size:11px;color:#334155}.urp-alert-row small{display:block;color:#94a3b8;font-size:9px;margin-top:3px}.urp-alert-row>b{font-size:11px;color:#0f172a}.risk-badge{font-size:9px;font-weight:900;padding:5px 8px;border-radius:6px}.risk-badge.high{background:#fff1f2;color:#dc2626}.risk-badge.medium{background:#fffbeb;color:#d97706}.risk-badge.low{background:#ecfdf5;color:#16a34a}
        .urp-primary,.urp-secondary{border-radius:8px;padding:9px 13px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.urp-primary{border:0;background:#2563eb;color:#fff}.urp-secondary{border:1px solid #dbe3ed;background:#fff;color:#475569}.urp-card>.urp-primary{margin-top:17px}
        .urp-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.58);display:grid;place-items:center;padding:20px;z-index:200}.urp-modal{width:min(560px,100%);background:#fff;border-radius:16px;padding:24px;position:relative;box-shadow:0 25px 70px rgba(0,0,0,.25)}.urp-close{position:absolute;right:15px;top:15px;border:0;background:#f1f5f9;color:#64748b;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.urp-modal h2{margin:7px 0 4px;font-size:20px}.urp-modal>p{margin:0;color:#64748b;font-size:11px}.urp-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:18px}.urp-detail{padding:13px;background:#f8fafc;border-radius:9px}.urp-detail span{display:block;color:#94a3b8;font-size:9px;font-weight:800}.urp-detail b{display:block;margin-top:5px;font-size:13px;color:#0f172a}.urp-modal-reasons{margin-top:14px;padding:13px;background:#eff6ff;border-radius:9px;color:#1e3a8a;font-size:11px}.urp-modal-reasons p{margin:6px 0 0;white-space:pre-wrap;line-height:1.5}.urp-modal-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}
        .urp-empty{padding:35px;text-align:center;color:#94a3b8}.urp-empty svg{margin:auto}.urp-empty h3{margin:10px 0 4px;color:#334155;font-size:14px}.urp-empty p{margin:0;font-size:11px}

        /* =====================================================
           FRAUDSHIELD GLOBAL DARK MODE
           Works with the theme toggle by supporting:
           html[data-theme="dark"], html.dark, body.dark
        ===================================================== */

        html[data-theme="dark"] .urp-page,
        html.dark .urp-page,
        body.dark .urp-page {
          background: #07111f;
          color: #e5edf7;
        }

        html[data-theme="dark"] .urp-nav,
        html.dark .urp-nav,
        body.dark .urp-nav {
          background: #0b1726;
          border-bottom-color: rgba(148,163,184,.16);
        }

        html[data-theme="dark"] .urp-brand,
        html.dark .urp-brand,
        body.dark .urp-brand {
          color: #f8fafc;
        }

        html[data-theme="dark"] .urp-brand small,
        html.dark .urp-brand small,
        body.dark .urp-brand small {
          color: #7f93a8;
        }

        html[data-theme="dark"] .urp-brand-icon,
        html.dark .urp-brand-icon,
        body.dark .urp-brand-icon {
          background: #17263a;
          color: #f8fafc;
          border: 1px solid rgba(148,163,184,.18);
        }

        html[data-theme="dark"] .urp-nav-links button,
        html.dark .urp-nav-links button,
        body.dark .urp-nav-links button {
          color: #8fa2b6;
        }

        html[data-theme="dark"] .urp-nav-links button:hover,
        html[data-theme="dark"] .urp-nav-links button.active,
        html.dark .urp-nav-links button:hover,
        html.dark .urp-nav-links button.active,
        body.dark .urp-nav-links button:hover,
        body.dark .urp-nav-links button.active {
          background: rgba(59,130,246,.12);
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-logout,
        html.dark .urp-logout,
        body.dark .urp-logout {
          background: #101f32;
          border-color: rgba(148,163,184,.20);
          color: #cbd5e1;
        }

        html[data-theme="dark"] .urp-logout:hover,
        html.dark .urp-logout:hover,
        body.dark .urp-logout:hover {
          background: #14263b;
          border-color: rgba(96,165,250,.35);
          color: #93c5fd;
        }

        html[data-theme="dark"] .urp-back,
        html.dark .urp-back,
        body.dark .urp-back {
          background: #0d1a2a;
          border-color: rgba(148,163,184,.20);
          color: #cbd5e1;
        }

        html[data-theme="dark"] .urp-back:hover,
        html.dark .urp-back:hover,
        body.dark .urp-back:hover {
          background: #14263b;
          border-color: rgba(96,165,250,.35);
          color: #93c5fd;
        }

        html[data-theme="dark"] .urp-refresh,
        html.dark .urp-refresh,
        body.dark .urp-refresh {
          background: #17263a;
          border-color: #17263a;
          color: #f8fafc;
        }

        html[data-theme="dark"] .urp-heading h1,
        html.dark .urp-heading h1,
        body.dark .urp-heading h1 {
          color: #f8fafc;
        }

        html[data-theme="dark"] .urp-heading p,
        html.dark .urp-heading p,
        body.dark .urp-heading p {
          color: #91a4b9;
        }

        html[data-theme="dark"] .urp-kicker,
        html[data-theme="dark"] .urp-mini-label,
        html.dark .urp-kicker,
        html.dark .urp-mini-label,
        body.dark .urp-kicker,
        body.dark .urp-mini-label {
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-live,
        html.dark .urp-live,
        body.dark .urp-live {
          background: rgba(16,185,129,.10);
          color: #6ee7b7;
          border-color: rgba(52,211,153,.25);
        }

        html[data-theme="dark"] .urp-live.high,
        html.dark .urp-live.high,
        body.dark .urp-live.high {
          background: rgba(239,68,68,.10);
          color: #fca5a5;
          border-color: rgba(248,113,113,.25);
        }

        html[data-theme="dark"] .urp-live.medium,
        html.dark .urp-live.medium,
        body.dark .urp-live.medium {
          background: rgba(245,158,11,.10);
          color: #fcd34d;
          border-color: rgba(251,191,36,.25);
        }

        html[data-theme="dark"] .urp-error,
        html.dark .urp-error,
        body.dark .urp-error {
          background: rgba(239,68,68,.10);
          border-color: rgba(248,113,113,.25);
          color: #fca5a5;
        }

        html[data-theme="dark"] .urp-error button,
        html.dark .urp-error button,
        body.dark .urp-error button {
          background: #dc2626;
          color: #fff;
        }

        html[data-theme="dark"] .urp-loading h2,
        html.dark .urp-loading h2,
        body.dark .urp-loading h2 {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .urp-loading p,
        html.dark .urp-loading p,
        body.dark .urp-loading p {
          color: #7f93a8;
        }

        /* Main profile card remains dark, but gets a richer dark-mode surface. */
        html[data-theme="dark"] .urp-profile-card,
        html.dark .urp-profile-card,
        body.dark .urp-profile-card {
          background: #0d182a;
          box-shadow: 0 18px 45px rgba(0,0,0,.32);
          border: 1px solid rgba(96,165,250,.10);
        }

        html[data-theme="dark"] .urp-avatar,
        html.dark .urp-avatar,
        body.dark .urp-avatar {
          background: #16263a;
          border-color: rgba(148,163,184,.22);
        }

        html[data-theme="dark"] .urp-identity p,
        html.dark .urp-identity p,
        body.dark .urp-identity p {
          color: #91a4b9;
        }

        html[data-theme="dark"] .urp-risk-score>div:last-child span,
        html[data-theme="dark"] .urp-risk-score>div:last-child small,
        html.dark .urp-risk-score>div:last-child span,
        html.dark .urp-risk-score>div:last-child small,
        body.dark .urp-risk-score>div:last-child span,
        body.dark .urp-risk-score>div:last-child small {
          color: #8195aa;
        }

        html[data-theme="dark"] .urp-score-ring:after,
        html.dark .urp-score-ring:after,
        body.dark .urp-score-ring:after {
          background: #0d182a;
        }

        html[data-theme="dark"] .urp-stat,
        html.dark .urp-stat,
        body.dark .urp-stat,
        html[data-theme="dark"] .urp-entity,
        html.dark .urp-entity,
        body.dark .urp-entity,
        html[data-theme="dark"] .urp-card,
        html.dark .urp-card,
        body.dark .urp-card {
          background: #0d1a2a;
          border-color: rgba(148,163,184,.16);
          box-shadow: 0 14px 35px rgba(0,0,0,.18);
        }

        html[data-theme="dark"] .urp-stat-icon,
        html.dark .urp-stat-icon,
        body.dark .urp-stat-icon {
          background: rgba(59,130,246,.11);
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-stat.danger .urp-stat-icon,
        html.dark .urp-stat.danger .urp-stat-icon,
        body.dark .urp-stat.danger .urp-stat-icon {
          background: rgba(239,68,68,.11);
          color: #f87171;
        }

        html[data-theme="dark"] .urp-stat span,
        html.dark .urp-stat span,
        body.dark .urp-stat span {
          color: #8195aa;
        }

        html[data-theme="dark"] .urp-stat strong,
        html.dark .urp-stat strong,
        body.dark .urp-stat strong {
          color: #f1f5f9;
        }

        html[data-theme="dark"] .urp-entity-head h3,
        html.dark .urp-entity-head h3,
        body.dark .urp-entity-head h3 {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .urp-entity-count,
        html.dark .urp-entity-count,
        body.dark .urp-entity-count {
          color: #f8fafc;
        }

        html[data-theme="dark"] .urp-entity-head svg,
        html.dark .urp-entity-head svg,
        body.dark .urp-entity-head svg {
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-tag,
        html.dark .urp-tag,
        body.dark .urp-tag {
          background: #0a1625;
          border-color: rgba(148,163,184,.16);
          color: #a7b5c7;
        }

        html[data-theme="dark"] .urp-empty-inline,
        html.dark .urp-empty-inline,
        body.dark .urp-empty-inline {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-card-head h2,
        html.dark .urp-card-head h2,
        body.dark .urp-card-head h2 {
          color: #f1f5f9;
        }

        html[data-theme="dark"] .urp-card-head p,
        html.dark .urp-card-head p,
        body.dark .urp-card-head p {
          color: #8195aa;
        }

        html[data-theme="dark"] .urp-card-head>svg,
        html.dark .urp-card-head>svg,
        body.dark .urp-card-head>svg {
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-meter,
        html.dark .urp-meter,
        body.dark .urp-meter {
          background: #223247;
        }

        html[data-theme="dark"] .urp-risk-scale,
        html.dark .urp-risk-scale,
        body.dark .urp-risk-scale {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-reasons,
        html.dark .urp-reasons,
        body.dark .urp-reasons {
          border-top-color: rgba(148,163,184,.13);
        }

        html[data-theme="dark"] .urp-reasons h3,
        html.dark .urp-reasons h3,
        body.dark .urp-reasons h3 {
          color: #cbd5e1;
        }

        html[data-theme="dark"] .urp-reason-grid div,
        html.dark .urp-reason-grid div,
        body.dark .urp-reason-grid div {
          background: rgba(154,52,18,.11);
          border-color: rgba(251,146,60,.28);
          color: #fdba74;
        }

        html[data-theme="dark"] .urp-reason-grid span,
        html.dark .urp-reason-grid span,
        body.dark .urp-reason-grid span {
          background: rgba(251,146,60,.16);
          color: #fed7aa;
        }

        html[data-theme="dark"] .urp-search,
        html.dark .urp-search,
        body.dark .urp-search {
          background: #081522;
          border-color: rgba(148,163,184,.20);
          color: #71859a;
        }

        html[data-theme="dark"] .urp-search input,
        html.dark .urp-search input,
        body.dark .urp-search input {
          background: transparent;
          color: #e2e8f0;
        }

        html[data-theme="dark"] .urp-search input::placeholder,
        html.dark .urp-search input::placeholder,
        body.dark .urp-search input::placeholder {
          color: #60758a;
        }

        html[data-theme="dark"] .urp-filters button,
        html.dark .urp-filters button,
        body.dark .urp-filters button {
          background: #0a1625;
          border-color: rgba(148,163,184,.18);
          color: #91a4b9;
        }

        html[data-theme="dark"] .urp-filters button:hover,
        html.dark .urp-filters button:hover,
        body.dark .urp-filters button:hover {
          background: #122238;
          color: #93c5fd;
        }

        html[data-theme="dark"] .urp-filters button.selected,
        html.dark .urp-filters button.selected,
        body.dark .urp-filters button.selected {
          background: rgba(59,130,246,.12);
          border-color: rgba(96,165,250,.30);
          color: #60a5fa;
        }

        html[data-theme="dark"] .urp-table,
        html.dark .urp-table,
        body.dark .urp-table {
          border-color: rgba(148,163,184,.16);
        }

        html[data-theme="dark"] .urp-table-head,
        html.dark .urp-table-head,
        body.dark .urp-table-head {
          background: #0a1625;
          color: #71859a;
        }

        html[data-theme="dark"] .urp-row,
        html.dark .urp-row,
        body.dark .urp-row {
          background: #0d1a2a;
          border-top-color: rgba(148,163,184,.12);
          color: #a7b5c7;
        }

        html[data-theme="dark"] .urp-row:hover,
        html.dark .urp-row:hover,
        body.dark .urp-row:hover {
          background: #112238;
        }

        html[data-theme="dark"] .urp-row .mono,
        html.dark .urp-row .mono,
        body.dark .urp-row .mono {
          color: #a9bad0;
        }

        html[data-theme="dark"] .urp-row strong,
        html.dark .urp-row strong,
        body.dark .urp-row strong {
          color: #f1f5f9;
        }

        html[data-theme="dark"] .urp-row>svg,
        html.dark .urp-row>svg,
        body.dark .urp-row>svg {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-alert-row,
        html.dark .urp-alert-row,
        body.dark .urp-alert-row {
          border-top-color: rgba(148,163,184,.12);
        }

        html[data-theme="dark"] .alert-icon.high,
        html.dark .alert-icon.high,
        body.dark .alert-icon.high {
          background: rgba(239,68,68,.11);
          color: #f87171;
        }

        html[data-theme="dark"] .alert-icon.medium,
        html.dark .alert-icon.medium,
        body.dark .alert-icon.medium {
          background: rgba(245,158,11,.11);
          color: #fbbf24;
        }

        html[data-theme="dark"] .alert-icon.low,
        html.dark .alert-icon.low,
        body.dark .alert-icon.low {
          background: rgba(16,185,129,.11);
          color: #34d399;
        }

        html[data-theme="dark"] .urp-alert-row strong,
        html.dark .urp-alert-row strong,
        body.dark .urp-alert-row strong {
          color: #dbe5ef;
        }

        html[data-theme="dark"] .urp-alert-row small,
        html.dark .urp-alert-row small,
        body.dark .urp-alert-row small {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-alert-row>b,
        html.dark .urp-alert-row>b,
        body.dark .urp-alert-row>b {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .risk-badge.high,
        html.dark .risk-badge.high,
        body.dark .risk-badge.high {
          background: rgba(239,68,68,.11);
          color: #fca5a5;
        }

        html[data-theme="dark"] .risk-badge.medium,
        html.dark .risk-badge.medium,
        body.dark .risk-badge.medium {
          background: rgba(245,158,11,.11);
          color: #fcd34d;
        }

        html[data-theme="dark"] .risk-badge.low,
        html.dark .risk-badge.low,
        body.dark .risk-badge.low {
          background: rgba(16,185,129,.11);
          color: #6ee7b7;
        }

        html[data-theme="dark"] .urp-secondary,
        html.dark .urp-secondary,
        body.dark .urp-secondary {
          background: #0d1a2a;
          border-color: rgba(148,163,184,.20);
          color: #cbd5e1;
        }

        html[data-theme="dark"] .urp-secondary:hover,
        html.dark .urp-secondary:hover,
        body.dark .urp-secondary:hover {
          background: #14263b;
          border-color: rgba(96,165,250,.35);
          color: #93c5fd;
        }

        html[data-theme="dark"] .urp-modal-backdrop,
        html.dark .urp-modal-backdrop,
        body.dark .urp-modal-backdrop {
          background: rgba(0,0,0,.72);
        }

        html[data-theme="dark"] .urp-modal,
        html.dark .urp-modal,
        body.dark .urp-modal {
          background: #0d1a2a;
          border: 1px solid rgba(148,163,184,.18);
          box-shadow: 0 25px 80px rgba(0,0,0,.45);
          color: #e2e8f0;
        }

        html[data-theme="dark"] .urp-close,
        html.dark .urp-close,
        body.dark .urp-close {
          background: #17263a;
          color: #9fb0c4;
        }

        html[data-theme="dark"] .urp-modal h2,
        html.dark .urp-modal h2,
        body.dark .urp-modal h2 {
          color: #f8fafc;
        }

        html[data-theme="dark"] .urp-modal>p,
        html.dark .urp-modal>p,
        body.dark .urp-modal>p {
          color: #8195aa;
        }

        html[data-theme="dark"] .urp-detail,
        html.dark .urp-detail,
        body.dark .urp-detail {
          background: #0a1625;
          border: 1px solid rgba(148,163,184,.13);
        }

        html[data-theme="dark"] .urp-detail span,
        html.dark .urp-detail span,
        body.dark .urp-detail span {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-detail b,
        html.dark .urp-detail b,
        body.dark .urp-detail b {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .urp-modal-reasons,
        html.dark .urp-modal-reasons,
        body.dark .urp-modal-reasons {
          background: rgba(59,130,246,.10);
          color: #93c5fd;
          border: 1px solid rgba(96,165,250,.18);
        }

        html[data-theme="dark"] .urp-empty,
        html.dark .urp-empty,
        body.dark .urp-empty {
          color: #71859a;
        }

        html[data-theme="dark"] .urp-empty h3,
        html.dark .urp-empty h3,
        body.dark .urp-empty h3 {
          color: #dbe5ef;
        }

        /* Browser autofill/search fields stay dark instead of flashing white. */
        html[data-theme="dark"] .urp-page input:-webkit-autofill,
        html[data-theme="dark"] .urp-page input:-webkit-autofill:hover,
        html[data-theme="dark"] .urp-page input:-webkit-autofill:focus,
        html.dark .urp-page input:-webkit-autofill,
        html.dark .urp-page input:-webkit-autofill:hover,
        html.dark .urp-page input:-webkit-autofill:focus,
        body.dark .urp-page input:-webkit-autofill,
        body.dark .urp-page input:-webkit-autofill:hover,
        body.dark .urp-page input:-webkit-autofill:focus {
          -webkit-text-fill-color: #e2e8f0 !important;
          -webkit-box-shadow: 0 0 0 1000px #081522 inset !important;
          box-shadow: 0 0 0 1000px #081522 inset !important;
          background-color: #081522 !important;
          caret-color: #fff !important;
        }

        @media(max-width:1050px){.urp-nav-links{display:none}.urp-stat-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:750px){.urp-main{padding:18px 14px}.urp-heading,.urp-profile-card{flex-direction:column}.urp-grid-3{grid-template-columns:1fr}.urp-stat-grid{grid-template-columns:repeat(2,1fr)}.urp-profile-card{align-items:flex-start}.urp-table-head{display:none}.urp-row{grid-template-columns:1fr auto}.urp-row>span:nth-child(2),.urp-row>span:nth-child(3){display:none}.urp-alert-row{grid-template-columns:34px 1fr auto}.urp-alert-row>b{display:none}.urp-nav{padding:0 14px}.urp-brand{min-width:auto}.urp-brand small{display:none}}
        @media(max-width:450px){.urp-stat-grid{grid-template-columns:1fr}.urp-filters{width:100%}.urp-filters button{flex:1}.urp-risk-score{width:100%}.urp-detail-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

function Stat({ icon: Icon, label, value, danger }) {
  return (
    <div className={`urp-stat ${danger ? "danger" : ""}`}>
      <div className="urp-stat-icon"><Icon size={18}/></div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

function EntityCard({ icon: Icon, title, value, items }) {
  return (
    <div className="urp-entity">
      <div className="urp-entity-head">
        <Icon size={18}/><h3>{title}</h3><span className="urp-entity-count">{value}</span>
      </div>
      {items.length ? (
        <div className="urp-tags">
          {items.slice(0, 8).map((item, i) => {
            const text =
              typeof item === "string"
                ? item
                : item?.device_id || item?.beneficiary_id || item?.location || item?.name || item?.id || "Unknown";
            return <span className="urp-tag" key={i}><Icon size={12}/>{text}</span>;
          })}
        </div>
      ) : (
        <p className="urp-empty-inline">No identifiers recorded yet.</p>
      )}
    </div>
  );
}

function Empty({ icon: Icon, title, text }) {
  return (
    <div className="urp-empty">
      <Icon size={34}/>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="urp-detail"><span>{label}</span><b>{value}</b></div>;
}

export default UserRiskProfile;