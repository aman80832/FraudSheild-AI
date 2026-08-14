import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  ShieldCheck,
  Bell,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  ArrowLeft,
  Search,
  Ban,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function FraudAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [workingId, setWorkingId] = useState(null);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token || ""}`,
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login before viewing fraud alerts.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/fraud/alerts`,
        { headers }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.alerts || [];

      setAlerts(data);
    } catch (err) {
      console.error("Fraud alerts error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response.data?.detail ||
            "Unable to load fraud alerts."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getRisk = (alert) =>
    String(
      alert?.risk_level ||
        alert?.level ||
        "UNKNOWN"
    ).toUpperCase();

  const unreadCount = alerts.filter(
    (alert) =>
      alert.is_read === false ||
      alert.read === false ||
      alert.is_read === undefined
  ).length;

  const highRiskCount = alerts.filter(
    (alert) => getRisk(alert) === "HIGH"
  ).length;

  const blockedCount = alerts.filter(
    (alert) =>
      String(alert.decision || "").toUpperCase() === "BLOCK"
  ).length;

  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return alerts.filter((alert) => {
      const risk = getRisk(alert);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "UNREAD" &&
          (alert.is_read === false ||
            alert.read === false ||
            alert.is_read === undefined)) ||
        (filter === "HIGH" && risk === "HIGH") ||
        (filter === "BLOCKED" &&
          String(alert.decision || "").toUpperCase() === "BLOCK");

      const text = [
        alert.id,
        alert.message,
        alert.risk_level,
        alert.decision,
        alert.review_status,
        alert.amount,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && text.includes(query);
    });
  }, [alerts, filter, searchTerm]);

  const markRead = async (alert) => {
    const id = alert.id || alert.alert_id;

    if (!id) return;

    try {
      setWorkingId(id);

      await axios.patch(
        `${API_URL}/api/fraud/alerts/${id}/read`,
        {},
        { headers }
      );

      setAlerts((previous) =>
        previous.map((item) =>
          String(item.id || item.alert_id) === String(id)
            ? { ...item, is_read: true, read: true }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to mark alert as read."
      );
    } finally {
      setWorkingId(null);
    }
  };

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

          <button className="nav-button active">
            <Bell size={16} />
            Alerts
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
              FRAUD ALERT CENTER
            </div>

            <h1>Fraud Alerts</h1>

            <p>
              Monitor suspicious activity generated by the FraudShield
              transaction engine.
            </p>
          </div>

          <button
            className="analyze-button"
            onClick={fetchAlerts}
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

        <section className="dashboard-stats">
          <div className="stat-card">
            <Bell size={21} />
            <div>
              <span>Total Alerts</span>
              <strong>{alerts.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <AlertTriangle size={21} />
            <div>
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Shield size={21} />
            <div>
              <span>High Risk</span>
              <strong>{highRiskCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Ban size={21} />
            <div>
              <span>Blocked</span>
              <strong>{blockedCount}</strong>
            </div>
          </div>
        </section>

        <section className="transaction-section dashboard-module-card">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                SECURITY MONITORING
              </span>
              <h2>Alert Management</h2>
              <p>
                Filter and review suspicious transactions detected by
                FraudShield AI.
              </p>
            </div>

            <Bell size={30} />
          </div>

          <div className="alert-toolbar">
            <div className="alert-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <div className="alert-filters">
              {["ALL", "UNREAD", "HIGH", "BLOCKED"].map((item) => (
                <button
                  key={item}
                  className={
                    filter === item
                      ? "alert-filter active"
                      : "alert-filter"
                  }
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="risk-empty">
              <RefreshCw
                size={38}
                className="admin-spin"
              />
              <h3>Loading fraud alerts...</h3>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="risk-empty">
              <CheckCircle2 size={45} />
              <h3>No matching alerts</h3>
              <p>
                FraudShield has not detected alerts matching your
                current filter.
              </p>
            </div>
          ) : (
            <div className="alert-list">
              {filteredAlerts.map((alert, index) => {
                const id = alert.id || alert.alert_id || index + 1;
                const risk = getRisk(alert);
                const isRead =
                  alert.is_read === true ||
                  alert.read === true;

                return (
                  <div
                    className={`fraud-alert-item ${
                      isRead ? "read" : "unread"
                    }`}
                    key={id}
                  >
                    <div className="fraud-alert-icon">
                      {risk === "HIGH" ? (
                        <AlertTriangle size={21} />
                      ) : (
                        <Bell size={21} />
                      )}
                    </div>

                    <div className="fraud-alert-content">
                      <div className="fraud-alert-top">
                        <strong>Alert #{id}</strong>

                        <span
                          className={`risk-pill ${risk.toLowerCase()}`}
                        >
                          {risk}
                        </span>
                      </div>

                      <p>
                        {alert.message ||
                          "Suspicious transaction activity detected."}
                      </p>

                      <div className="fraud-alert-meta">
                        <span>
                          Amount: ₹
                          {Number(alert.amount || 0).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        <span>
                          Score: {alert.risk_score ?? 0}/100
                        </span>

                        <span>
                          Decision: {alert.decision || "REVIEW"}
                        </span>
                      </div>
                    </div>

                    <div className="fraud-alert-actions">
                      <button
                        className="investigate-button"
                        onClick={() => navigate("/admin")}
                      >
                        <Eye size={16} />
                        Investigate
                      </button>

                      {!isRead && (
                        <button
                          className="review-button"
                          disabled={workingId === id}
                          onClick={() => markRead(alert)}
                        >
                          <CheckCircle2 size={16} />
                          {workingId === id
                            ? "Updating..."
                            : "Mark Read"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default FraudAlerts;