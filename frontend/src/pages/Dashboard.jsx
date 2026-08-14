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
} from "lucide-react";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // LIVE FRAUD NOTIFICATIONS
  // =====================================================

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = (path) => {
    window.location.href = path;
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  // =====================================================
  // LOAD ANALYTICS
  // =====================================================

  const loadAnalytics = async () => {
    try {
      setAnalyticsError("");

      if (!analytics) {
        setLoadingAnalytics(true);
      } else {
        setRefreshing(true);
      }

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setAnalyticsError(
          "Please login again to view live analytics."
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/api/fraud/analytics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let message =
          `Server error: ${response.status}`;

        try {
          const data =
            await response.json();

          if (data.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore invalid response
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      console.log(
        "Fraud analytics:",
        data
      );

      setAnalytics(data);

    } catch (error) {
      console.error(
        "Analytics loading error:",
        error
      );

      setAnalyticsError(
        error.message ||
          "Unable to load fraud analytics."
      );

    } finally {
      setLoadingAnalytics(false);
      setRefreshing(false);
    }
  };


  // =====================================================
  // LOAD FRAUD NOTIFICATIONS
  // =====================================================

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const token =
        localStorage.getItem("access_token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/fraud/alerts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Notification server error: ${response.status}`
        );
      }

      const data = await response.json();

      const alertList = Array.isArray(data)
        ? data
        : data?.alerts || [];

      setNotifications(
        alertList
          .slice()
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )
          .slice(0, 8)
      );
    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  const unreadNotifications = notifications.filter(
    (notification) =>
      notification.is_read === false ||
      notification.is_read === 0 ||
      notification.is_read === undefined
  ).length;

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

  // =====================================================
  // LOAD ON PAGE OPEN
  // =====================================================

  useEffect(() => {
    loadAnalytics();
    loadNotifications();

    const analyticsInterval =
      setInterval(() => {
        loadAnalytics();
      }, 30000);

    const notificationInterval =
      setInterval(() => {
        loadNotifications();
      }, 15000);

    return () => {
      clearInterval(analyticsInterval);
      clearInterval(notificationInterval);
    };
  }, []);


  // =====================================================
  // SAFE DATA
  // =====================================================

  const summary =
    analytics?.summary || {};

  const distribution =
    analytics?.risk_distribution || {};

  const decisions =
    analytics?.decisions || {};

  const feedback =
    analytics?.analyst_feedback || {};

  const signals =
    analytics?.top_risk_signals || [];


  // =====================================================
  // HELPERS
  // =====================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      "en-IN"
    );
  };


  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };


  // =====================================================
  // RISK PERCENTAGES
  // =====================================================

  const totalRisk =
    Number(
      distribution.HIGH || 0
    ) +
    Number(
      distribution.MEDIUM || 0
    ) +
    Number(
      distribution.LOW || 0
    );


  const highRiskPercentage =
    totalRisk > 0
      ? Math.round(
          (distribution.HIGH /
            totalRisk) *
            100
        )
      : 0;


  const mediumRiskPercentage =
    totalRisk > 0
      ? Math.round(
          (distribution.MEDIUM /
            totalRisk) *
            100
        )
      : 0;


  const lowRiskPercentage =
    totalRisk > 0
      ? Math.round(
          (distribution.LOW /
            totalRisk) *
            100
        )
      : 0;

  // =====================================================
  // DASHBOARD ALERT SUMMARY
  // =====================================================

  const highRiskAlerts = notifications.filter(
    (notification) =>
      String(
        notification.risk_level || ""
      ).toUpperCase() === "HIGH"
  );

  const unreadHighRiskAlerts =
    highRiskAlerts.filter(
      (notification) =>
        notification.is_read === false ||
        notification.is_read === 0 ||
        notification.is_read === undefined
    ).length;

  const alertAmountAtRisk =
    notifications.reduce(
      (total, notification) =>
        total + Number(notification.amount || 0),
      0
    );

  const latestAlert =
    notifications.length > 0
      ? notifications[0]
      : null;


  return (
    <div className="dashboard-page">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <header className="dashboard-navbar">

        <div
          className="dashboard-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <div className="brand-icon">
            <Shield size={23} />
          </div>

          <div>
            <h2>
              FraudShield AI
            </h2>

            <span>
              Real-Time Transaction Protection
            </span>
          </div>

        </div>


        <nav className="dashboard-nav">

          <button
            className="nav-button active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ShieldCheck size={16} />
            Dashboard
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/transaction")
            }
          >
            <ShieldCheck size={16} />
            Transaction
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/voice-phishing")
            }
          >
            <Mic size={16} />
            Voice Phishing
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/analytics")
            }
          >
            <BarChart3 size={16} />
            Analytics
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/fraud-network")
            }
          >
            <Network size={16} />
            Fraud Network
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/alerts")
            }
          >
            <Bell size={16} />
            Alerts
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate(
                "/device-intelligence"
              )
            }
          >
            <Smartphone size={16} />
            Devices
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate(
                "/geographic-fraud"
              )
            }
          >
            <MapPin size={16} />
            Geography
          </button>


          <button
            className="nav-button"
            onClick={() =>
              navigate("/admin")
            }
          >
            <UserCog size={16} />
            Admin
          </button>

        </nav>


        <div className="notification-wrapper">
          <button
            className="notification-button"
            onClick={() =>
              setNotificationOpen(
                (previous) => !previous
              )
            }
            aria-label="Fraud notifications"
          >
            <Bell size={18} />

            {unreadNotifications > 0 && (
              <span className="notification-badge">
                {unreadNotifications > 9
                  ? "9+"
                  : unreadNotifications}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="notification-panel">
              <div className="notification-panel-header">
                <div>
                  <strong>Fraud Notifications</strong>
                  <span>
                    {unreadNotifications} unread
                  </span>
                </div>

                <button
                  className="notification-refresh"
                  onClick={loadNotifications}
                  disabled={notificationsLoading}
                  title="Refresh notifications"
                >
                  <RefreshCw
                    size={14}
                    className={
                      notificationsLoading
                        ? "refresh-spin"
                        : ""
                    }
                  />
                </button>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={22} />
                    <strong>No fraud alerts</strong>
                    <span>
                      New suspicious activity will appear here.
                    </span>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => {
                      const risk =
                        String(
                          notification.risk_level ||
                            "HIGH"
                        ).toUpperCase();

                      return (
                        <button
                          className="notification-item"
                          key={
                            notification.id ||
                            notification.transaction_id
                          }
                          onClick={() =>
                            openAlert(notification)
                          }
                        >
                          <div
                            className={`notification-icon ${
                              risk === "HIGH"
                                ? "notification-high"
                                : "notification-normal"
                            }`}
                          >
                            {risk === "HIGH" ? (
                              <AlertTriangle size={16} />
                            ) : (
                              <Bell size={16} />
                            )}
                          </div>

                          <div className="notification-content">
                            <div>
                              <strong>
                                {risk} RISK ALERT
                              </strong>

                              <span
                                className={
                                  notification.is_read
                                    ? "read-dot"
                                    : "unread-dot"
                                }
                              />
                            </div>

                            <p>
                              {notification.message ||
                                "Suspicious transaction detected."}
                            </p>

                            <small>
                              {notification.amount != null
                                ? formatCurrency(
                                    notification.amount
                                  )
                                : "Transaction alert"}
                              {" • "}
                              {notification.created_at
                                ? new Date(
                                    notification.created_at
                                  ).toLocaleString(
                                    "en-IN"
                                  )
                                : "Recently detected"}
                            </small>
                          </div>
                        </button>
                      );
                    }
                  )
                )}
              </div>

              <button
                className="notification-view-all"
                onClick={() => navigate("/alerts")}
              >
                View all fraud alerts
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-main">

        {/* =================================================
            HEADING
        ================================================= */}

        <section className="dashboard-heading">

          <div>

            <div className="dashboard-status">
              <span></span>
              FRAUDSHIELD SECURITY CENTER
            </div>

            <h1>
              Security Dashboard
            </h1>

            <p>
              Your central hub for transaction
              security, voice phishing detection
              and fraud intelligence.
            </p>

          </div>


          <button
            className="dashboard-refresh"
            onClick={loadAnalytics}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Intelligence"}
          </button>

        </section>


        {/* =================================================
            LIVE ALERT SUMMARY
        ================================================= */}

        {latestAlert && (
          <section className="dashboard-alert-summary">

            <div className="alert-summary-main">

              <div className="alert-summary-icon">
                <AlertTriangle size={21} />
              </div>

              <div className="alert-summary-content">
                <div className="alert-summary-title-row">
                  <span className="alert-summary-kicker">
                    LATEST FRAUD ALERT
                  </span>

                  <span className="alert-summary-live">
                    ● LIVE
                  </span>
                </div>

                <strong>
                  {String(
                    latestAlert.risk_level ||
                      "HIGH"
                  ).toUpperCase()}{" "}
                  RISK DETECTED
                </strong>

                <p>
                  {latestAlert.message ||
                    "Suspicious transaction detected by FraudShield AI."}
                </p>

                <small>
                  {latestAlert.amount != null
                    ? formatCurrency(
                        latestAlert.amount
                      )
                    : "Amount unavailable"}
                  {" • "}
                  {latestAlert.created_at
                    ? new Date(
                        latestAlert.created_at
                      ).toLocaleString("en-IN")
                    : "Recently detected"}
                </small>
              </div>

            </div>


            <div className="alert-summary-metrics">

              <div>
                <span>Unread High Risk</span>
                <strong>
                  {unreadHighRiskAlerts}
                </strong>
              </div>

              <div>
                <span>Alerts Loaded</span>
                <strong>
                  {notifications.length}
                </strong>
              </div>

              <div>
                <span>Amount at Risk</span>
                <strong>
                  {formatCurrency(
                    alertAmountAtRisk
                  )}
                </strong>
              </div>

              <button
                className="alert-summary-button"
                onClick={() =>
                  navigate("/alerts")
                }
              >
                Investigate Alerts
                <ArrowRight size={15} />
              </button>

            </div>

          </section>
        )}


        {/* =================================================
            LIVE FRAUD INTELLIGENCE
        ================================================= */}

        <section className="live-intelligence">

          <div className="intelligence-header">

            <div>

              <span className="section-kicker">
                LIVE FRAUD INTELLIGENCE
              </span>

              <h2>
                Security Overview
              </h2>

              <p>
                Real-time statistics from
                your FraudShield detection engine.
              </p>

            </div>


            <div className="live-status">

              <span></span>

              LIVE

            </div>

          </div>


          {loadingAnalytics && (

            <div className="analytics-loading">

              <RefreshCw
                size={24}
                className="refresh-spin"
              />

              <p>
                Loading fraud intelligence...
              </p>

            </div>

          )}


          {!loadingAnalytics &&
            analyticsError && (

            <div className="analytics-error">

              <AlertTriangle size={20} />

              <div>

                <strong>
                  Analytics unavailable
                </strong>

                <p>
                  {analyticsError}
                </p>

              </div>

              <button
                onClick={loadAnalytics}
              >
                Retry
              </button>

            </div>

          )}


          {!loadingAnalytics &&
            !analyticsError &&
            analytics && (

            <>

              {/* =================================================
                  MAIN STATISTICS
              ================================================= */}

              <div className="live-stats-grid">

                <div
                  className="live-stat"
                  onClick={() =>
                    navigate(
                      "/transaction"
                    )
                  }
                >

                  <div className="live-stat-icon blue">
                    <Activity size={22} />
                  </div>

                  <div>
                    <span>
                      TOTAL TRANSACTIONS
                    </span>

                    <strong>
                      {formatNumber(
                        summary.total_transactions
                      )}
                    </strong>

                    <small>
                      All analyzed transactions
                    </small>
                  </div>

                </div>


                <div
                  className="live-stat"
                  onClick={() =>
                    navigate("/alerts")
                  }
                >

                  <div className="live-stat-icon red">
                    <Bell size={22} />
                  </div>

                  <div>
                    <span>
                      FRAUD ALERTS
                    </span>

                    <strong>
                      {formatNumber(
                        summary.total_alerts
                      )}
                    </strong>

                    <small>
                      Generated alerts
                    </small>
                  </div>

                </div>


                <div
                  className="live-stat"
                  onClick={() =>
                    navigate("/alerts")
                  }
                >

                  <div className="live-stat-icon orange">
                    <AlertTriangle size={22} />
                  </div>

                  <div>
                    <span>
                      HIGH RISK
                    </span>

                    <strong>
                      {formatNumber(
                        summary.high_risk
                      )}
                    </strong>

                    <small>
                      High-risk transactions
                    </small>
                  </div>

                </div>


                <div
                  className="live-stat"
                  onClick={() =>
                    navigate("/transaction")
                  }
                >

                  <div className="live-stat-icon purple">
                    <Ban size={22} />
                  </div>

                  <div>
                    <span>
                      BLOCKED
                    </span>

                    <strong>
                      {formatNumber(
                        summary.blocked
                      )}
                    </strong>

                    <small>
                      Transactions blocked
                    </small>
                  </div>

                </div>


                <div className="live-stat">

                  <div className="live-stat-icon green">
                    <IndianRupee size={22} />
                  </div>

                  <div>
                    <span>
                      AMOUNT AT RISK
                    </span>

                    <strong>
                      {formatCurrency(
                        summary.amount_at_risk
                      )}
                    </strong>

                    <small>
                      Suspicious transaction value
                    </small>
                  </div>

                </div>


                <div className="live-stat">

                  <div className="live-stat-icon cyan">
                    <TrendingUp size={22} />
                  </div>

                  <div>
                    <span>
                      AVERAGE RISK
                    </span>

                    <strong>
                      {Number(
                        summary.average_risk || 0
                      ).toFixed(2)}
                    </strong>

                    <small>
                      Average risk score
                    </small>
                  </div>

                </div>

              </div>


              {/* =================================================
                  RISK + DECISIONS
              ================================================= */}

              <div className="intelligence-grid">

                {/* RISK DISTRIBUTION */}

                <div className="intelligence-card">

                  <div className="card-heading">

                    <div>
                      <span>
                        RISK DISTRIBUTION
                      </span>

                      <h3>
                        Transaction Risk
                      </h3>
                    </div>

                    <ShieldCheck
                      size={20}
                    />

                  </div>


                  <div className="risk-bars">

                    <div className="risk-row">

                      <div className="risk-label">
                        <span className="dot high-dot"></span>
                        High
                        <strong>
                          {
                            distribution.HIGH ||
                            0
                          }
                        </strong>
                      </div>

                      <div className="risk-track">
                        <div
                          className="risk-fill high-fill"
                          style={{
                            width:
                              `${highRiskPercentage}%`,
                          }}
                        />
                      </div>

                    </div>


                    <div className="risk-row">

                      <div className="risk-label">
                        <span className="dot medium-dot"></span>
                        Medium
                        <strong>
                          {
                            distribution.MEDIUM ||
                            0
                          }
                        </strong>
                      </div>

                      <div className="risk-track">
                        <div
                          className="risk-fill medium-fill"
                          style={{
                            width:
                              `${mediumRiskPercentage}%`,
                          }}
                        />
                      </div>

                    </div>


                    <div className="risk-row">

                      <div className="risk-label">
                        <span className="dot low-dot"></span>
                        Low
                        <strong>
                          {
                            distribution.LOW ||
                            0
                          }
                        </strong>
                      </div>

                      <div className="risk-track">
                        <div
                          className="risk-fill low-fill"
                          style={{
                            width:
                              `${lowRiskPercentage}%`,
                          }}
                        />
                      </div>

                    </div>

                  </div>

                </div>


                {/* DECISIONS */}

                <div className="intelligence-card">

                  <div className="card-heading">

                    <div>
                      <span>
                        AI DECISIONS
                      </span>

                      <h3>
                        Transaction Actions
                      </h3>
                    </div>

                    <LockKeyhole
                      size={20}
                    />

                  </div>


                  <div className="decision-grid">

                    <div>
                      <strong>
                        {
                          decisions.BLOCK ||
                          0
                        }
                      </strong>

                      <span>
                        Blocked
                      </span>
                    </div>


                    <div>
                      <strong>
                        {
                          decisions.REVIEW ||
                          0
                        }
                      </strong>

                      <span>
                        Review
                      </span>
                    </div>


                    <div>
                      <strong>
                        {
                          decisions.ALLOW ||
                          0
                        }
                      </strong>

                      <span>
                        Allowed
                      </span>
                    </div>

                  </div>


                  <div className="feedback-line">

                    <span>
                      Analyst Feedback
                    </span>

                    <div>

                      <b>
                        {
                          feedback.PENDING ||
                          0
                        }
                      </b>

                      Pending

                    </div>

                    <div>

                      <b>
                        {
                          feedback.CONFIRMED_FRAUD ||
                          0
                        }
                      </b>

                      Confirmed

                    </div>

                    <div>

                      <b>
                        {
                          feedback.FALSE_POSITIVE ||
                          0
                        }
                      </b>

                      False Positive

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  TOP RISK SIGNALS
              ================================================= */}

              <div className="signals-card">

                <div className="card-heading">

                  <div>

                    <span>
                      AI EXPLAINABILITY
                    </span>

                    <h3>
                      Top Risk Signals
                    </h3>

                  </div>

                  <Activity
                    size={20}
                  />

                </div>


                {signals.length === 0 ? (

                  <p className="no-signals">
                    No risk signals available.
                  </p>

                ) : (

                  <div className="signals-list">

                    {signals
                      .slice(0, 6)
                      .map(
                        (signal, index) => (

                          <div
                            className="signal-item"
                            key={
                              `${signal.signal}-${index}`
                            }
                          >

                            <span className="signal-number">
                              {index + 1}
                            </span>

                            <span className="signal-text">
                              {signal.signal}
                            </span>

                            <strong>
                              {signal.count}
                            </strong>

                          </div>

                        )
                      )}

                  </div>

                )}

              </div>

            </>

          )}

        </section>


        {/* =================================================
            FEATURE HUB
        ================================================= */}

        <section className="feature-hub">

          <div className="feature-card transaction-card">

            <div className="feature-icon">
              <ShieldCheck size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                CORE PROTECTION
              </span>

              <h3>
                Transaction Security
              </h3>

              <p>
                Analyze UPI transactions using
                behavioral signals and AI-powered
                fraud detection.
              </p>

              <button
                onClick={() =>
                  navigate("/transaction")
                }
              >
                Analyze Transaction
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card voice-card">

            <div className="feature-icon">
              <Mic size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                SOCIAL ENGINEERING
              </span>

              <h3>
                Voice Phishing
              </h3>

              <p>
                Detect OTP requests, bank
                impersonation, urgency and other
                phone-scam signals.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/voice-phishing"
                  )
                }
              >
                Open Voice Detector
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card analytics-card">

            <div className="feature-icon">
              <BarChart3 size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                INTELLIGENCE
              </span>

              <h3>
                Fraud Analytics
              </h3>

              <p>
                Explore risk trends, transaction
                patterns and fraud activity across
                the platform.
              </p>

              <button
                onClick={() =>
                  navigate("/analytics")
                }
              >
                View Analytics
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card network-card">

            <div className="feature-icon">
              <Network size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                FRAUD INTELLIGENCE
              </span>

              <h3>
                Fraud Network
              </h3>

              <p>
                Discover connections between
                users, transactions, devices,
                beneficiaries and locations.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/fraud-network"
                  )
                }
              >
                Explore Fraud Network
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card alerts-card">

            <div className="feature-icon">
              <Bell size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                REAL-TIME MONITORING
              </span>

              <h3>
                Fraud Alerts
              </h3>

              <p>
                Monitor suspicious transactions,
                high-risk activity, unread alerts
                and blocked transactions.
              </p>

              <button
                onClick={() =>
                  navigate("/alerts")
                }
              >
                Open Fraud Alerts
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card geography-card">

            <div className="feature-icon">
              <MapPin size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                GEOGRAPHIC INTELLIGENCE
              </span>

              <h3>
                Geographic Fraud Intelligence
              </h3>

              <p>
                Analyze transaction locations,
                geographic risk patterns and
                suspicious location activity.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/geographic-fraud"
                  )
                }
              >
                Open Geographic Intelligence
                <ArrowRight size={16} />
              </button>

            </div>

          </div>


          <div className="feature-card admin-card">

            <div className="feature-icon">
              <UserCog size={25} />
            </div>

            <div className="feature-content">

              <span className="feature-label">
                OPERATIONS
              </span>

              <h3>
                Fraud Analyst Center
              </h3>

              <p>
                Review suspicious transactions,
                alerts and AI fraud decisions.
              </p>

              <button
                onClick={() =>
                  navigate("/admin")
                }
              >
                Open Analyst Center
                <ArrowRight size={16} />
              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK STATS
        ================================================= */}

        <section className="dashboard-stats">

          <div className="stat-card">

            <Activity size={21} />

            <div>
              <span>
                Protection Status
              </span>

              <strong>
                ACTIVE
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <ShieldCheck size={21} />

            <div>
              <span>
                AI Engine
              </span>

              <strong>
                ONLINE
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <LockKeyhole size={21} />

            <div>
              <span>
                Transaction Security
              </span>

              <strong>
                ENABLED
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <Network size={21} />

            <div>
              <span>
                Fraud Network
              </span>

              <strong>
                READY
              </strong>
            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <section className="quick-access">

          <h2>
            Explore FraudShield
          </h2>

          <p>
            Access each security module
            from one place.
          </p>


          <div className="quick-buttons">

            <button
              onClick={() =>
                navigate("/transaction")
              }
            >
              <ShieldCheck size={18} />
              Transaction Security
            </button>


            <button
              onClick={() =>
                navigate("/voice-phishing")
              }
            >
              <Mic size={18} />
              Voice Phishing
            </button>


            <button
              onClick={() =>
                navigate("/analytics")
              }
            >
              <BarChart3 size={18} />
              Fraud Analytics
            </button>


            <button
              onClick={() =>
                navigate("/fraud-network")
              }
            >
              <Network size={18} />
              Fraud Network
            </button>


            <button
              onClick={() =>
                navigate("/alerts")
              }
            >
              <Bell size={18} />
              Fraud Alerts
            </button>


            <button
              onClick={() =>
                navigate(
                  "/device-intelligence"
                )
              }
            >
              <Smartphone size={18} />
              Device Intelligence
            </button>


            <button
              onClick={() =>
                navigate(
                  "/geographic-fraud"
                )
              }
            >
              <MapPin size={18} />
              Geographic Intelligence
            </button>


            <button
              onClick={() =>
                navigate("/admin")
              }
            >
              <UserCog size={18} />
              Analyst Center
            </button>

          </div>

        </section>

      </main>


      {/* =================================================
          DASHBOARD STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .dashboard-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #0f172a;
          font-family: Arial, sans-serif;
        }

        .dashboard-navbar {
          min-height: 70px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 25px;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          min-width: 215px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #0f172a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-brand h2 {
          margin: 0;
          font-size: 16px;
        }

        .dashboard-brand span {
          font-size: 9px;
          color: #64748b;
        }

        .dashboard-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          overflow-x: auto;
        }

        .nav-button {
          border: none;
          background: transparent;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 10px;
          border-radius: 7px;
          cursor: pointer;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 700;
        }

        .nav-button:hover,
        .nav-button.active {
          background: #eff6ff;
          color: #2563eb;
        }

        /* LIVE NOTIFICATIONS */

        .notification-wrapper {
          position: relative;
        }

        .notification-button {
          position: relative;
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .notification-button:hover {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 20px;
          background: #dc2626;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
          border: 2px solid white;
        }

        .notification-panel {
          position: absolute;
          top: 46px;
          right: 0;
          width: 360px;
          max-width: calc(100vw - 30px);
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow:
            0 18px 45px rgba(15,23,42,.14);
          overflow: hidden;
          z-index: 300;
        }

        .notification-panel-header {
          padding: 14px 15px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-panel-header strong {
          display: block;
          font-size: 12px;
        }

        .notification-panel-header span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 9px;
        }

        .notification-refresh {
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }

        .notification-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .notification-item {
          width: 100%;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          background: white;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          text-align: left;
          cursor: pointer;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-high {
          background: #fee2e2;
          color: #dc2626;
        }

        .notification-normal {
          background: #eff6ff;
          color: #2563eb;
        }

        .notification-content {
          min-width: 0;
          flex: 1;
        }

        .notification-content > div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .notification-content strong {
          color: #334155;
          font-size: 9px;
          letter-spacing: .4px;
        }

        .notification-content p {
          margin: 4px 0;
          color: #475569;
          font-size: 10px;
          line-height: 1.45;
        }

        .notification-content small {
          color: #94a3b8;
          font-size: 8px;
        }

        .unread-dot,
        .read-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .unread-dot {
          background: #2563eb;
        }

        .read-dot {
          background: #cbd5e1;
        }

        .notification-empty {
          min-height: 160px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          text-align: center;
        }

        .notification-empty strong {
          color: #475569;
          font-size: 11px;
        }

        .notification-empty span {
          font-size: 9px;
        }

        .notification-view-all {
          width: 100%;
          border: none;
          border-top: 1px solid #f1f5f9;
          background: white;
          color: #2563eb;
          padding: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
        }

        .notification-view-all:hover {
          background: #eff6ff;
        }

        .logout-button {
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          border-radius: 7px;
          padding: 8px 13px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .dashboard-main {
          max-width: 1350px;
          margin: 0 auto;
          padding: 42px 25px 70px;
        }

        .dashboard-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 30px;
        }

        .dashboard-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #2563eb;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .dashboard-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
        }

        .dashboard-heading h1 {
          margin: 8px 0;
          font-size: 38px;
        }

        .dashboard-heading p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .dashboard-refresh {
          border: none;
          border-radius: 8px;
          background: #0f172a;
          color: white;
          padding: 11px 15px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .dashboard-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .refresh-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* LIVE ALERT SUMMARY */

        .dashboard-alert-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 18px;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: #fffafa;
          box-shadow:
            0 6px 20px rgba(127, 29, 29, 0.05);
        }

        .alert-summary-main {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          min-width: 0;
        }

        .alert-summary-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 11px;
          background: #fee2e2;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-summary-content {
          min-width: 0;
        }

        .alert-summary-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 4px;
        }

        .alert-summary-kicker {
          color: #b91c1c;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .alert-summary-live {
          color: #15803d;
          background: #dcfce7;
          border-radius: 999px;
          padding: 3px 7px;
          font-size: 7px;
          font-weight: 900;
        }

        .alert-summary-content > strong {
          display: block;
          color: #991b1b;
          font-size: 14px;
        }

        .alert-summary-content p {
          margin: 5px 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.5;
          max-width: 560px;
        }

        .alert-summary-content small {
          color: #94a3b8;
          font-size: 8px;
        }

        .alert-summary-metrics {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .alert-summary-metrics > div {
          min-width: 75px;
        }

        .alert-summary-metrics span {
          display: block;
          color: #64748b;
          font-size: 7px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .alert-summary-metrics strong {
          display: block;
          margin-top: 4px;
          color: #0f172a;
          font-size: 15px;
        }

        .alert-summary-button {
          border: none;
          border-radius: 8px;
          background: #991b1b;
          color: white;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .alert-summary-button:hover {
          background: #7f1d1d;
        }


        /* LIVE INTELLIGENCE */

        .live-intelligence {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .intelligence-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .section-kicker {
          color: #2563eb;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .intelligence-header h2 {
          margin: 7px 0;
          font-size: 22px;
        }

        .intelligence-header p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
        }

        .live-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #15803d;
          background: #dcfce7;
          padding: 6px 9px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 900;
        }

        .live-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
        }

        .analytics-loading {
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .analytics-loading p {
          font-size: 12px;
        }

        .analytics-error {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff1f2;
          color: #9f1239;
          border: 1px solid #fecdd3;
          border-radius: 9px;
          padding: 15px;
        }

        .analytics-error div {
          flex: 1;
        }

        .analytics-error p {
          margin: 4px 0 0;
          font-size: 11px;
        }

        .analytics-error button {
          border: none;
          background: #9f1239;
          color: white;
          border-radius: 6px;
          padding: 8px 11px;
          cursor: pointer;
        }

        .live-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .live-stat {
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 17px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: .2s;
        }

        .live-stat:hover {
          transform: translateY(-2px);
          border-color: #bfdbfe;
          box-shadow:
            0 6px 20px rgba(15,23,42,.06);
        }

        .live-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .live-stat-icon.blue {
          background: #dbeafe;
          color: #2563eb;
        }

        .live-stat-icon.red {
          background: #fee2e2;
          color: #dc2626;
        }

        .live-stat-icon.orange {
          background: #ffedd5;
          color: #ea580c;
        }

        .live-stat-icon.purple {
          background: #ede9fe;
          color: #7c3aed;
        }

        .live-stat-icon.green {
          background: #dcfce7;
          color: #15803d;
        }

        .live-stat-icon.cyan {
          background: #cffafe;
          color: #0891b2;
        }

        .live-stat span {
          display: block;
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
        }

        .live-stat strong {
          display: block;
          margin: 5px 0 2px;
          font-size: 20px;
        }

        .live-stat small {
          color: #94a3b8;
          font-size: 9px;
        }

        /* RISK + DECISIONS */

        .intelligence-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 13px;
        }

        .intelligence-card,
        .signals-card {
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 19px;
        }

        .signals-card {
          margin-top: 13px;
        }

        .card-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-heading > div > span {
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .card-heading h3 {
          margin: 5px 0 0;
          font-size: 15px;
        }

        .card-heading > svg {
          color: #2563eb;
        }

        .risk-bars {
          margin-top: 22px;
        }

        .risk-row {
          margin-bottom: 16px;
        }

        .risk-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #475569;
          font-size: 10px;
          margin-bottom: 7px;
        }

        .risk-label strong {
          margin-left: auto;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .high-dot {
          background: #ef4444;
        }

        .medium-dot {
          background: #f59e0b;
        }

        .low-dot {
          background: #22c55e;
        }

        .risk-track {
          height: 7px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
        }

        .risk-fill {
          height: 100%;
          border-radius: 10px;
          transition: width .5s ease;
        }

        .high-fill {
          background: #ef4444;
        }

        .medium-fill {
          background: #f59e0b;
        }

        .low-fill {
          background: #22c55e;
        }

        .decision-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 20px;
        }

        .decision-grid div {
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
          padding: 14px 7px;
        }

        .decision-grid strong {
          display: block;
          font-size: 20px;
        }

        .decision-grid span {
          color: #64748b;
          font-size: 9px;
        }

        .feedback-line {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 17px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          font-size: 9px;
          color: #64748b;
        }

        .feedback-line > div {
          display: flex;
          gap: 4px;
        }

        .feedback-line b {
          color: #0f172a;
        }

        /* SIGNALS */

        .signals-list {
          display: flex;
          flex-direction: column;
          margin-top: 15px;
        }

        .signal-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .signal-item:last-child {
          border-bottom: none;
        }

        .signal-number {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
        }

        .signal-text {
          flex: 1;
          color: #475569;
          font-size: 10px;
        }

        .signal-item strong {
          background: #f1f5f9;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 9px;
        }

        .no-signals {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 20px;
        }

        /* FEATURE HUB */

        .feature-hub {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .feature-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 21px;
          display: flex;
          gap: 15px;
        }

        .feature-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-content {
          flex: 1;
        }

        .feature-label {
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .feature-content h3 {
          margin: 6px 0;
          font-size: 17px;
        }

        .feature-content p {
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
          margin: 0 0 14px;
        }

        .feature-content button {
          border: none;
          background: #0f172a;
          color: white;
          border-radius: 7px;
          padding: 9px 12px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        /* QUICK STATS */

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .stat-card svg {
          color: #2563eb;
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 8px;
        }

        .stat-card strong {
          display: block;
          margin-top: 4px;
          font-size: 12px;
        }

        /* QUICK ACCESS */

        .quick-access {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 25px;
        }

        .quick-access h2 {
          margin: 0;
          font-size: 20px;
        }

        .quick-access > p {
          color: #64748b;
          font-size: 11px;
        }

        .quick-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .quick-buttons button {
          border: 1px solid #e2e8f0;
          background: white;
          color: #334155;
          border-radius: 7px;
          padding: 9px 11px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .quick-buttons button:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        @media (max-width: 1000px) {

          .dashboard-navbar {
            flex-wrap: wrap;
            padding: 12px 18px;
          }

          .dashboard-nav {
            order: 3;
            flex-basis: 100%;
          }

          .live-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 700px) {

          .notification-panel {
            position: fixed;
            top: 76px;
            right: 15px;
            width: min(360px, calc(100vw - 30px));
          }


          .dashboard-main {
            padding: 25px 15px;
          }

          .dashboard-heading {
            flex-direction: column;
            align-items: flex-start;
          }

          .dashboard-heading h1 {
            font-size: 30px;
          }

          .dashboard-alert-summary {
            flex-direction: column;
            align-items: stretch;
          }

          .alert-summary-metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }

          .alert-summary-button {
            justify-content: center;
          }

          .live-stats-grid,
          .intelligence-grid,
          .feature-hub {
            grid-template-columns: 1fr;
          }

          .dashboard-stats {
            grid-template-columns: 1fr;
          }

          .feedback-line {
            flex-wrap: wrap;
          }

        }

      `}</style>

    </div>
  );
}

export default Dashboard;