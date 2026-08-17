import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Ban,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  IndianRupee,
} from "lucide-react";

function FraudAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setError("");
      if (analytics) setRefreshing(true);
      else setLoading(true);

      const response = await api.get("/api/fraud/analytics");
      setAnalytics(response.data);
    } catch (err) {
      console.error("Analytics error:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (
        err.code === "ERR_NETWORK" ||
        err.message === "Network Error"
      ) {
        setError(
          "Cannot connect to FraudShield backend. Make sure FastAPI is running on port 8000."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load fraud analytics."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const data = analytics || {};
  const summary = data.summary || {};
  const risk = data.risk_distribution || {};
  const decisions = data.decisions || {};
  const feedback = data.analyst_feedback || {};
  const topSignals = data.top_risk_signals || [];

  const totalRisk = Number(risk.HIGH || 0) +
    Number(risk.MEDIUM || 0) +
    Number(risk.LOW || 0);

  const getPercentage = (value) =>
    totalRisk ? Math.round((Number(value || 0) / totalRisk) * 100) : 0;

  const fraudConfirmed = Number(feedback.CONFIRMED_FRAUD || 0);
  const falsePositive = Number(feedback.FALSE_POSITIVE || 0);
  const pending = Number(feedback.PENDING || 0);
  const reviewed = fraudConfirmed + falsePositive;
  const falsePositiveRate = reviewed
    ? Math.round((falsePositive / reviewed) * 100)
    : 0;

  const riskRows = useMemo(
    () => [
      { key: "HIGH", label: "High Risk", value: Number(risk.HIGH || 0), tone: "red" },
      { key: "MEDIUM", label: "Medium Risk", value: Number(risk.MEDIUM || 0), tone: "amber" },
      { key: "LOW", label: "Low Risk", value: Number(risk.LOW || 0), tone: "green" },
    ],
    [risk.HIGH, risk.MEDIUM, risk.LOW]
  );

  if (loading) {
    return (
      <div className="fa-page">
        <style>{styles}</style>
        <div className="fa-center">
          <div className="fa-loader"><RefreshCw size={30} /></div>
          <h2>Loading Fraud Intelligence</h2>
          <p>Connecting to the live FraudShield analytics engine…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fa-page">
        <style>{styles}</style>
        <div className="fa-center fa-error">
          <div className="fa-error-icon"><AlertTriangle size={30} /></div>
          <span className="fa-kicker">FRAUDSHIELD AI</span>
          <h2>Unable to load analytics</h2>
          <p>{error}</p>
          <button className="fa-btn primary" onClick={fetchAnalytics}>
            <RefreshCw size={15} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Transactions",
      value: Number(summary.total_transactions || 0).toLocaleString("en-IN"),
      sub: "Transactions analyzed",
      icon: Activity,
      tone: "blue",
    },
    {
      label: "High Risk",
      value: Number(summary.high_risk || 0).toLocaleString("en-IN"),
      sub: `${getPercentage(risk.HIGH)}% of risk-scored activity`,
      icon: ShieldAlert,
      tone: "red",
    },
    {
      label: "Blocked",
      value: Number(summary.blocked || 0).toLocaleString("en-IN"),
      sub: "AI prevention actions",
      icon: Ban,
      tone: "amber",
    },
    {
      label: "Average Risk",
      value: `${Number(summary.average_risk || 0).toFixed(1)}/100`,
      sub: "Platform risk score",
      icon: TrendingUp,
      tone: "green",
    },
  ];

  return (
    <div className="fa-page">
      <style>{styles}</style>

      <main className="fa-shell">
        <section className="fa-hero">
          <div>
            <div className="fa-kicker">
              <span className="fa-live-dot" />
              FRAUD INTELLIGENCE CENTER
            </div>
            <h1>Fraud Analytics</h1>
            <p>
              Real-time intelligence from transaction behavior, AI decisions,
              analyst feedback and detected fraud signals.
            </p>
          </div>

          <button
            className="fa-btn secondary"
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "fa-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh Intelligence"}
          </button>
        </section>

        <section className="fa-status">
          <div className="fa-status-left">
            <div className="fa-status-icon"><ShieldCheck size={18} /></div>
            <div>
              <strong>FraudShield AI Engine</strong>
              <span>Live analytics connected · auto-refresh every 30 seconds</span>
            </div>
          </div>
          <span className="fa-online"><i /> ONLINE</span>
        </section>

        <section className="fa-stats">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className="fa-stat" key={item.label}>
                <div className={`fa-stat-icon ${item.tone}`}><Icon size={19} /></div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.sub}</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="fa-mini-grid">
          <div className="fa-mini">
            <span>Total Alerts</span>
            <strong>{Number(summary.total_alerts || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="fa-mini">
            <span>Amount at Risk</span>
            <strong><IndianRupee size={17} />{Number(summary.amount_at_risk || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="fa-mini">
            <span>Confirmed Fraud</span>
            <strong className="red-text">{fraudConfirmed.toLocaleString("en-IN")}</strong>
          </div>
          <div className="fa-mini">
            <span>False Positive Rate</span>
            <strong className="amber-text">{falsePositiveRate}%</strong>
          </div>
        </section>

        <section className="fa-grid">
          <article className="fa-card">
            <div className="fa-card-head">
              <div>
                <span>RISK DISTRIBUTION</span>
                <h2>Transaction Risk</h2>
                <p>Classification across analyzed transactions.</p>
              </div>
              <ShieldAlert size={20} />
            </div>

            <div className="fa-risk-total">
              <strong>{totalRisk.toLocaleString("en-IN")}</strong>
              <span>risk-scored transactions</span>
            </div>

            <div className="fa-risk-list">
              {riskRows.map((row) => (
                <div className="fa-risk-row" key={row.key}>
                  <div className="fa-risk-meta">
                    <span><i className={`fa-dot ${row.tone}`} />{row.label}</span>
                    <strong>{row.value.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="fa-track">
                    <div
                      className={`fa-fill ${row.tone}`}
                      style={{ width: `${getPercentage(row.value)}%` }}
                    />
                  </div>
                  <small>{getPercentage(row.value)}%</small>
                </div>
              ))}
            </div>
          </article>

          <article className="fa-card">
            <div className="fa-card-head">
              <div>
                <span>AI DECISIONS</span>
                <h2>Transaction Actions</h2>
                <p>Actions recommended by FraudShield AI.</p>
              </div>
              <Activity size={20} />
            </div>

            <div className="fa-decision-grid">
              <div className="fa-decision red">
                <div><Ban size={17} /></div>
                <span>BLOCK</span>
                <strong>{Number(decisions.BLOCK || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div className="fa-decision amber">
                <div><AlertTriangle size={17} /></div>
                <span>REVIEW</span>
                <strong>{Number(decisions.REVIEW || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div className="fa-decision green">
                <div><ShieldCheck size={17} /></div>
                <span>ALLOW</span>
                <strong>{Number(decisions.ALLOW || 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="fa-action-note">
              <span><ArrowUpRight size={14} /> AI decision distribution</span>
              <strong>
                {(
                  Number(decisions.BLOCK || 0) +
                  Number(decisions.REVIEW || 0) +
                  Number(decisions.ALLOW || 0)
                ).toLocaleString("en-IN")} actions
              </strong>
            </div>
          </article>
        </section>

        <section className="fa-grid">
          <article className="fa-card">
            <div className="fa-card-head">
              <div>
                <span>AI EXPLAINABILITY</span>
                <h2>Top Risk Signals</h2>
                <p>Most frequently detected indicators.</p>
              </div>
              <AlertTriangle size={20} />
            </div>

            {topSignals.length === 0 ? (
              <div className="fa-empty">
                <ShieldCheck size={30} />
                <strong>No risk signals detected</strong>
                <span>Signals will appear as transaction activity is analyzed.</span>
              </div>
            ) : (
              <div className="fa-signals">
                {topSignals.slice(0, 8).map((item, index) => (
                  <div className="fa-signal" key={`${item.signal}-${index}`}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span>{item.signal}</span>
                    <strong>{Number(item.count || 0).toLocaleString("en-IN")}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="fa-card">
            <div className="fa-card-head">
              <div>
                <span>ANALYST FEEDBACK</span>
                <h2>Human Review</h2>
                <p>Validation of AI-generated fraud decisions.</p>
              </div>
              <CheckCircle2 size={20} />
            </div>

            <div className="fa-feedback-grid">
              <div className="fa-feedback green">
                <ShieldAlert size={18} />
                <span>Confirmed Fraud</span>
                <strong>{fraudConfirmed}</strong>
              </div>
              <div className="fa-feedback red">
                <XCircle size={18} />
                <span>False Positive</span>
                <strong>{falsePositive}</strong>
              </div>
              <div className="fa-feedback amber">
                <AlertTriangle size={18} />
                <span>Pending</span>
                <strong>{pending}</strong>
              </div>
            </div>

            <div className="fa-review-summary">
              <div><span>Reviewed Alerts</span><strong>{reviewed}</strong></div>
              <div><span>False Positive Rate</span><strong>{falsePositiveRate}%</strong></div>
            </div>
          </article>
        </section>

        <footer className="fa-footer">
          <span><Activity size={13} /> FraudShield AI Analytics</span>
          <span>Live backend data · Protected session</span>
        </footer>
      </main>
    </div>
  );
}

const styles = `
  .fa-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 85% 0%, rgba(37,99,235,.10), transparent 28rem),
      #050d1a;
    color: #e2e8f0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .fa-shell { max-width: 1280px; margin: 0 auto; padding: 30px 24px 40px; }
  .fa-hero { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:18px; }
  .fa-kicker { display:flex; align-items:center; gap:8px; color:#60a5fa; font-size:10px; font-weight:800; letter-spacing:2px; }
  .fa-live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 12px #22c55e; }
  .fa-hero h1 { margin:8px 0 6px; font-size:32px; line-height:1.1; letter-spacing:-.8px; color:#f8fafc; }
  .fa-hero p { margin:0; color:#64748b; max-width:680px; font-size:13px; line-height:1.6; }

  .fa-btn { border:1px solid rgba(96,165,250,.22); border-radius:9px; padding:10px 14px; display:inline-flex; align-items:center; gap:8px; color:#dbeafe; cursor:pointer; font-size:12px; font-weight:700; transition:.2s; }
  .fa-btn.secondary { background:#0b1930; }
  .fa-btn.primary { background:#2563eb; color:white; border-color:#3b82f6; }
  .fa-btn:hover { transform:translateY(-1px); border-color:rgba(96,165,250,.5); }
  .fa-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }

  .fa-status { display:flex; justify-content:space-between; align-items:center; padding:12px 15px; background:rgba(15,35,63,.65); border:1px solid rgba(59,130,246,.14); border-radius:12px; margin-bottom:16px; }
  .fa-status-left { display:flex; align-items:center; gap:10px; }
  .fa-status-icon { width:32px; height:32px; display:grid; place-items:center; border-radius:8px; color:#60a5fa; background:rgba(37,99,235,.12); }
  .fa-status strong { display:block; font-size:12px; }
  .fa-status span { display:block; color:#64748b; font-size:10px; margin-top:2px; }
  .fa-online { display:flex!important; align-items:center; gap:6px; color:#4ade80!important; font-size:10px!important; font-weight:800; letter-spacing:1px; }
  .fa-online i { width:6px; height:6px; background:#4ade80; border-radius:50%; }

  .fa-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:14px; }
  .fa-stat { display:flex; gap:12px; align-items:center; padding:17px; border:1px solid rgba(59,130,246,.13); background:#0a1628; border-radius:13px; box-shadow:0 10px 30px rgba(0,0,0,.15); }
  .fa-stat-icon { width:40px; height:40px; display:grid; place-items:center; border-radius:10px; flex:none; }
  .fa-stat-icon.blue { color:#60a5fa; background:rgba(59,130,246,.12); }
  .fa-stat-icon.red { color:#f87171; background:rgba(239,68,68,.12); }
  .fa-stat-icon.amber { color:#fbbf24; background:rgba(245,158,11,.12); }
  .fa-stat-icon.green { color:#34d399; background:rgba(16,185,129,.12); }
  .fa-stat span,.fa-mini span { display:block; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; }
  .fa-stat strong { display:block; margin-top:3px; color:#f8fafc; font-size:22px; letter-spacing:-.5px; }
  .fa-stat small { display:block; margin-top:2px; color:#475569; font-size:9px; }

  .fa-mini-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
  .fa-mini { padding:13px 15px; background:#071321; border:1px solid rgba(59,130,246,.10); border-radius:10px; }
  .fa-mini strong { display:flex; align-items:center; gap:2px; color:#cbd5e1; font-size:17px; margin-top:4px; }
  .red-text { color:#f87171!important; }
  .amber-text { color:#fbbf24!important; }

  .fa-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:16px; }
  .fa-card { background:linear-gradient(145deg,#0b192d,#081424); border:1px solid rgba(59,130,246,.13); border-radius:14px; padding:19px; box-shadow:0 12px 35px rgba(0,0,0,.18); }
  .fa-card-head { display:flex; justify-content:space-between; gap:15px; margin-bottom:20px; }
  .fa-card-head > svg { color:#3b82f6; flex:none; }
  .fa-card-head span { color:#64748b; font-size:9px; font-weight:800; letter-spacing:1.5px; }
  .fa-card-head h2 { margin:4px 0 3px; color:#e2e8f0; font-size:15px; }
  .fa-card-head p { margin:0; color:#475569; font-size:10px; }

  .fa-risk-total { display:flex; align-items:baseline; gap:8px; padding-bottom:16px; border-bottom:1px solid rgba(59,130,246,.08); }
  .fa-risk-total strong { font-size:28px; color:#f8fafc; }
  .fa-risk-total span { color:#475569; font-size:10px; }
  .fa-risk-list { padding-top:16px; display:flex; flex-direction:column; gap:16px; }
  .fa-risk-meta { display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; margin-bottom:6px; }
  .fa-risk-meta span { display:flex; align-items:center; gap:7px; }
  .fa-risk-meta strong { color:#cbd5e1; }
  .fa-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
  .fa-dot.red { background:#ef4444; box-shadow:0 0 9px rgba(239,68,68,.5); }
  .fa-dot.amber { background:#f59e0b; }
  .fa-dot.green { background:#10b981; }
  .fa-track { height:7px; background:#12243c; border-radius:99px; overflow:hidden; }
  .fa-fill { height:100%; border-radius:99px; min-width:2px; transition:width .5s ease; }
  .fa-fill.red { background:#ef4444; }
  .fa-fill.amber { background:#f59e0b; }
  .fa-fill.green { background:#10b981; }
  .fa-risk-row small { display:block; text-align:right; color:#475569; font-size:9px; margin-top:4px; }

  .fa-decision-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }
  .fa-decision { border:1px solid rgba(255,255,255,.06); background:#071321; border-radius:11px; padding:13px; }
  .fa-decision > div { width:30px; height:30px; display:grid; place-items:center; border-radius:8px; margin-bottom:11px; }
  .fa-decision.red > div { color:#f87171; background:rgba(239,68,68,.12); }
  .fa-decision.amber > div { color:#fbbf24; background:rgba(245,158,11,.12); }
  .fa-decision.green > div { color:#34d399; background:rgba(16,185,129,.12); }
  .fa-decision span { display:block; color:#64748b; font-size:9px; font-weight:800; letter-spacing:1px; }
  .fa-decision strong { display:block; color:#f8fafc; font-size:21px; margin-top:3px; }
  .fa-action-note { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px solid rgba(59,130,246,.08); color:#475569; font-size:10px; }
  .fa-action-note span { display:flex; gap:5px; align-items:center; }
  .fa-action-note strong { color:#94a3b8; }

  .fa-signals { display:flex; flex-direction:column; }
  .fa-signal { display:grid; grid-template-columns:38px 1fr auto; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid rgba(59,130,246,.07); }
  .fa-signal:last-child { border-bottom:0; }
  .fa-signal b { color:#3b82f6; font-family:monospace; font-size:10px; }
  .fa-signal span { color:#cbd5e1; font-size:11px; }
  .fa-signal strong { color:#f8fafc; font-size:12px; }

  .fa-feedback-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }
  .fa-feedback { padding:13px; border-radius:10px; border:1px solid rgba(255,255,255,.05); }
  .fa-feedback.green { color:#34d399; background:rgba(16,185,129,.07); }
  .fa-feedback.red { color:#f87171; background:rgba(239,68,68,.07); }
  .fa-feedback.amber { color:#fbbf24; background:rgba(245,158,11,.07); }
  .fa-feedback span { display:block; color:#64748b; font-size:9px; margin-top:8px; }
  .fa-feedback strong { display:block; color:#f8fafc; font-size:21px; margin-top:2px; }
  .fa-review-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid rgba(59,130,246,.08); margin-top:13px; padding-top:13px; }
  .fa-review-summary span { color:#475569; font-size:9px; }
  .fa-review-summary strong { display:block; color:#cbd5e1; font-size:15px; margin-top:3px; }

  .fa-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:190px; text-align:center; color:#334155; }
  .fa-empty strong { color:#64748b; font-size:12px; margin-top:10px; }
  .fa-empty span { color:#475569; font-size:10px; margin-top:4px; max-width:260px; line-height:1.5; }

  .fa-footer { display:flex; justify-content:space-between; color:#334155; font-size:9px; padding-top:7px; }
  .fa-footer span { display:flex; align-items:center; gap:5px; }

  .fa-center { min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:24px; }
  .fa-center h2 { margin:14px 0 5px; color:#e2e8f0; font-size:18px; }
  .fa-center p { margin:0 0 18px; color:#64748b; font-size:12px; max-width:450px; line-height:1.6; }
  .fa-loader { color:#60a5fa; animation:fa-spin 1s linear infinite; }
  .fa-error-icon { color:#f87171; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); border-radius:12px; padding:13px; }
  .fa-error .fa-kicker { margin-top:15px; }
  .fa-spin { animation:fa-spin 1s linear infinite; }
  @keyframes fa-spin { to { transform:rotate(360deg); } }

  @media (max-width: 900px) {
    .fa-stats,.fa-mini-grid { grid-template-columns:repeat(2,1fr); }
    .fa-grid { grid-template-columns:1fr; }
  }
  @media (max-width: 640px) {
    .fa-shell { padding:20px 14px 30px; }
    .fa-hero { align-items:flex-start; flex-direction:column; }
    .fa-hero h1 { font-size:27px; }
    .fa-status { align-items:flex-start; gap:10px; }
    .fa-online { margin-top:5px; }
    .fa-stats,.fa-mini-grid { grid-template-columns:1fr; }
    .fa-decision-grid,.fa-feedback-grid { grid-template-columns:1fr; }
    .fa-footer { flex-direction:column; gap:7px; }
  }
`;

export default FraudAnalytics;