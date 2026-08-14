import { useEffect, useState } from "react";
import api from "../api/api";


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
    <div className="alert-page">

      <div className="alert-container">

        <div className="alert-header">

          <div>
            <div className="alert-label">
              FRAUDSHIELD AI
            </div>

            <h1>
              Fraud Alert Center
            </h1>

            <p>
              Monitor suspicious transactions
              detected by FraudShield AI.
            </p>
          </div>

          <div className="alert-header-actions">
            <div className="alert-live-status">
              <span className="live-dot"></span>
              LIVE MONITORING
            </div>

            <button
              className="refresh-button"
              onClick={loadAlerts}
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh Alerts"}
            </button>

            <button
              className={
                autoRefresh
                  ? "auto-refresh-button active"
                  : "auto-refresh-button"
              }
              onClick={() =>
                setAutoRefresh(
                  (current) => !current
                )
              }
            >
              Auto-refresh {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>

        </div>


        {!loading && !error && (
          <div className="alert-summary-grid">
            <div className="alert-summary-card">
              <span>Total Alerts</span>
              <strong>{alerts.length}</strong>
            </div>

            <div className="alert-summary-card unread">
              <span>Unread Alerts</span>
              <strong>{unreadCount}</strong>
            </div>

            <div className="alert-summary-card high">
              <span>High Risk</span>
              <strong>{highRiskCount}</strong>
            </div>

            <div className="alert-summary-card amount">
              <span>Amount at Risk</span>
              <strong>
                ₹{totalAmountAtRisk.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        )}

        {!loading && !error && lastUpdated && (
          <div className="last-updated">
            Last updated:{" "}
            {lastUpdated.toLocaleTimeString()}
            {autoRefresh
              ? " • Auto-refresh every 30 seconds"
              : " • Auto-refresh paused"}
          </div>
        )}

        {loading && (
          <div className="alert-message">
            <h2>
              Loading alerts...
            </h2>

            <p>
              Connecting to FraudShield server.
            </p>
          </div>
        )}


        {!loading && error && (
          <div className="alert-error">

            <h2>
              Unable to load alerts
            </h2>

            <p>
              {error}
            </p>

            <button
              className="retry-button"
              onClick={loadAlerts}
            >
              Try Again
            </button>

          </div>
        )}


        {!loading &&
          !error &&
          alerts.length === 0 && (
            <div className="alert-empty">

              <div className="empty-icon">
                ✓
              </div>

              <h2>
                No Fraud Alerts
              </h2>

              <p>
                There are currently no suspicious
                transactions requiring attention.
              </p>

            </div>
          )}


        {!loading &&
          !error &&
          alerts.length > 0 && (

            <div className="alert-list">

              {alerts.map((alert) => (

                <div
                  className="alert-card"
                  key={alert.id}
                >

                  <div className="alert-card-top">

                    <div>
                      <span className="alert-id">
                        ALERT #{alert.id}
                      </span>

                      <h2>
                        {alert.message ||
                          "Suspicious transaction detected"}
                      </h2>
                    </div>

                    <span
                      className={
                        `risk-badge ` +
                        String(
                          alert.risk_level ||
                            "LOW"
                        ).toLowerCase()
                      }
                    >
                      {alert.risk_level ||
                        "UNKNOWN"}
                    </span>

                  </div>


                  <div className="alert-details">

                    <div>
                      <span>
                        Transaction
                      </span>

                      <strong>
                        #{alert.transaction_id}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Amount
                      </span>

                      <strong>
                        ₹
                        {Number(
                          alert.amount || 0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Risk Score
                      </span>

                      <strong>
                        {alert.risk_score}/100
                      </strong>
                    </div>


                    <div>
                      <span>
                        Decision
                      </span>

                      <strong>
                        {alert.decision ||
                          "PENDING"}
                      </strong>
                    </div>

                  </div>


                  <div className="alert-footer">

                    <span
                      className={
                        alert.is_read
                          ? "read-status"
                          : "unread-status"
                      }
                    >
                      {alert.is_read
                        ? "✓ Read"
                        : "● Unread"}
                    </span>

                    {!alert.is_read && (
                      <button
                        className="mark-read-button"
                        onClick={() =>
                          markAlertRead(alert.id)
                        }
                      >
                        Mark as read
                      </button>
                    )}

                    <span>
                      {alert.created_at
                        ? new Date(
                            alert.created_at
                          ).toLocaleString()
                        : "Unknown time"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

      </div>


      <style>{`

        .alert-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #0f172a;
          font-family: Arial, sans-serif;
          padding: 40px 20px;
          box-sizing: border-box;
        }

        .alert-container {
          width: 100%;
          max-width: 1150px;
          margin: 0 auto;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .alert-label {
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }

        .alert-header h1 {
          margin: 0;
          font-size: 36px;
        }

        .alert-header p {
          color: #64748b;
          margin-top: 10px;
        }

        .refresh-button,
        .retry-button {
          border: none;
          border-radius: 8px;
          padding: 12px 18px;
          background: #0f172a;
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .refresh-button:hover,
        .retry-button:hover {
          background: #1e293b;
        }

        .alert-message,
        .alert-empty,
        .alert-error {
          background: white;
          border-radius: 14px;
          padding: 50px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .alert-message p,
        .alert-empty p {
          color: #64748b;
        }

        .alert-error {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #9f1239;
        }

        .alert-error p {
          margin-bottom: 20px;
        }

        .empty-icon {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dcfce7;
          color: #15803d;
          font-size: 25px;
          font-weight: bold;
        }

        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .alert-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-left: 5px solid #ef4444;
          border-radius: 13px;
          padding: 22px;
          box-shadow:
            0 5px 20px rgba(15, 23, 42, 0.05);
        }

        .alert-card-top {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .alert-id {
          font-size: 10px;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .alert-card h2 {
          font-size: 17px;
          margin: 8px 0 0;
        }

        .risk-badge {
          height: fit-content;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 900;
          background: #fee2e2;
          color: #b91c1c;
        }

        .risk-badge.medium {
          background: #fef3c7;
          color: #b45309;
        }

        .risk-badge.low {
          background: #dcfce7;
          color: #15803d;
        }

        .alert-details {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 15px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        .alert-details span {
          display: block;
          color: #64748b;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .alert-details strong {
          font-size: 13px;
        }

        .alert-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          color: #94a3b8;
          font-size: 11px;
        }

        .alert-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .alert-live-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #15803d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: alertPulse 1.5s infinite;
        }

        @keyframes alertPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(0.8);
          }
        }

        .auto-refresh-button {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 13px;
          background: white;
          color: #475569;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .auto-refresh-button.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .alert-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 12px;
        }

        .alert-summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 17px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .alert-summary-card span {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .alert-summary-card strong {
          font-size: 24px;
          color: #0f172a;
        }

        .alert-summary-card.unread strong {
          color: #2563eb;
        }

        .alert-summary-card.high strong {
          color: #dc2626;
        }

        .alert-summary-card.amount strong {
          font-size: 19px;
        }

        .last-updated {
          margin: 0 0 18px;
          color: #94a3b8;
          font-size: 11px;
        }

        .unread-status {
          color: #dc2626;
          font-weight: 800;
        }

        .read-status {
          color: #16a34a;
          font-weight: 700;
        }

        .mark-read-button {
          border: 1px solid #bfdbfe;
          border-radius: 7px;
          padding: 6px 9px;
          background: #eff6ff;
          color: #1d4ed8;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        @media (max-width: 700px) {

          .alert-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .alert-header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .alert-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .alert-header h1 {
            font-size: 28px;
          }

          .alert-details {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 450px) {
          .alert-summary-grid {
            grid-template-columns: 1fr;
          }

          .alert-header-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .alert-live-status,
          .refresh-button,
          .auto-refresh-button {
            justify-content: center;
            width: 100%;
          }
        }

      `}</style>

    </div>
  );
}

export default Alert;