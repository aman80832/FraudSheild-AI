import { useEffect, useState } from "react";
import api from "../api/api";
import {
  Shield,
  ShieldCheck,
  Bell,
  AlertTriangle,
  RefreshCw,
  IndianRupee,
  Clock,
} from "lucide-react";



function Alert() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function loadAlerts() {
    try {
      setRefreshing(true);
      setError("");

      const response = await api.get(
        "/api/fraud/alerts"
      );

      console.log(
        "Fraud alerts:",
        response.data
      );

      setAlerts(
        Array.isArray(response.data?.alerts)
          ? response.data.alerts
          : []
      );

      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Alert error:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
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
            err.message ||
            "Unable to load fraud alerts."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const unreadCount = alerts.filter(
    (alert) => !alert.is_read
  ).length;

  const highRiskCount = alerts.filter(
    (alert) =>
      String(alert.risk_level || "").toUpperCase() ===
      "HIGH"
  ).length;

  const totalAmountAtRisk = alerts.reduce(
    (total, alert) =>
      total + Number(alert.amount || 0),
    0
  );

  async function markAlertRead(alertId) {
    if (!alertId) return;

    try {
      await api.patch(
        `/api/fraud/alerts/${alertId}/read`
      );

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          String(alert.id) === String(alertId)
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (err) {
      console.error(
        "Mark alert read error:",
        err
      );

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to update this alert."
        );
      }
    }
  }

  return (
    <div className="fs-alert-page">
      <header className="fs-alert-topbar">
        <div className="fs-alert-brand">
          <div className="fs-brand-icon"><ShieldAlertIcon /></div>
          <div>
            <strong>FraudShield AI</strong>
            <span>ENTERPRISE FRAUD INTELLIGENCE</span>
          </div>
        </div>

        <div className="fs-top-status">
          <span className="fs-live-dot" />
          LIVE MONITORING
        </div>

        <div className="fs-top-actions">
          <button
            className={`fs-icon-btn ${autoRefresh ? "is-active" : ""}`}
            onClick={() => setAutoRefresh(current => !current)}
            title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
          >
            <RefreshCw size={15} className={autoRefresh ? "fs-spin-soft" : ""} />
          </button>
          <button
            className="fs-refresh-btn"
            onClick={loadAlerts}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "fs-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Alerts"}
          </button>
        </div>
      </header>

      <main className="fs-alert-main">
        <section className="fs-page-heading">
          <div>
            <div className="fs-kicker"><ShieldCheck size={13} /> SECURITY OPERATIONS</div>
            <h1>Fraud Alert Center</h1>
            <p>Monitor suspicious transactions and investigate real-time fraud signals.</p>
          </div>
          <div className="fs-heading-meta">
            <span className="fs-status-pill"><span /> Protection active</span>
            <span className="fs-updated">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for update"}
            </span>
          </div>
        </section>

        {!loading && !error && (
          <section className="fs-metrics">
            <div className="fs-metric">
              <div className="fs-metric-icon blue"><Bell size={17} /></div>
              <div><span>TOTAL ALERTS</span><strong>{alerts.length}</strong><small>Loaded from backend</small></div>
            </div>
            <div className="fs-metric">
              <div className="fs-metric-icon amber"><EyeIcon /></div>
              <div><span>UNREAD ALERTS</span><strong>{unreadCount}</strong><small>Require attention</small></div>
            </div>
            <div className="fs-metric">
              <div className="fs-metric-icon red"><AlertTriangle size={17} /></div>
              <div><span>HIGH RISK</span><strong>{highRiskCount}</strong><small>Priority investigations</small></div>
            </div>
            <div className="fs-metric">
              <div className="fs-metric-icon green"><IndianRupee size={17} /></div>
              <div><span>AMOUNT AT RISK</span><strong>₹{totalAmountAtRisk.toLocaleString("en-IN")}</strong><small>Suspicious transaction value</small></div>
            </div>
          </section>
        )}

        <section className="fs-alert-toolbar">
          <div>
            <h2>Active Fraud Signals</h2>
            <p>Each alert contains the AI decision and transaction risk context.</p>
          </div>
          <div className="fs-toolbar-badge">
            <span className="fs-live-dot" />
            {autoRefresh ? "Auto-refresh: 30s" : "Auto-refresh paused"}
          </div>
        </section>

        {loading && (
          <div className="fs-state-card">
            <div className="fs-loader"><RefreshCw size={22} className="fs-spin" /></div>
            <h2>Loading fraud alerts</h2>
            <p>Connecting to the FraudShield backend.</p>
          </div>
        )}

        {!loading && error && (
          <div className="fs-state-card fs-error-state">
            <div className="fs-state-icon"><AlertTriangle size={22} /></div>
            <h2>Unable to load alerts</h2>
            <p>{error}</p>
            <button className="fs-primary-btn" onClick={loadAlerts}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="fs-state-card">
            <div className="fs-state-icon fs-success"><ShieldCheck size={24} /></div>
            <h2>No Fraud Alerts</h2>
            <p>There are currently no suspicious transactions requiring attention.</p>
          </div>
        )}

        {!loading && !error && alerts.length > 0 && (
          <section className="fs-alert-list">
            {alerts.map((alert) => {
              const risk = String(alert.risk_level || "LOW").toUpperCase();
              const riskClass = risk === "HIGH" ? "high" : risk === "MEDIUM" ? "medium" : "low";
              const decision = String(alert.decision || "PENDING").toUpperCase();

              return (
                <article className={`fs-alert-card ${riskClass}`} key={alert.id}>
                  <div className="fs-alert-card-header">
                    <div className="fs-alert-title">
                      <div className="fs-alert-id-row">
                        <span>ALERT #{alert.id}</span>
                        <span className={`fs-risk-badge ${riskClass}`}>
                          <span className="fs-risk-dot" /> {risk}
                        </span>
                      </div>
                      <h3>{alert.message || "Suspicious transaction detected"}</h3>
                    </div>
                    <div className={`fs-decision ${decision.toLowerCase()}`}>{decision}</div>
                  </div>

                  <div className="fs-alert-data">
                    <div><span>TRANSACTION</span><strong>#{alert.transaction_id || "—"}</strong></div>
                    <div><span>AMOUNT</span><strong>₹{Number(alert.amount || 0).toLocaleString("en-IN")}</strong></div>
                    <div><span>RISK SCORE</span><strong>{alert.risk_score ?? 0}/100</strong></div>
                    <div><span>DETECTED</span><strong>{alert.created_at ? new Date(alert.created_at).toLocaleString("en-IN") : "Unknown"}</strong></div>
                  </div>

                  <div className="fs-alert-card-footer">
                    <div className={alert.is_read ? "fs-read" : "fs-unread"}>
                      <span className="fs-small-dot" />
                      {alert.is_read ? "Read" : "Unread"}
                    </div>

                    <div className="fs-footer-actions">
                      {!alert.is_read && (
                        <button className="fs-mark-read" onClick={() => markAlertRead(alert.id)}>
                          <ShieldCheck size={13} /> Mark as read
                        </button>
                      )}
                      <span className="fs-time">
                        <Clock size={12} />
                        {alert.created_at ? new Date(alert.created_at).toLocaleString("en-IN") : "Unknown time"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <style>{`
        .fs-alert-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 85% 0%, rgba(37,99,235,.10), transparent 30%),
            #05101f;
          color: #e2e8f0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .fs-alert-page * { box-sizing: border-box; }

        .fs-alert-topbar {
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 28px;
          background: rgba(7,17,31,.96);
          border-bottom: 1px solid rgba(59,130,246,.12);
          backdrop-filter: blur(12px);
        }

        .fs-alert-brand { display:flex; align-items:center; gap:10px; min-width:260px; }
        .fs-brand-icon {
          width:34px; height:34px; border-radius:9px; display:grid; place-items:center;
          color:white; background:#2563eb; box-shadow:0 8px 24px rgba(37,99,235,.25);
        }
        .fs-alert-brand strong { display:block; font-size:14px; color:#f8fafc; }
        .fs-alert-brand span { display:block; margin-top:2px; color:#3b82f6; font-size:8px; font-weight:800; letter-spacing:2px; }

        .fs-top-status {
          display:flex; align-items:center; gap:7px; margin-left:auto;
          color:#34d399; font-size:10px; font-weight:800; letter-spacing:1px;
        }
        .fs-live-dot { width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 0 4px rgba(52,211,153,.10); animation:fsPulse 1.6s infinite; }
        @keyframes fsPulse { 50% { opacity:.45; transform:scale(.75); } }

        .fs-top-actions { display:flex; gap:8px; }
        .fs-icon-btn, .fs-refresh-btn {
          border:1px solid rgba(59,130,246,.18); background:#0c1a2e; color:#94a3b8;
          border-radius:8px; cursor:pointer; transition:.18s ease;
        }
        .fs-icon-btn { width:34px; height:34px; display:grid; place-items:center; }
        .fs-refresh-btn { height:34px; padding:0 12px; display:flex; align-items:center; gap:7px; font-size:11px; font-weight:700; }
        .fs-icon-btn:hover, .fs-refresh-btn:hover { color:#dbeafe; border-color:rgba(59,130,246,.45); background:#0f2040; }
        .fs-icon-btn.is-active { color:#60a5fa; }
        .fs-icon-btn:disabled, .fs-refresh-btn:disabled { opacity:.55; cursor:not-allowed; }

        .fs-alert-main { width:min(1180px, calc(100% - 32px)); margin:0 auto; padding:34px 0 60px; }
        .fs-page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:25px; }
        .fs-kicker { display:flex; align-items:center; gap:7px; color:#60a5fa; font-size:10px; font-weight:800; letter-spacing:1.8px; margin-bottom:8px; }
        .fs-page-heading h1 { margin:0; font-size:30px; line-height:1.1; letter-spacing:-.5px; color:#f8fafc; }
        .fs-page-heading p { margin:8px 0 0; color:#64748b; font-size:12px; }
        .fs-heading-meta { display:flex; flex-direction:column; align-items:flex-end; gap:7px; }
        .fs-status-pill { display:flex; align-items:center; gap:7px; padding:7px 10px; border:1px solid rgba(52,211,153,.18); background:rgba(16,185,129,.07); border-radius:7px; color:#34d399; font-size:9px; font-weight:800; }
        .fs-status-pill span { width:6px; height:6px; background:#34d399; border-radius:50%; }
        .fs-updated { color:#475569; font-size:10px; }

        .fs-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:27px; }
        .fs-metric {
          min-width:0; display:flex; align-items:center; gap:12px; padding:16px;
          background:#0c1a2e; border:1px solid rgba(59,130,246,.13); border-radius:11px;
          box-shadow:0 12px 28px rgba(0,0,0,.16);
        }
        .fs-metric-icon { width:34px; height:34px; border-radius:9px; display:grid; place-items:center; flex:none; }
        .fs-metric-icon.blue { color:#60a5fa; background:rgba(59,130,246,.12); }
        .fs-metric-icon.amber { color:#fbbf24; background:rgba(245,158,11,.12); }
        .fs-metric-icon.red { color:#f87171; background:rgba(239,68,68,.12); }
        .fs-metric-icon.green { color:#34d399; background:rgba(16,185,129,.12); }
        .fs-metric span { display:block; color:#64748b; font-size:8px; font-weight:800; letter-spacing:1.2px; }
        .fs-metric strong { display:block; margin-top:3px; color:#f8fafc; font-size:20px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
        .fs-metric small { display:block; margin-top:3px; color:#475569; font-size:9px; }

        .fs-alert-toolbar {
          display:flex; align-items:center; justify-content:space-between; gap:15px;
          margin-bottom:12px; padding-top:2px;
        }
        .fs-alert-toolbar h2 { margin:0; color:#e2e8f0; font-size:14px; }
        .fs-alert-toolbar p { margin:4px 0 0; color:#475569; font-size:10px; }
        .fs-toolbar-badge { display:flex; align-items:center; gap:7px; color:#64748b; font-size:9px; }

        .fs-alert-list { display:flex; flex-direction:column; gap:10px; }
        .fs-alert-card {
          position:relative; overflow:hidden; padding:18px;
          background:linear-gradient(180deg, rgba(12,26,46,.98), rgba(9,20,36,.98));
          border:1px solid rgba(59,130,246,.12); border-radius:12px;
          box-shadow:0 12px 28px rgba(0,0,0,.15);
        }
        .fs-alert-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; }
        .fs-alert-card.high::before { background:#ef4444; }
        .fs-alert-card.medium::before { background:#f59e0b; }
        .fs-alert-card.low::before { background:#10b981; }

        .fs-alert-card-header { display:flex; justify-content:space-between; gap:15px; }
        .fs-alert-id-row { display:flex; align-items:center; gap:9px; }
        .fs-alert-id-row > span:first-child { color:#475569; font:800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:1px; }
        .fs-risk-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 7px; border-radius:5px; font-size:8px; font-weight:900; letter-spacing:.8px; }
        .fs-risk-badge.high { color:#f87171; background:rgba(239,68,68,.11); border:1px solid rgba(239,68,68,.2); }
        .fs-risk-badge.medium { color:#fbbf24; background:rgba(245,158,11,.11); border:1px solid rgba(245,158,11,.2); }
        .fs-risk-badge.low { color:#34d399; background:rgba(16,185,129,.11); border:1px solid rgba(16,185,129,.2); }
        .fs-risk-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
        .fs-alert-title h3 { margin:9px 0 0; color:#cbd5e1; font-size:13px; font-weight:600; line-height:1.5; }
        .fs-decision { height:fit-content; padding:5px 8px; border-radius:5px; font-size:8px; font-weight:900; letter-spacing:.7px; border:1px solid transparent; }
        .fs-decision.block { color:#f87171; background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.2); }
        .fs-decision.review { color:#fbbf24; background:rgba(245,158,11,.1); border-color:rgba(245,158,11,.2); }
        .fs-decision.allow { color:#34d399; background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.2); }
        .fs-decision.pending { color:#60a5fa; background:rgba(59,130,246,.1); border-color:rgba(59,130,246,.2); }

        .fs-alert-data { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:17px; padding-top:15px; border-top:1px solid rgba(59,130,246,.07); }
        .fs-alert-data span { display:block; color:#475569; font-size:8px; font-weight:800; letter-spacing:1px; }
        .fs-alert-data strong { display:block; margin-top:5px; color:#cbd5e1; font-size:11px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; word-break:break-word; }

        .fs-alert-card-footer { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:15px; padding-top:12px; border-top:1px solid rgba(59,130,246,.07); }
        .fs-read, .fs-unread { display:flex; align-items:center; gap:6px; font-size:9px; font-weight:700; }
        .fs-read { color:#34d399; } .fs-unread { color:#f87171; }
        .fs-small-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
        .fs-footer-actions { display:flex; align-items:center; gap:10px; }
        .fs-mark-read { display:flex; align-items:center; gap:6px; border:1px solid rgba(59,130,246,.2); background:rgba(59,130,246,.08); color:#60a5fa; border-radius:6px; padding:6px 9px; font-size:9px; font-weight:700; cursor:pointer; }
        .fs-mark-read:hover { background:rgba(59,130,246,.15); }
        .fs-time { display:flex; align-items:center; gap:5px; color:#475569; font-size:9px; }

        .fs-state-card {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          min-height:250px; padding:30px; text-align:center;
          background:#0c1a2e; border:1px solid rgba(59,130,246,.12); border-radius:12px;
        }
        .fs-loader, .fs-state-icon { width:48px; height:48px; display:grid; place-items:center; border-radius:50%; color:#60a5fa; background:rgba(59,130,246,.1); margin-bottom:13px; }
        .fs-state-icon.fs-success { color:#34d399; background:rgba(16,185,129,.1); }
        .fs-error-state .fs-state-icon { color:#f87171; background:rgba(239,68,68,.1); }
        .fs-state-card h2 { margin:0; color:#cbd5e1; font-size:14px; }
        .fs-state-card p { max-width:500px; margin:6px 0 15px; color:#64748b; font-size:11px; line-height:1.6; }
        .fs-primary-btn { display:flex; align-items:center; gap:7px; border:0; border-radius:7px; padding:9px 13px; background:#2563eb; color:white; font-size:10px; font-weight:700; cursor:pointer; }
        .fs-primary-btn:hover { background:#3b82f6; }

        .fs-spin { animation:fsSpin .8s linear infinite; }
        .fs-spin-soft { animation:fsSpin 2s linear infinite; }
        @keyframes fsSpin { to { transform:rotate(360deg); } }

        @media (max-width: 900px) {
          .fs-metrics { grid-template-columns:repeat(2,1fr); }
          .fs-alert-topbar { padding:0 16px; }
          .fs-alert-brand { min-width:0; }
          .fs-top-status { display:none; }
        }
        @media (max-width: 650px) {
          .fs-alert-main { width:min(100% - 20px, 1180px); padding-top:22px; }
          .fs-page-heading { align-items:flex-start; flex-direction:column; }
          .fs-heading-meta { align-items:flex-start; }
          .fs-metrics { grid-template-columns:1fr; }
          .fs-alert-toolbar { align-items:flex-start; flex-direction:column; }
          .fs-alert-data { grid-template-columns:repeat(2,1fr); }
          .fs-alert-card-footer { align-items:flex-start; flex-direction:column; }
          .fs-footer-actions { width:100%; justify-content:space-between; }
          .fs-alert-brand span { display:none; }
          .fs-alert-brand strong { font-size:12px; }
          .fs-refresh-btn { padding:0 9px; }
        }
      `}</style>
    </div>
  );
}

function ShieldAlertIcon() {
  return <Shield size={17} />;
}

function EyeIcon() {
  return <Bell size={17} />;
}
export default Alert;