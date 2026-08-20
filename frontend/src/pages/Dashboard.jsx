import {
  Shield,
  ShieldCheck,
  Mic,
  BarChart3,
  UserCog,
  Network,
  Bell,
  ArrowRight,
  Activity,
  LockKeyhole,
  Smartphone,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Ban,
  IndianRupee,
  TrendingUp,
  Eye,
  CheckCircle2,
  Radio,
  Server,
  Globe2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

function Dashboard() {
  const [userName, setUserName] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const navigate = (path) => {
    window.location.href = path;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_name");
    navigate("/login");
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsError("");
      if (!analytics) setLoadingAnalytics(true);
      else setRefreshing(true);

      const token = localStorage.getItem("access_token");
      if (!token) {
        setAnalyticsError("Please login again to view live analytics.");
        return;
      }

      const response = await fetch(`${API_URL}/api/fraud/analytics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = `Server error: ${response.status}`;
        try {
          const data = await response.json();
          if (data.detail) message = data.detail;
        } catch {}
        throw new Error(message);
      }

      setAnalytics(await response.json());
    } catch (error) {
      console.error("Analytics loading error:", error);
      setAnalyticsError(error.message || "Unable to load fraud analytics.");
    } finally {
      setLoadingAnalytics(false);
      setRefreshing(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/fraud/alerts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Notification server error: ${response.status}`);
      }

      const data = await response.json();
      const alertList = Array.isArray(data) ? data : data?.alerts || [];

      setNotifications(
        alertList
          .slice()
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) - new Date(a.created_at || 0)
          )
          .slice(0, 8)
      );
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // =====================================================
  // LOAD LOGGED-IN USER
  // =====================================================

  const getUserName = (user) => {
    if (!user) return "";

    const rawName =
      user?.name ||
      user?.full_name ||
      user?.fullName ||
      user?.username ||
      user?.first_name ||
      user?.given_name ||
      user?.user?.name ||
      user?.user?.full_name ||
      user?.user?.fullName ||
      user?.user?.username;

    if (rawName) {
      return String(rawName).trim();
    }

    // If the backend did not return a name, use the email only
    // as a last-resort personalized fallback.
    const email =
      user?.email ||
      user?.user?.email ||
      localStorage.getItem("user_email");

    if (email) {
      return String(email)
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
    }

    return "";
  };

  const loadCurrentUser = async () => {
    try {
      // 1. Use the name saved by Login.jsx immediately.
      const savedName = localStorage.getItem("user_name");

      if (savedName?.trim()) {
        setUserName(savedName.trim());
      }

      // 2. Also check the complete user object saved by Login.jsx.
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const name = getUserName(user);

          if (name) {
            const cleanName = String(name).trim();
            setUserName(cleanName);
            localStorage.setItem("user_name", cleanName);
          }
        } catch (error) {
          console.warn("Unable to parse stored user:", error);
        }
      }

      // 3. Ask the backend for the authenticated user.
      // This is the authoritative fallback.
      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const user = data?.user || data;
      const name = getUserName(user);

      if (name) {
        const cleanName = String(name).trim();

        setUserName(cleanName);
        localStorage.setItem("user_name", cleanName);
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error) {
      console.warn("Unable to load logged-in user:", error);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadNotifications();

    const analyticsInterval = setInterval(loadAnalytics, 30000);
    const notificationInterval = setInterval(loadNotifications, 15000);

    return () => {
      clearInterval(analyticsInterval);
      clearInterval(notificationInterval);
    };
  }, []);

  const summary = analytics?.summary || {};
  const distribution = analytics?.risk_distribution || {};
  const decisions = analytics?.decisions || {};
  const feedback = analytics?.analyst_feedback || {};
  const signals = analytics?.top_risk_signals || [];

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const totalRisk =
    Number(distribution.HIGH || 0) +
    Number(distribution.MEDIUM || 0) +
    Number(distribution.LOW || 0);

  const riskPct = (value) =>
    totalRisk
      ? Math.round((Number(value || 0) / totalRisk) * 100)
      : 0;

  const highRiskPercentage = riskPct(distribution.HIGH);
  const mediumRiskPercentage = riskPct(distribution.MEDIUM);
  const lowRiskPercentage = riskPct(distribution.LOW);

  const isUnread = (notification) =>
    notification.is_read === false ||
    notification.is_read === 0 ||
    notification.is_read === undefined;

  const unreadNotifications = notifications.filter(isUnread).length;

  const highRiskAlerts = notifications.filter(
    (notification) =>
      String(notification.risk_level || "").toUpperCase() === "HIGH"
  );

  const unreadHighRiskAlerts =
    highRiskAlerts.filter(isUnread).length;

  const alertAmountAtRisk = notifications.reduce(
    (total, notification) =>
      total + Number(notification.amount || 0),
    0
  );

  const latestAlert = notifications[0] || null;

  const openAlert = (alert) => {
    setNotificationOpen(false);
    if (alert?.id) {
      localStorage.setItem(
        "fraudshield_selected_alert",
        String(alert.id)
      );
    }
    navigate("/alerts");
  };

  return (
    <div className="fs2-page">
      <header className="fs2-navbar">
        <div className="fs2-brand" onClick={() => navigate("/dashboard")}>
          <div className="fs2-brand-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2>FraudShield AI</h2>
            <span>REAL-TIME FRAUD INTELLIGENCE</span>
          </div>
        </div>

        <nav className="fs2-nav">
          <NavItem active icon={<Shield size={14} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <NavItem icon={<Activity size={14} />} label="Transactions" onClick={() => navigate("/transaction")} />
          <NavItem icon={<Mic size={14} />} label="Voice AI" onClick={() => navigate("/voice-phishing")} />
          <NavItem icon={<BarChart3 size={14} />} label="Analytics" onClick={() => navigate("/analytics")} />
          <NavItem icon={<Network size={14} />} label="Network" onClick={() => navigate("/fraud-network")} />
          <NavItem icon={<Smartphone size={14} />} label="Devices" onClick={() => navigate("/device-intelligence")} />
          <NavItem icon={<UserCog size={14} />} label="Risk Profile" onClick={() => navigate("/user-risk")} />
          <NavItem icon={<MapPin size={14} />} label="Geography" onClick={() => navigate("/geographic-fraud")} />
          <NavItem icon={<UserCog size={14} />} label="Analyst" onClick={() => navigate("/admin")} />
        </nav>

        <div className="fs2-nav-actions">
          <div className="fs2-notify-wrap">
            <button
              className="fs2-icon-btn"
              onClick={() => setNotificationOpen((v) => !v)}
              aria-label="Fraud notifications"
            >
              <Bell size={17} />
              {unreadNotifications > 0 && (
                <span className="fs2-badge">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="fs2-notification-panel">
                <div className="fs2-panel-head">
                  <div>
                    <strong>LIVE SECURITY ALERTS</strong>
                    <span>{unreadNotifications} unread events</span>
                  </div>
                  <button
                    className="fs2-mini-btn"
                    onClick={loadNotifications}
                    disabled={notificationsLoading}
                  >
                    <RefreshCw
                      size={13}
                      className={notificationsLoading ? "fs2-spin" : ""}
                    />
                  </button>
                </div>

                <div className="fs2-notification-list">
                  {notifications.length === 0 ? (
                    <div className="fs2-empty">
                      <Bell size={24} />
                      <strong>No active alerts</strong>
                      <span>Suspicious activity will appear here.</span>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const risk = String(
                        notification.risk_level || "HIGH"
                      ).toUpperCase();

                      return (
                        <button
                          key={
                            notification.id ||
                            notification.transaction_id
                          }
                          className="fs2-notification-item"
                          onClick={() => openAlert(notification)}
                        >
                          <div
                            className={`fs2-alert-icon ${
                              risk === "HIGH" ? "danger" : "warning"
                            }`}
                          >
                            {risk === "HIGH" ? (
                              <AlertTriangle size={15} />
                            ) : (
                              <Bell size={15} />
                            )}
                          </div>

                          <div className="fs2-alert-content">
                            <div className="fs2-alert-title">
                              <strong>{risk} RISK</strong>
                              <span className={isUnread(notification) ? "unread" : "read"} />
                            </div>
                            <p>
                              {notification.message ||
                                "Suspicious transaction detected."}
                            </p>
                            <small>
                              {notification.amount != null
                                ? formatCurrency(notification.amount)
                                : "Amount unavailable"}
                              {" • "}
                              {notification.created_at
                                ? new Date(
                                    notification.created_at
                                  ).toLocaleString("en-IN")
                                : "Recently"}
                            </small>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  className="fs2-view-alerts"
                  onClick={() => navigate("/alerts")}
                >
                  View Security Center
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          <button className="fs2-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="fs2-main">
        <section className="fs2-hero">
          <div>
            <div className="fs2-eyebrow">
              <span className="fs2-live-dot" />
              FRAUDSHIELD SECURITY OPERATIONS CENTER
            </div>
            <h1 className="fs2-welcome-title">
              Welcome,{" "}
              <span
                className="notranslate"
                translate="no"
                data-no-translate="true"
              >
                {userName || "User"}
              </span>
              <span className="fs2-welcome-wave"> 👋</span>
              <br />
              <span>Fraud Intelligence Command Center</span>
            </h1>
            <p>
              Real-time transaction monitoring, AI-powered risk analysis
              and coordinated fraud intelligence.
            </p>
          </div>

          <div className="fs2-hero-actions">
            <div className="fs2-system-status">
              <span />
              ALL SYSTEMS OPERATIONAL
            </div>
            <button
              className="fs2-refresh"
              onClick={loadAnalytics}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "fs2-spin" : ""}
              />
              {refreshing ? "SYNCING..." : "SYNC INTELLIGENCE"}
            </button>
          </div>
        </section>

        {latestAlert && (
          <section className="fs2-live-alert">
            <div className="fs2-alert-main">
              <div className="fs2-live-alert-icon">
                <AlertTriangle size={21} />
              </div>
              <div>
                <div className="fs2-alert-kicker">
                  <span>●</span> LIVE FRAUD EVENT
                </div>
                <h3>
                  {String(
                    latestAlert.risk_level || "HIGH"
                  ).toUpperCase()}{" "}
                  RISK TRANSACTION DETECTED
                </h3>
                <p>
                  {latestAlert.message ||
                    "Suspicious transaction detected by FraudShield AI."}
                </p>
                <small>
                  {latestAlert.amount != null
                    ? formatCurrency(latestAlert.amount)
                    : "Amount unavailable"}
                  {" • "}
                  {latestAlert.created_at
                    ? new Date(latestAlert.created_at).toLocaleString("en-IN")
                    : "Recently detected"}
                </small>
              </div>
            </div>

            <div className="fs2-alert-metrics">
              <AlertMini label="UNREAD HIGH RISK" value={unreadHighRiskAlerts} />
              <AlertMini label="ACTIVE ALERTS" value={notifications.length} />
              <AlertMini label="AMOUNT AT RISK" value={formatCurrency(alertAmountAtRisk)} />
              <button onClick={() => navigate("/alerts")}>
                INVESTIGATE <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        <section className="fs2-section">
          <SectionTitle eyebrow="LIVE TELEMETRY" title="Security Overview" />

          {loadingAnalytics && (
            <div className="fs2-loading">
              <RefreshCw size={27} className="fs2-spin" />
              <span>Connecting to fraud detection engine...</span>
            </div>
          )}

          {!loadingAnalytics && analyticsError && (
            <div className="fs2-error">
              <AlertTriangle size={20} />
              <div>
                <strong>Intelligence engine unavailable</strong>
                <p>{analyticsError}</p>
              </div>
              <button onClick={loadAnalytics}>Retry</button>
            </div>
          )}

          {!loadingAnalytics && !analyticsError && analytics && (
            <>
              <div className="fs2-metric-grid">
                <MetricCard
                  icon={<Activity size={20} />}
                  label="TOTAL TRANSACTIONS"
                  value={formatNumber(summary.total_transactions)}
                  description="All analyzed transactions"
                  type="blue"
                  onClick={() => navigate("/transaction")}
                />
                <MetricCard
                  icon={<AlertTriangle size={20} />}
                  label="FRAUD ALERTS"
                  value={formatNumber(summary.total_alerts)}
                  description="Generated security alerts"
                  type="red"
                  onClick={() => navigate("/alerts")}
                />
                <MetricCard
                  icon={<TrendingUp size={20} />}
                  label="HIGH RISK"
                  value={formatNumber(summary.high_risk)}
                  description="High-risk transactions"
                  type="orange"
                  onClick={() => navigate("/alerts")}
                />
                <MetricCard
                  icon={<Ban size={20} />}
                  label="BLOCKED"
                  value={formatNumber(summary.blocked)}
                  description="Transactions prevented"
                  type="purple"
                  onClick={() => navigate("/transaction")}
                />
                <MetricCard
                  icon={<IndianRupee size={20} />}
                  label="AMOUNT AT RISK"
                  value={formatCurrency(summary.amount_at_risk)}
                  description="Suspicious transaction value"
                  type="green"
                />
                <MetricCard
                  icon={<Activity size={20} />}
                  label="AVERAGE RISK"
                  value={Number(summary.average_risk || 0).toFixed(2)}
                  description="Average AI risk score"
                  type="cyan"
                />
              </div>

              <div className="fs2-grid-2">
                <div className="fs2-card">
                  <CardHeading
                    eyebrow="RISK DISTRIBUTION"
                    title="Transaction Risk"
                    icon={<ShieldCheck size={18} />}
                  />

                  <div className="fs2-risk-list">
                    <RiskRow label="HIGH" count={distribution.HIGH || 0} percentage={highRiskPercentage} type="high" />
                    <RiskRow label="MEDIUM" count={distribution.MEDIUM || 0} percentage={mediumRiskPercentage} type="medium" />
                    <RiskRow label="LOW" count={distribution.LOW || 0} percentage={lowRiskPercentage} type="low" />
                  </div>

                  <div className="fs2-risk-total">
                    <span>Total analyzed risk records</span>
                    <strong>{formatNumber(totalRisk)}</strong>
                  </div>
                </div>

                <div className="fs2-card">
                  <CardHeading
                    eyebrow="AI DECISION ENGINE"
                    title="Transaction Actions"
                    icon={<LockKeyhole size={18} />}
                  />

                  <div className="fs2-decision-grid">
                    <DecisionBox icon={<Ban size={16} />} value={decisions.BLOCK || 0} label="BLOCKED" type="danger" />
                    <DecisionBox icon={<Eye size={16} />} value={decisions.REVIEW || 0} label="REVIEW" type="warning" />
                    <DecisionBox icon={<CheckCircle2 size={16} />} value={decisions.ALLOW || 0} label="ALLOWED" type="success" />
                  </div>

                  <div className="fs2-feedback">
                    <span>ANALYST FEEDBACK</span>
                    <div><b>{feedback.PENDING || 0}</b> Pending</div>
                    <div><b>{feedback.CONFIRMED_FRAUD || 0}</b> Confirmed</div>
                    <div><b>{feedback.FALSE_POSITIVE || 0}</b> False Positive</div>
                  </div>
                </div>
              </div>

              <div className="fs2-card fs2-signals">
                <CardHeading
                  eyebrow="AI EXPLAINABILITY"
                  title="Top Risk Signals"
                  icon={<Activity size={18} />}
                />

                {signals.length === 0 ? (
                  <div className="fs2-no-data">No risk signals available.</div>
                ) : (
                  <div className="fs2-signal-grid">
                    {signals.slice(0, 6).map((signal, index) => (
                      <div className="fs2-signal" key={`${signal.signal}-${index}`}>
                        <div className="fs2-signal-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="fs2-signal-text">
                          <strong>{signal.signal}</strong>
                          <span>Risk indicator detected</span>
                        </div>
                        <div className="fs2-signal-count">
                          {signal.count}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="fs2-section">
          <SectionTitle eyebrow="SECURITY MODULES" title="Fraud Intelligence Suite" />

          <div className="fs2-module-grid">
            <ModuleCard icon={<ShieldCheck size={22} />} eyebrow="CORE PROTECTION" title="Transaction Security" description="Analyze UPI transactions using behavioral signals and AI-powered fraud detection." button="Analyze Transaction" onClick={() => navigate("/transaction")} />
            <ModuleCard icon={<Mic size={22} />} eyebrow="SOCIAL ENGINEERING" title="Voice Phishing AI" description="Detect OTP requests, bank impersonation, urgency and phone-scam signals." button="Open Voice Detector" onClick={() => navigate("/voice-phishing")} />
            <ModuleCard icon={<BarChart3 size={22} />} eyebrow="INTELLIGENCE" title="Fraud Analytics" description="Explore risk trends, transaction patterns and fraud activity across the platform." button="View Analytics" onClick={() => navigate("/analytics")} />
            <ModuleCard icon={<Network size={22} />} eyebrow="FRAUD INTELLIGENCE" title="Fraud Network" description="Discover connections between users, transactions, devices, beneficiaries and locations." button="Explore Network" onClick={() => navigate("/fraud-network")} />
            <ModuleCard icon={<Bell size={22} />} eyebrow="REAL-TIME MONITORING" title="Fraud Alerts" description="Monitor suspicious transactions, high-risk activity and blocked transactions." button="Open Alerts" onClick={() => navigate("/alerts")} />
            <ModuleCard icon={<Smartphone size={22} />} eyebrow="DEVICE INTELLIGENCE" title="Device Intelligence" description="Analyze device behavior, suspicious sessions and transaction-device relationships." button="Inspect Devices" onClick={() => navigate("/device-intelligence")} />
            <ModuleCard icon={<UserCog size={22} />} eyebrow="USER INTELLIGENCE" title="User Risk Profile" description="Review behavioral risk, transaction history, fraud activity, devices and geographic risk for a user." button="View Risk Profile" onClick={() => navigate("/user-risk")} />
            <ModuleCard icon={<MapPin size={22} />} eyebrow="GEOGRAPHIC INTELLIGENCE" title="Geographic Fraud" description="Analyze transaction locations and suspicious geographic activity." button="Open Geography" onClick={() => navigate("/geographic-fraud")} />
            <ModuleCard icon={<UserCog size={22} />} eyebrow="OPERATIONS" title="Fraud Analyst Center" description="Review suspicious transactions, alerts and AI fraud decisions." button="Open Analyst Center" onClick={() => navigate("/admin")} />
          </div>
        </section>

        <section className="fs2-status-panel">
          <div className="fs2-status-heading">
            <SectionTitle eyebrow="SYSTEM STATUS" title="FraudShield Infrastructure" />
            <div className="fs2-operational"><span /> OPERATIONAL</div>
          </div>

          <div className="fs2-status-grid">
            <StatusItem icon={<Server size={16} />} label="AI Detection Engine" value="ONLINE" />
            <StatusItem icon={<ShieldCheck size={16} />} label="Transaction Security" value="ACTIVE" />
            <StatusItem icon={<Radio size={16} />} label="Real-Time Monitoring" value="ACTIVE" />
            <StatusItem icon={<Globe2 size={16} />} label="Fraud Intelligence Network" value="READY" />
          </div>
        </section>

        <section className="fs2-quick">
          <SectionTitle eyebrow="QUICK ACCESS" title="Security Operations" />
          <div className="fs2-quick-buttons">
            <QuickButton icon={<Activity size={15} />} label="Transactions" onClick={() => navigate("/transaction")} />
            <QuickButton icon={<Mic size={15} />} label="Voice AI" onClick={() => navigate("/voice-phishing")} />
            <QuickButton icon={<BarChart3 size={15} />} label="Analytics" onClick={() => navigate("/analytics")} />
            <QuickButton icon={<Network size={15} />} label="Network" onClick={() => navigate("/fraud-network")} />
            <QuickButton icon={<Bell size={15} />} label="Alerts" onClick={() => navigate("/alerts")} />
            <QuickButton icon={<Smartphone size={15} />} label="Devices" onClick={() => navigate("/device-intelligence")} />
            <QuickButton icon={<UserCog size={15} />} label="Risk Profile" onClick={() => navigate("/user-risk")} />
            <QuickButton icon={<MapPin size={15} />} label="Geography" onClick={() => navigate("/geographic-fraud")} />
            <QuickButton icon={<UserCog size={15} />} label="Analyst" onClick={() => navigate("/admin")} />
          </div>
        </section>
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #050914; }

        .fs2-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(37,99,235,.12), transparent 28%),
            radial-gradient(circle at 90% 15%, rgba(6,182,212,.07), transparent 25%),
            #050914;
          color: #e5edf8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .fs2-navbar {
          min-height: 70px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 26px;
          background: rgba(5,9,20,.92);
          border-bottom: 1px solid #172033;
          backdrop-filter: blur(18px);
        }

        .fs2-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 215px;
          cursor: pointer;
        }

        .fs2-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg,#2563eb,#06b6d4);
          color: white;
          box-shadow: 0 0 25px rgba(37,99,235,.25);
        }

        .fs2-brand h2 { margin: 0; font-size: 15px; }
        .fs2-brand span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 7px;
          letter-spacing: 1.4px;
          font-weight: 800;
        }

        .fs2-nav {
          display: flex;
          align-items: center;
          gap: 3px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .fs2-nav::-webkit-scrollbar { display: none; }

        .fs2-nav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 9px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: #718096;
          cursor: pointer;
          white-space: nowrap;
          font-size: 9px;
          font-weight: 800;
          transition: .2s;
        }
        .fs2-nav-item:hover { color: #dbeafe; background: #0b1220; }
        .fs2-nav-item.active {
          color: #60a5fa;
          background: #0d1a30;
          border-color: #173b6d;
        }

        .fs2-nav-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .fs2-notify-wrap { position: relative; }
        .fs2-icon-btn, .fs2-mini-btn {
          position: relative;
          display: grid;
          place-items: center;
          border: 1px solid #1c293c;
          border-radius: 8px;
          background: #0a101d;
          color: #94a3b8;
          cursor: pointer;
        }
        .fs2-icon-btn { width: 36px; height: 36px; }
        .fs2-icon-btn:hover { color: #60a5fa; border-color: #24528d; }

        .fs2-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          display: grid;
          place-items: center;
          border: 2px solid #050914;
          border-radius: 99px;
          background: #ef4444;
          color: white;
          font-size: 7px;
          font-weight: 900;
        }

        .fs2-logout {
          padding: 8px 12px;
          border: 1px solid #1c293c;
          border-radius: 7px;
          background: #0a101d;
          color: #94a3b8;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
        }
        .fs2-logout:hover { color: white; border-color: #334155; }

        .fs2-notification-panel {
          position: absolute;
          right: 0;
          top: 45px;
          width: 370px;
          max-width: calc(100vw - 24px);
          overflow: hidden;
          border: 1px solid #1d2a3e;
          border-radius: 12px;
          background: #0a101d;
          box-shadow: 0 25px 70px rgba(0,0,0,.55);
        }

        .fs2-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px;
          border-bottom: 1px solid #172033;
        }
        .fs2-panel-head strong { display:block; font-size: 9px; letter-spacing: .7px; }
        .fs2-panel-head span { display:block; margin-top:4px; color:#64748b; font-size:8px; }
        .fs2-mini-btn { width: 29px; height: 29px; }

        .fs2-notification-list { max-height: 370px; overflow-y: auto; }
        .fs2-notification-item {
          width: 100%;
          display: flex;
          gap: 10px;
          padding: 12px 13px;
          text-align: left;
          border: none;
          border-bottom: 1px solid #121c2c;
          background: transparent;
          color: white;
          cursor: pointer;
        }
        .fs2-notification-item:hover { background: #0d1625; }

        .fs2-alert-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          display: grid;
          place-items: center;
          border-radius: 8px;
        }
        .fs2-alert-icon.danger { background: rgba(239,68,68,.12); color:#f87171; }
        .fs2-alert-icon.warning { background: rgba(245,158,11,.12); color:#fbbf24; }

        .fs2-alert-content { min-width: 0; flex: 1; }
        .fs2-alert-title { display:flex; align-items:center; gap:7px; }
        .fs2-alert-title strong { font-size:8px; letter-spacing:.5px; }
        .fs2-alert-title span { width:5px; height:5px; border-radius:50%; }
        .fs2-alert-title .unread { background:#3b82f6; }
        .fs2-alert-title .read { background:#334155; }
        .fs2-alert-content p { margin:4px 0; color:#94a3b8; font-size:9px; line-height:1.5; }
        .fs2-alert-content small { color:#475569; font-size:7px; }

        .fs2-view-alerts {
          width:100%;
          padding:11px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          border:none;
          border-top:1px solid #172033;
          background:#0a101d;
          color:#60a5fa;
          cursor:pointer;
          font-size:8px;
          font-weight:800;
        }

        .fs2-empty {
          min-height:170px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:7px;
          color:#475569;
        }
        .fs2-empty strong { color:#94a3b8; font-size:10px; }
        .fs2-empty span { font-size:8px; }

        .fs2-main {
          width: min(1450px, calc(100% - 50px));
          margin: auto;
          padding: 42px 0 80px;
        }

        .fs2-hero {
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:30px;
          margin-bottom:30px;
        }
        .fs2-eyebrow {
          display:flex;
          align-items:center;
          gap:8px;
          color:#3b82f6;
          font-size:8px;
          letter-spacing:2px;
          font-weight:900;
        }
        .fs2-live-dot {
          width:7px;
          height:7px;
          border-radius:50%;
          background:#22c55e;
          box-shadow:0 0 10px rgba(34,197,94,.7);
        }
        .fs2-hero h1 {
          margin:12px 0;
          font-size:clamp(34px,4vw,54px);
          line-height:1.02;
          letter-spacing:-2px;
        }
        .fs2-welcome-title {
          color:#f8fafc;
        }

        .fs2-welcome-wave {
          color:#fbbf24;
          font-size:.78em;
          letter-spacing:0;
        }

        .fs2-hero h1 span { color:#60a5fa; }
        .fs2-hero p { max-width:580px; margin:0; color:#718096; font-size:12px; line-height:1.7; }

        .fs2-hero-actions {
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          gap:10px;
        }
        .fs2-system-status {
          display:flex;
          align-items:center;
          gap:7px;
          color:#4ade80;
          font-size:8px;
          font-weight:900;
          letter-spacing:.8px;
        }
        .fs2-system-status span {
          width:6px;
          height:6px;
          border-radius:50%;
          background:#22c55e;
          box-shadow:0 0 9px rgba(34,197,94,.7);
        }
        .fs2-refresh {
          display:flex;
          align-items:center;
          gap:7px;
          padding:10px 13px;
          border:1px solid #263852;
          border-radius:8px;
          background:#0c1524;
          color:#bfdbfe;
          cursor:pointer;
          font-size:8px;
          font-weight:900;
        }
        .fs2-refresh:hover { border-color:#3674bd; background:#102039; }

        .fs2-live-alert {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          padding:18px;
          margin-bottom:34px;
          border:1px solid rgba(239,68,68,.25);
          border-radius:12px;
          background:linear-gradient(90deg,rgba(127,29,29,.16),rgba(30,10,15,.35));
        }
        .fs2-alert-main {
          display:flex;
          align-items:flex-start;
          gap:13px;
          min-width:0;
        }
        .fs2-live-alert-icon {
          width:43px;
          height:43px;
          min-width:43px;
          display:grid;
          place-items:center;
          border-radius:10px;
          background:rgba(239,68,68,.13);
          color:#f87171;
        }
        .fs2-alert-kicker { color:#f87171; font-size:7px; font-weight:900; letter-spacing:1px; }
        .fs2-alert-kicker span { margin-right:5px; color:#ef4444; }
        .fs2-live-alert h3 { margin:5px 0; font-size:13px; }
        .fs2-live-alert p { margin:0 0 4px; color:#718096; font-size:9px; }
        .fs2-live-alert small { color:#475569; font-size:7px; }

        .fs2-alert-metrics {
          display:flex;
          align-items:center;
          gap:18px;
          flex-shrink:0;
        }
        .fs2-alert-metrics > div { min-width:70px; }
        .fs2-alert-metrics span { display:block; color:#64748b; font-size:6px; letter-spacing:.8px; font-weight:900; }
        .fs2-alert-metrics strong { display:block; margin-top:4px; color:#e2e8f0; font-size:15px; }
        .fs2-alert-metrics button {
          display:flex;
          align-items:center;
          gap:6px;
          padding:9px 11px;
          border:none;
          border-radius:7px;
          background:#991b1b;
          color:white;
          cursor:pointer;
          font-size:7px;
          font-weight:900;
        }

        .fs2-section { margin-bottom:35px; }
        .fs2-section-title { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:16px; }
        .fs2-section-title span { color:#3b82f6; font-size:7px; letter-spacing:1.5px; font-weight:900; }
        .fs2-section-title h2 { margin:5px 0 0; color:#e2e8f0; font-size:20px; letter-spacing:-.4px; }

        .fs2-loading {
          min-height:180px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:12px;
          border:1px solid #172033;
          border-radius:12px;
          background:#080e1a;
          color:#64748b;
          font-size:10px;
        }
        .fs2-error {
          display:flex;
          align-items:center;
          gap:12px;
          padding:15px;
          border:1px solid rgba(239,68,68,.2);
          border-radius:9px;
          background:rgba(127,29,29,.1);
          color:#f87171;
        }
        .fs2-error > div { flex:1; }
        .fs2-error strong { font-size:10px; }
        .fs2-error p { margin:4px 0 0; color:#94a3b8; font-size:9px; }
        .fs2-error button {
          padding:8px 11px;
          border:none;
          border-radius:6px;
          background:#991b1b;
          color:white;
          cursor:pointer;
          font-size:8px;
          font-weight:800;
        }

        .fs2-metric-grid {
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:10px;
        }
        .fs2-metric {
          display:flex;
          align-items:center;
          gap:12px;
          min-height:88px;
          padding:15px;
          border:1px solid #172235;
          border-radius:10px;
          background:linear-gradient(145deg,#0a111e,#080d18);
          cursor:pointer;
          transition:.2s;
        }
        .fs2-metric:hover {
          transform:translateY(-2px);
          border-color:#285083;
          box-shadow:0 12px 35px rgba(0,0,0,.25);
        }
        .fs2-metric-icon {
          width:40px;
          height:40px;
          min-width:40px;
          display:grid;
          place-items:center;
          border-radius:9px;
        }
        .fs2-metric-icon.blue { background:rgba(59,130,246,.12); color:#60a5fa; }
        .fs2-metric-icon.red { background:rgba(239,68,68,.12); color:#f87171; }
        .fs2-metric-icon.orange { background:rgba(249,115,22,.12); color:#fb923c; }
        .fs2-metric-icon.purple { background:rgba(139,92,246,.12); color:#a78bfa; }
        .fs2-metric-icon.green { background:rgba(34,197,94,.12); color:#4ade80; }
        .fs2-metric-icon.cyan { background:rgba(6,182,212,.12); color:#22d3ee; }
        .fs2-metric span { display:block; color:#64748b; font-size:7px; font-weight:900; letter-spacing:.7px; }
        .fs2-metric strong { display:block; margin-top:4px; color:#f1f5f9; font-size:19px; letter-spacing:-.5px; }
        .fs2-metric small { color:#475569; font-size:7px; }

        .fs2-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
        .fs2-card {
          padding:18px;
          border:1px solid #172235;
          border-radius:11px;
          background:#080e1a;
        }
        .fs2-card-heading {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
        }
        .fs2-card-heading span { color:#64748b; font-size:7px; letter-spacing:1px; font-weight:900; }
        .fs2-card-heading h3 { margin:5px 0 0; color:#e2e8f0; font-size:14px; }
        .fs2-card-heading svg { color:#3b82f6; }

        .fs2-risk-list { margin-top:22px; }
        .fs2-risk-row { margin-bottom:17px; }
        .fs2-risk-label {
          display:flex;
          align-items:center;
          gap:7px;
          margin-bottom:7px;
          color:#94a3b8;
          font-size:9px;
          font-weight:700;
        }
        .fs2-risk-label strong { margin-left:auto; color:#e2e8f0; }
        .fs2-risk-dot { width:7px; height:7px; border-radius:50%; }
        .fs2-risk-dot.high { background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,.5); }
        .fs2-risk-dot.medium { background:#f59e0b; }
        .fs2-risk-dot.low { background:#22c55e; }
        .fs2-risk-track { height:6px; overflow:hidden; border-radius:20px; background:#111a29; }
        .fs2-risk-fill { height:100%; border-radius:20px; transition:width .5s ease; }
        .fs2-risk-fill.high { background:#ef4444; }
        .fs2-risk-fill.medium { background:#f59e0b; }
        .fs2-risk-fill.low { background:#22c55e; }
        .fs2-risk-total {
          display:flex;
          justify-content:space-between;
          padding-top:12px;
          border-top:1px solid #172033;
          color:#475569;
          font-size:8px;
        }
        .fs2-risk-total strong { color:#94a3b8; }

        .fs2-decision-grid {
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:8px;
          margin-top:20px;
        }
        .fs2-decision {
          padding:13px 7px;
          border:1px solid #172235;
          border-radius:8px;
          background:#0b1220;
          text-align:center;
        }
        .fs2-decision-icon { margin-bottom:6px; }
        .fs2-decision-icon.danger { color:#f87171; }
        .fs2-decision-icon.warning { color:#fbbf24; }
        .fs2-decision-icon.success { color:#4ade80; }
        .fs2-decision strong { display:block; color:#f1f5f9; font-size:19px; }
        .fs2-decision span { color:#64748b; font-size:7px; font-weight:800; }

        .fs2-feedback {
          display:flex;
          align-items:center;
          gap:15px;
          flex-wrap:wrap;
          margin-top:17px;
          padding-top:13px;
          border-top:1px solid #172033;
          color:#64748b;
          font-size:7px;
        }
        .fs2-feedback > span { font-weight:900; letter-spacing:.5px; }
        .fs2-feedback div { display:flex; gap:4px; }
        .fs2-feedback b { color:#e2e8f0; }

        .fs2-signals { margin-top:10px; }
        .fs2-signal-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1px 25px; margin-top:14px; }
        .fs2-signal {
          display:flex;
          align-items:center;
          gap:10px;
          padding:11px 0;
          border-bottom:1px solid #121c2c;
        }
        .fs2-signal-number {
          width:25px;
          height:25px;
          display:grid;
          place-items:center;
          border-radius:6px;
          background:rgba(59,130,246,.08);
          color:#60a5fa;
          font-size:7px;
          font-weight:900;
        }
        .fs2-signal-text { flex:1; }
        .fs2-signal-text strong { display:block; color:#cbd5e1; font-size:9px; }
        .fs2-signal-text span { display:block; margin-top:3px; color:#475569; font-size:7px; }
        .fs2-signal-count {
          padding:4px 7px;
          border-radius:5px;
          background:#111a29;
          color:#94a3b8;
          font-size:8px;
          font-weight:800;
        }
        .fs2-no-data { padding:20px 0 5px; color:#475569; font-size:9px; }

        .fs2-module-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .fs2-module {
          position:relative;
          overflow:hidden;
          display:flex;
          gap:14px;
          padding:19px;
          border:1px solid #172235;
          border-radius:11px;
          background:linear-gradient(145deg,#0a111e,#080d18);
          transition:.2s;
        }
        .fs2-module::after {
          content:"";
          position:absolute;
          right:-35px;
          top:-35px;
          width:100px;
          height:100px;
          border-radius:50%;
          background:rgba(37,99,235,.04);
        }
        .fs2-module:hover { transform:translateY(-2px); border-color:#244975; }
        .fs2-module-icon {
          width:44px;
          height:44px;
          min-width:44px;
          display:grid;
          place-items:center;
          border-radius:10px;
          background:rgba(37,99,235,.10);
          color:#60a5fa;
        }
        .fs2-module-content { flex:1; }
        .fs2-module-content > span { color:#64748b; font-size:7px; letter-spacing:1px; font-weight:900; }
        .fs2-module-content h3 { margin:5px 0; color:#e2e8f0; font-size:15px; }
        .fs2-module-content p { max-width:500px; margin:0 0 13px; color:#64748b; font-size:9px; line-height:1.6; }
        .fs2-module-content button {
          display:flex;
          align-items:center;
          gap:6px;
          padding:8px 10px;
          border:1px solid #263852;
          border-radius:6px;
          background:#0c1524;
          color:#bfdbfe;
          cursor:pointer;
          font-size:7px;
          font-weight:900;
        }
        .fs2-module-content button:hover { border-color:#3b82f6; background:#102039; }

        .fs2-status-panel, .fs2-quick {
          margin-bottom:30px;
          padding:20px;
          border:1px solid #172235;
          border-radius:11px;
          background:#080e1a;
        }
        .fs2-status-heading {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          margin-bottom:17px;
        }
        .fs2-status-heading .fs2-section-title { margin:0; }
        .fs2-operational {
          display:flex;
          align-items:center;
          gap:6px;
          padding:5px 8px;
          border-radius:5px;
          background:rgba(34,197,94,.06);
          color:#4ade80;
          font-size:7px;
          font-weight:900;
        }
        .fs2-operational span {
          width:6px;
          height:6px;
          border-radius:50%;
          background:#22c55e;
          box-shadow:0 0 9px rgba(34,197,94,.7);
        }
        .fs2-status-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .fs2-status-item {
          display:flex;
          align-items:center;
          gap:9px;
          padding:12px;
          border:1px solid #172235;
          border-radius:8px;
          background:#0b1220;
        }
        .fs2-status-item svg { color:#3b82f6; }
        .fs2-status-item span { display:block; color:#64748b; font-size:7px; }
        .fs2-status-item strong { display:block; margin-top:3px; color:#4ade80; font-size:8px; letter-spacing:.5px; }

        .fs2-quick { margin-bottom:0; }
        .fs2-quick-buttons { display:flex; flex-wrap:wrap; gap:7px; margin-top:17px; }
        .fs2-quick-buttons button {
          display:flex;
          align-items:center;
          gap:6px;
          padding:8px 10px;
          border:1px solid #1b293d;
          border-radius:6px;
          background:#0b1220;
          color:#94a3b8;
          cursor:pointer;
          font-size:8px;
          font-weight:800;
        }
        .fs2-quick-buttons button:hover { border-color:#315b8f; background:#0d1a2d; color:#bfdbfe; }

        .fs2-spin { animation:fs2Spin 1s linear infinite; }
        @keyframes fs2Spin { to { transform:rotate(360deg); } }

        @media (max-width:1150px) {
          .fs2-navbar { flex-wrap:wrap; padding:11px 18px; }
          .fs2-nav { order:3; flex-basis:100%; }
          .fs2-metric-grid { grid-template-columns:repeat(2,1fr); }
          .fs2-status-grid { grid-template-columns:repeat(2,1fr); }
          .fs2-live-alert { align-items:flex-start; flex-direction:column; }
          .fs2-alert-metrics { width:100%; flex-wrap:wrap; }
        }

        @media (max-width:800px) {
          .fs2-main { width:min(100% - 28px,650px); padding-top:28px; }
          .fs2-hero { flex-direction:column; align-items:flex-start; }
          .fs2-hero-actions { align-items:flex-start; }
          .fs2-grid-2, .fs2-module-grid { grid-template-columns:1fr; }
          .fs2-signal-grid { grid-template-columns:1fr; }
        }

        @media (max-width:600px) {
          .fs2-brand { min-width:0; }
          .fs2-brand span { display:none; }
          .fs2-nav-actions { margin-left:auto; }
          .fs2-metric-grid, .fs2-status-grid { grid-template-columns:1fr; }
          .fs2-alert-metrics { display:grid; grid-template-columns:repeat(2,1fr); }
          .fs2-alert-metrics button { justify-content:center; }
          .fs2-hero h1 { font-size:36px; }
          .fs2-notification-panel { right:-45px; }
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`fs2-nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function AlertMini({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="fs2-section-title">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, description, type, onClick }) {
  return (
    <div
      className="fs2-metric"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
    >
      <div className={`fs2-metric-icon ${type}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function CardHeading({ eyebrow, title, icon }) {
  return (
    <div className="fs2-card-heading">
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {icon}
    </div>
  );
}

function RiskRow({ label, count, percentage, type }) {
  return (
    <div className="fs2-risk-row">
      <div className="fs2-risk-label">
        <span className={`fs2-risk-dot ${type}`} />
        {label}
        <strong>{count}</strong>
      </div>
      <div className="fs2-risk-track">
        <div className={`fs2-risk-fill ${type}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function DecisionBox({ icon, value, label, type }) {
  return (
    <div className="fs2-decision">
      <div className={`fs2-decision-icon ${type}`}>{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ModuleCard({ icon, eyebrow, title, description, button, onClick }) {
  return (
    <div className="fs2-module">
      <div className="fs2-module-icon">{icon}</div>
      <div className="fs2-module-content">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
        <button onClick={onClick}>
          {button}
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

function StatusItem({ icon, label, value }) {
  return (
    <div className="fs2-status-item">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function QuickButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

export default Dashboard;