import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  User,
  Activity,
  Smartphone,
  CreditCard,
  MapPin,
  Bell,
  Ban,
  TrendingUp,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function UserRiskProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transactionFilter, setTransactionFilter] =
    useState("ALL");
  const [transactionSearch, setTransactionSearch] =
    useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login before viewing your risk profile.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/fraud/user-risk`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(response.data);
    } catch (err) {
      console.error("User risk profile error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response.data?.detail ||
            "Unable to load user risk profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const riskLevel = String(
    profile?.risk_level || "LOW"
  ).toUpperCase();

  const riskScore = Math.min(
    100,
    Math.max(0, Number(profile?.risk_score || 0))
  );

  const transactions = profile?.transactions || [];
  const devices = profile?.devices || [];
  const beneficiaries = profile?.beneficiaries || [];
  const locations = profile?.locations || [];
  const alerts = profile?.alerts || [];

  const stats = {
    transactions:
      profile?.statistics?.transactions ??
      transactions.length,

    alerts:
      profile?.statistics?.alerts ??
      alerts.length,

    blocked:
      profile?.statistics?.blocked ??
      transactions.filter(
        (item) =>
          String(item.decision || "").toUpperCase() === "BLOCK"
      ).length,

    devices:
      profile?.statistics?.devices ??
      devices.length,

    beneficiaries:
      profile?.statistics?.beneficiaries ??
      beneficiaries.length,

    locations:
      profile?.statistics?.locations ??
      locations.length,
  };

  const riskClass = riskLevel.toLowerCase();

  const recentTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        const decision = String(
          transaction.decision || "REVIEW"
        ).toUpperCase();

        const matchesFilter =
          transactionFilter === "ALL" ||
          decision === transactionFilter;

        const searchable = [
          transaction.id,
          transaction.transaction_id,
          transaction.amount,
          transaction.risk_score,
          transaction.risk_level,
          transaction.decision,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || searchable.includes(query);

        return matchesFilter && matchesSearch;
      })
      .slice(0, 8);
  }, [
    transactions,
    transactionFilter,
    transactionSearch,
  ]);

  const averageTransactionRisk =
    transactions.length > 0
      ? Math.round(
          transactions.reduce(
            (sum, item) =>
              sum + Number(item.risk_score || 0),
            0
          ) / transactions.length
        )
      : 0;

  const highRiskTransactions = transactions.filter(
    (item) =>
      String(item.risk_level || "").toUpperCase() ===
      "HIGH"
  ).length;

  const allowedTransactions = transactions.filter(
    (item) =>
      String(item.decision || "").toUpperCase() ===
      "ALLOW"
  ).length;

  const reviewTransactions = transactions.filter(
    (item) =>
      String(item.decision || "").toUpperCase() ===
      "REVIEW"
  ).length;

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-navbar">
        <div
          className="dashboard-brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="brand-icon">
            <Shield size={23} />
          </div>

          <div>
            <h2>FraudShield AI</h2>
            <span>Real-Time Transaction Protection</span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className="nav-button"
            onClick={() => navigate("/dashboard")}
          >
            <ShieldCheck size={16} />
            Dashboard
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/transaction")}
          >
            Transaction
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/voice-phishing")}
          >
            Voice Phishing
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/analytics")}
          >
            Analytics
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/fraud-network")}
          >
            Fraud Network
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/alerts")}
          >
            <Bell size={16} />
            Alerts
          </button>

          <button
            className="nav-button active"
            onClick={() => navigate("/user-risk")}
          >
            <User size={16} />
            Risk Profile
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        </nav>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <button
          className="nav-button"
          onClick={() => navigate("/dashboard")}
          style={{ marginBottom: "20px" }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <section className="dashboard-heading">
          <div>
            <div className="dashboard-status">
              <span></span>
              USER RISK INTELLIGENCE
            </div>

            <h1>User Risk Profile</h1>

            <p>
              A consolidated view of transaction behavior, alerts,
              devices, beneficiaries and locations.
            </p>
          </div>

          <button
            className="analyze-button"
            onClick={loadProfile}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        {error && (
          <div className="dashboard-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && !profile ? (
          <section className="transaction-section">
            <div className="risk-empty">
              <RefreshCw size={42} />
              <h3>Building user risk profile...</h3>
              <p>
                FraudShield is collecting your security signals.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="risk-profile-hero">
              <div className="profile-identity">
                <div className="profile-avatar">
                  <User size={32} />
                </div>

                <div>
                  <span className="section-kicker">
                    PROTECTED USER
                  </span>

                  <h2>
                    {profile?.user?.name ||
                      profile?.name ||
                      "Current User"}
                  </h2>

                  <p>
                    {profile?.user?.email ||
                      profile?.email ||
                      "Authenticated FraudShield account"}
                  </p>
                </div>
              </div>

              <div className={`profile-risk ${riskClass}`}>
                <span>OVERALL RISK</span>
                <strong>{riskLevel}</strong>
                <small>{riskScore}/100</small>
              </div>
            </section>

            <section className="dashboard-stats">
              <div className="stat-card">
                <Activity size={21} />
                <div>
                  <span>Transactions</span>
                  <strong>{stats.transactions}</strong>
                </div>
              </div>

              <div className="stat-card">
                <Bell size={21} />
                <div>
                  <span>Fraud Alerts</span>
                  <strong>{stats.alerts}</strong>
                </div>
              </div>

              <div className="stat-card">
                <Ban size={21} />
                <div>
                  <span>Blocked</span>
                  <strong>{stats.blocked}</strong>
                </div>
              </div>

              <div className="stat-card">
                <TrendingUp size={21} />
                <div>
                  <span>Risk Score</span>
                  <strong>{riskScore}/100</strong>
                </div>
              </div>
            </section>

            <section className="network-entities">
              <div className="network-entity-card">
                <Smartphone size={21} />
                <span>Devices</span>
                <strong>{stats.devices}</strong>
              </div>

              <div className="network-entity-card">
                <CreditCard size={21} />
                <span>Beneficiaries</span>
                <strong>{stats.beneficiaries}</strong>
              </div>

              <div className="network-entity-card">
                <MapPin size={21} />
                <span>Locations</span>
                <strong>{stats.locations}</strong>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div className="stat-card">
                <TrendingUp size={21} />
                <div>
                  <span>Avg. Transaction Risk</span>
                  <strong>
                    {averageTransactionRisk}/100
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <AlertTriangle size={21} />
                <div>
                  <span>High Risk Transactions</span>
                  <strong>{highRiskTransactions}</strong>
                </div>
              </div>

              <div className="stat-card">
                <ShieldCheck size={21} />
                <div>
                  <span>Allowed</span>
                  <strong>{allowedTransactions}</strong>
                </div>
              </div>

              <div className="stat-card">
                <Activity size={21} />
                <div>
                  <span>Needs Review</span>
                  <strong>{reviewTransactions}</strong>
                </div>
              </div>
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    BEHAVIORAL RISK
                  </span>

                  <h2>Risk Assessment</h2>

                  <p>
                    Current risk is based on the user's available
                    transaction and fraud signals.
                  </p>
                </div>

                <Shield size={30} />
              </div>

              <div className="profile-risk-meter">
                <div className="model-label">
                  <span>Overall Risk Score</span>
                  <strong>{riskScore}/100</strong>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${riskClass}`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>

              {profile?.risk_reasons?.length > 0 && (
                <div className="ai-explanation">
                  <h4>Risk Factors</h4>

                  {profile.risk_reasons.map((reason, index) => (
                    <div
                      className="explanation-item"
                      key={index}
                    >
                      <AlertTriangle size={16} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    TRANSACTION HISTORY
                  </span>

                  <h2>Recent Transactions</h2>
                </div>

                <Activity size={28} />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <input
                  value={transactionSearch}
                  onChange={(event) =>
                    setTransactionSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search transaction, risk or decision..."
                  style={{
                    flex: "1 1 260px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    outline: "none",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />

                <select
                  value={transactionFilter}
                  onChange={(event) =>
                    setTransactionFilter(
                      event.target.value
                    )
                  }
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "white",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value="ALL">
                    All Decisions
                  </option>
                  <option value="BLOCK">
                    Blocked
                  </option>
                  <option value="ALLOW">
                    Allowed
                  </option>
                  <option value="REVIEW">
                    Review
                  </option>
                </select>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="risk-empty">
                  <Activity size={42} />
                  <h3>No transactions yet</h3>
                  <p>
                    Analyze a transaction to begin building the
                    user's risk profile.
                  </p>
                </div>
              ) : (
                <div className="risk-transaction-list">
                  {recentTransactions.map((transaction, index) => {
                    const decision = String(
                      transaction.decision || "REVIEW"
                    ).toUpperCase();

                    return (
                      <div
                        className="risk-transaction-item"
                        key={
                          transaction.id ||
                          transaction.transaction_id ||
                          index
                        }
                        onClick={() =>
                          setSelectedTransaction(
                            transaction
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <strong>
                            ₹
                            {Number(
                              transaction.amount || 0
                            ).toLocaleString("en-IN")}
                          </strong>

                          <span>
                            Risk:{" "}
                            {transaction.risk_score ?? 0}/100
                          </span>
                        </div>

                        <span
                          className={`risk-pill ${String(
                            transaction.risk_level ||
                              "LOW"
                          ).toLowerCase()}`}
                        >
                          {String(
                            transaction.risk_level || "LOW"
                          ).toUpperCase()}
                        </span>

                        <strong className={decision.toLowerCase()}>
                          {decision}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="profile-columns">
              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      DEVICES
                    </span>
                    <h2>Known Devices</h2>
                  </div>

                  <Smartphone size={27} />
                </div>

                {devices.length === 0 ? (
                  <p className="empty-inline">
                    No device identifiers recorded yet.
                  </p>
                ) : (
                  <div className="profile-tag-list">
                    {devices.map((device, index) => (
                      <span key={index}>
                        <Smartphone size={14} />
                        {typeof device === "string"
                          ? device
                          : device.device_id || device.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      BENEFICIARIES
                    </span>
                    <h2>Known Beneficiaries</h2>
                  </div>

                  <CreditCard size={27} />
                </div>

                {beneficiaries.length === 0 ? (
                  <p className="empty-inline">
                    No beneficiary identifiers recorded yet.
                  </p>
                ) : (
                  <div className="profile-tag-list">
                    {beneficiaries.map((beneficiary, index) => (
                      <span key={index}>
                        <CreditCard size={14} />
                        {typeof beneficiary === "string"
                          ? beneficiary
                          : beneficiary.beneficiary_id ||
                            beneficiary.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    LOCATIONS
                  </span>

                  <h2>Observed Locations</h2>
                </div>

                <MapPin size={27} />
              </div>

              {locations.length === 0 ? (
                <p className="empty-inline">
                  No location identifiers recorded yet.
                </p>
              ) : (
                <div className="profile-tag-list">
                  {locations.map((location, index) => (
                    <span key={index}>
                      <MapPin size={14} />
                      {typeof location === "string"
                        ? location
                        : location.location || location.name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    ALERT HISTORY
                  </span>

                  <h2>Recent Fraud Alerts</h2>
                </div>

                <Bell size={27} />
              </div>

              {alerts.length === 0 ? (
                <div className="risk-empty">
                  <ShieldCheck size={42} />
                  <h3>No fraud alerts</h3>
                  <p>
                    No fraud alerts are currently associated with
                    this user.
                  </p>
                </div>
              ) : (
                <div className="risk-transaction-list">
                  {alerts.slice(0, 8).map((alert, index) => (
                    <div
                      className="risk-transaction-item"
                      key={alert.id || index}
                    >
                      <div>
                        <strong>
                          ₹
                          {Number(
                            alert.amount || 0
                          ).toLocaleString("en-IN")}
                        </strong>

                        <span>
                          Score: {alert.risk_score ?? 0}/100
                        </span>
                      </div>

                      <span
                        className={`risk-pill ${String(
                          alert.risk_level || "LOW"
                        ).toLowerCase()}`}
                      >
                        {String(
                          alert.risk_level || "LOW"
                        ).toUpperCase()}
                      </span>

                      <strong>
                        {alert.decision || "REVIEW"}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="analyze-button"
                onClick={() => navigate("/alerts")}
                style={{ marginTop: "20px" }}
              >
                Open Fraud Alerts
              </button>
            </section>
          </>
        )}
        {selectedTransaction && (
          <div
            onClick={() =>
              setSelectedTransaction(null)
            }
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "min(560px, 100%)",
                background: "white",
                borderRadius: "14px",
                padding: "24px",
                boxShadow:
                  "0 25px 70px rgba(0,0,0,.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#2563eb",
                      fontSize: "9px",
                      fontWeight: 900,
                      letterSpacing: "1.5px",
                    }}
                  >
                    TRANSACTION INVESTIGATION
                  </span>

                  <h2
                    style={{
                      margin: "6px 0",
                    }}
                  >
                    Transaction #
                    {selectedTransaction.id ||
                      selectedTransaction.transaction_id ||
                      "—"}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    Review the transaction risk signals
                    associated with this user.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedTransaction(null)
                  }
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "9px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    AMOUNT
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    ₹
                    {Number(
                      selectedTransaction.amount || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "9px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    RISK SCORE
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    {selectedTransaction.risk_score ??
                      0}
                    /100
                  </strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "9px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    RISK LEVEL
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    {String(
                      selectedTransaction.risk_level ||
                        "LOW"
                    ).toUpperCase()}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "9px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    DECISION
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    {String(
                      selectedTransaction.decision ||
                        "REVIEW"
                    ).toUpperCase()}
                  </strong>
                </div>
              </div>

              {selectedTransaction.reasons && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px",
                    background: "#eff6ff",
                    borderRadius: "9px",
                    color: "#1e3a8a",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Risk signals</strong>
                  <p
                    style={{
                      margin: "7px 0 0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedTransaction.reasons}
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "18px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="analyze-button"
                  onClick={() => {
                    setSelectedTransaction(null);
                    navigate("/transaction");
                  }}
                >
                  Open Transaction Analyzer
                </button>

                <button
                  onClick={() => {
                    setSelectedTransaction(null);
                    navigate("/alerts");
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "white",
                    borderRadius: "7px",
                    padding: "9px 13px",
                    cursor: "pointer",
                  }}
                >
                  View Alerts
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default UserRiskProfile;