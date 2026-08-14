import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
  X,
  Eye,
  Brain,
  Smartphone,
  MapPin,
  UserRound,
  Clock,
  CheckCircle2,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";

function AdminDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected alert for investigation
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Marking alert as reviewed
  const [reviewing, setReviewing] = useState(false);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // =====================================================
  // ROLE / PERMISSIONS
  // =====================================================

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const currentUser = getStoredUser();

  const userRole = String(
    currentUser.role ||
      currentUser.user_role ||
      currentUser.account_role ||
      "USER"
  ).toUpperCase();

  const canInvestigate =
    userRole === "ANALYST" ||
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN";

  const isAdmin =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN";

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [alertsResponse, transactionsResponse] =
        await Promise.all([
          axios.get(
            "http://localhost:8000/api/fraud/alerts",
            { headers }
          ),

          axios.get(
            "http://localhost:8000/api/transactions",
            { headers }
          ),
        ]);

      const alertsData = Array.isArray(
        alertsResponse.data
      )
        ? alertsResponse.data
        : alertsResponse.data.alerts || [];

      const transactionsData = Array.isArray(
        transactionsResponse.data
      )
        ? transactionsResponse.data
        : transactionsResponse.data.transactions || [];

      setAlerts(alertsData);
      setTransactions(transactionsData);

    } catch (err) {
      console.error("Admin dashboard error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
          "Unable to load fraud monitoring data."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const highRiskCount = alerts.filter(
    (alert) =>
      String(
        alert.risk_level ||
        alert.level ||
        ""
      ).toUpperCase() === "HIGH"
  ).length;

  const mediumRiskCount = alerts.filter(
    (alert) =>
      String(
        alert.risk_level ||
        alert.level ||
        ""
      ).toUpperCase() === "MEDIUM"
  ).length;

  const unreadCount = alerts.filter(
    (alert) =>
      alert.is_read === false ||
      alert.read === false ||
      alert.is_read === undefined
  ).length;

  const blockedCount = transactions.filter(
    (transaction) =>
      String(
        transaction.decision || ""
      ).toUpperCase() === "BLOCK"
  ).length;

  // =====================================================
  // SEARCH ALERTS
  // =====================================================

  const filteredAlerts = alerts.filter((alert) => {
    const search = searchTerm.toLowerCase();

    return (
      String(
        alert.id ||
        alert.alert_id ||
        ""
      )
        .toLowerCase()
        .includes(search) ||

      String(
        alert.message || ""
      )
        .toLowerCase()
        .includes(search) ||

      String(
        alert.risk_level ||
        alert.level ||
        ""
      )
        .toLowerCase()
        .includes(search)
    );
  });

  // =====================================================
  // OPEN INVESTIGATION
  // =====================================================

  const openInvestigation = (alert) => {
    setSelectedAlert(alert);
  };

  // =====================================================
  // CLOSE INVESTIGATION
  // =====================================================

  const closeInvestigation = () => {
    setSelectedAlert(null);
  };

  // =====================================================
  // MARK ALERT AS REVIEWED
  // =====================================================

  const markAsReviewed = async () => {
    if (!selectedAlert) return;

    const alertId =
      selectedAlert.id ||
      selectedAlert.alert_id;

    if (!alertId) {
      setError(
        "This alert does not contain a valid alert ID."
      );
      return;
    }

    try {
      setReviewing(true);

      await axios.patch(
        `http://localhost:8000/api/fraud/alerts/${alertId}/read`,
        {},
        { headers }
      );

      // Update local UI
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => {
          const currentId =
            alert.id ||
            alert.alert_id;

          if (String(currentId) === String(alertId)) {
            return {
              ...alert,
              is_read: true,
              read: true,
            };
          }

          return alert;
        })
      );

      setSelectedAlert((previous) =>
        previous
          ? {
              ...previous,
              is_read: true,
              read: true,
            }
          : null
      );

    } catch (err) {
      console.error(
        "Unable to mark alert as reviewed:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to mark this alert as reviewed."
      );
    } finally {
      setReviewing(false);
    }
  };

  // =====================================================
  // ANALYST DECISION
  // =====================================================

  const reviewAlert = async (alertId, action) => {
    if (!canInvestigate) {
      setError(
        "Analyst or Admin permission is required for this action."
      );
      return;
    }

    if (!alertId) {
      setError("This alert does not contain a valid alert ID.");
      return;
    }

    try {
      setReviewing(true);
      setError("");

      const response = await axios.patch(
        `http://localhost:8000/api/fraud/alerts/${alertId}/${action}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("access_token") ||
              localStorage.getItem("token") ||
              ""
            }`,
          },
        }
      );

      const updatedAlert = response.data?.alert || {};
      const reviewStatus =
        response.data?.review_status ||
        (action === "confirm"
          ? "CONFIRMED_FRAUD"
          : "FALSE_POSITIVE");

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) => {
          const currentId = alert.id || alert.alert_id;

          if (String(currentId) === String(alertId)) {
            return {
              ...alert,
              ...updatedAlert,
              review_status: reviewStatus,
              is_read: true,
              read: true,
            };
          }

          return alert;
        })
      );

      setSelectedAlert((previous) =>
        previous
          ? {
              ...previous,
              ...updatedAlert,
              review_status: reviewStatus,
              is_read: true,
              read: true,
            }
          : null
      );

    } catch (err) {
      console.error("Fraud review error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
          "Unable to update the analyst decision."
        );
      }
    } finally {
      setReviewing(false);
    }
  };

  // =====================================================
  // ADMIN: DELETE / DISMISS ALERT
  // =====================================================

  const dismissAlert = async (alertId) => {
    if (!isAdmin) {
      setError(
        "Admin permission is required to dismiss alerts."
      );
      return;
    }

    if (!alertId) {
      setError("This alert does not contain a valid alert ID.");
      return;
    }

    const confirmed = window.confirm(
      `Dismiss Alert #${alertId}? This will permanently remove the fraud alert.`
    );

    if (!confirmed) return;

    try {
      setReviewing(true);
      setError("");

      await axios.delete(
        `http://localhost:8000/api/fraud/alerts/${alertId}`,
        { headers }
      );

      setAlerts((previousAlerts) =>
        previousAlerts.filter((alert) => {
          const currentId =
            alert.id || alert.alert_id;

          return (
            String(currentId) !==
            String(alertId)
          );
        })
      );

      setSelectedAlert(null);
    } catch (err) {
      console.error(
        "Admin dismiss alert error:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "Admin permission is required to dismiss alerts."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to dismiss this fraud alert."
        );
      }
    } finally {
      setReviewing(false);
    }
  };

  // =====================================================
  // RISK HELPERS
  // =====================================================

  const getRiskLevel = (alert) => {
    return String(
      alert?.risk_level ||
      alert?.level ||
      "UNKNOWN"
    ).toUpperCase();
  };

  const getRiskClass = (risk) => {
    return risk.toLowerCase();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-page">

      <div className="admin-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-header">

          <div>

            <div className="admin-badge">
              🏦 FRAUD OPERATIONS CENTER
              <span
                style={{
                  marginLeft: "10px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 800,
                  background: isAdmin
                    ? "#fee2e2"
                    : "#dbeafe",
                  color: isAdmin
                    ? "#b91c1c"
                    : "#1d4ed8",
                }}
              >
                {isAdmin ? "ADMIN" : "ANALYST"}
              </span>
            </div>

            <h1>
              {isAdmin
                ? "Fraud Operations Admin"
                : "Fraud Analyst Dashboard"}
            </h1>

            <p>
              Monitor suspicious transactions,
              investigate fraud alerts and review
              AI decisions.
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={fetchData}
            disabled={loading}
          >

            <RefreshCw
              size={18}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="admin-error">

            <AlertTriangle size={18} />

            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="error-close"
            >
              <X size={16} />
            </button>

          </div>

        )}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="admin-stats">

          <div className="admin-stat">

            <Activity size={25} />

            <div>

              <span>
                Total Transactions
              </span>

              <strong>
                {transactions.length}
              </strong>

            </div>

          </div>


          <div className="admin-stat danger">

            <ShieldAlert size={25} />

            <div>

              <span>
                High Risk Alerts
              </span>

              <strong>
                {highRiskCount}
              </strong>

            </div>

          </div>


          <div className="admin-stat warning">

            <AlertTriangle size={25} />

            <div>

              <span>
                Medium Risk
              </span>

              <strong>
                {mediumRiskCount}
              </strong>

            </div>

          </div>


          <div className="admin-stat success">

            <ShieldCheck size={25} />

            <div>

              <span>
                Blocked Transactions
              </span>

              <strong>
                {blockedCount}
              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            ADMIN CONTROLS
        ================================================= */}

        {isAdmin && (
          <section
            className="admin-panel"
            style={{ marginBottom: "20px" }}
          >
            <div className="panel-header">
              <div>
                <h2>
                  <UserCog
                    size={19}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "8px",
                    }}
                  />
                  Admin Controls
                </h2>

                <p>
                  Administrative actions are available
                  only to authenticated admin accounts.
                </p>
              </div>

              <span className="live-status">
                ● ADMIN ACCESS
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                padding: "16px",
              }}
            >
              <span className="decision-pill">
                Analyst Actions: Enabled
              </span>

              <span className="decision-pill">
                Investigate: Enabled
              </span>

              <span className="decision-pill">
                Confirm / False Positive: Enabled
              </span>

              <span className="decision-pill">
                Delete / Dismiss: Enabled
              </span>
            </div>
          </section>
        )}

        {/* =================================================
            ALERT PANEL
        ================================================= */}

        <section className="admin-panel">

          <div className="panel-header">

            <div>

              <h2>
                🚨 Fraud Alerts
              </h2>

              <p>
                Suspicious activity requiring
                analyst attention.
              </p>

            </div>

            <span className="live-status">
              ● LIVE
            </span>

          </div>


          {/* SEARCH */}

          <div className="alert-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

          </div>


          {loading ? (

            <div className="admin-loading">

              <RefreshCw
                size={30}
                className="admin-spin"
              />

              <p>
                Loading fraud intelligence...
              </p>

            </div>

          ) : filteredAlerts.length === 0 ? (

            <div className="no-alerts">

              <ShieldCheck size={45} />

              <h3>
                No active alerts
              </h3>

              <p>
                FraudShield has not detected
                any matching fraud alerts.
              </p>

            </div>

          ) : (

            <div className="alert-table">

              <div className="table-header">

                <span>
                  Alert
                </span>

                <span>
                  Risk
                </span>

                <span>
                  Decision
                </span>

                <span>
                  Status
                </span>

                <span>
                  Action
                </span>

              </div>


              {filteredAlerts.map(
                (alert, index) => {

                  const risk =
                    getRiskLevel(alert);

                  const decision =
                    alert.decision ||
                    "REVIEW";

                  const alertId =
                    alert.id ||
                    alert.alert_id ||
                    index + 1;

                  const isRead =
                    alert.is_read === true ||
                    alert.read === true;


                  return (

                    <div
                      className="alert-row"
                      key={alertId}
                    >

                      {/* ALERT */}

                      <div>

                        <strong>
                          Alert #{alertId}
                        </strong>

                        <small>
                          {alert.message ||
                            "Suspicious activity detected"}
                        </small>

                      </div>


                      {/* RISK */}

                      <span
                        className={`risk-pill ${getRiskClass(
                          risk
                        )}`}
                      >
                        {risk}
                      </span>


                      {/* DECISION */}

                      <span className="decision-pill">
                        {decision}
                      </span>


                      {/* STATUS */}

                      <span
                        className={
                          alert.review_status === "CONFIRMED_FRAUD"
                            ? "status-fraud"
                            : alert.review_status === "FALSE_POSITIVE"
                            ? "status-false-positive"
                            : isRead
                            ? "status-read"
                            : "status-new"
                        }
                      >
                        {alert.review_status === "CONFIRMED_FRAUD"
                          ? "Fraud Confirmed"
                          : alert.review_status === "FALSE_POSITIVE"
                          ? "False Positive"
                          : isRead
                          ? "Reviewed"
                          : "NEW"}
                      </span>


                      {/* INVESTIGATE */}

                      {canInvestigate ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="investigate-button"
                            onClick={() =>
                              openInvestigation(alert)
                            }
                          >
                            <Eye size={16} />
                            Investigate
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              className="false-positive-button"
                              onClick={() =>
                                dismissAlert(alertId)
                              }
                              disabled={reviewing}
                              title="Admin: permanently dismiss this alert"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Trash2 size={15} />
                              Dismiss
                            </button>
                          )}
                        </div>
                      ) : (
                        <span
                          className="decision-pill"
                          title="Analyst/Admin permission required"
                        >
                          View only
                        </span>
                      )}

                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>


        {/* =================================================
            RECENT TRANSACTIONS
        ================================================= */}

        <section className="admin-panel">

          <div className="panel-header">

            <div>

              <h2>
                💳 Recent Transactions
              </h2>

              <p>
                Latest activity monitored by
                FraudShield AI.
              </p>

            </div>

          </div>


          {transactions.length === 0 ? (

            <div className="no-alerts">

              No transactions available.

            </div>

          ) : (

            <div className="transaction-list">

              {transactions
                .slice(0, 10)
                .map(
                  (transaction, index) => (

                    <div
                      className="transaction-row"
                      key={
                        transaction.id ||
                        transaction.transaction_id ||
                        index
                      }
                    >

                      <div>

                        <strong>

                          ₹
                          {Number(
                            transaction.amount ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}

                        </strong>

                        <small>

                          Transaction #
                          {transaction.id ||
                            transaction.transaction_id ||
                            index + 1}

                        </small>

                      </div>


                      <div className="transaction-risk">

                        <span>
                          Risk
                        </span>

                        <strong>
                          {
                            transaction.risk_score ??
                            0
                          }
                          /100
                        </strong>

                      </div>


                      <span
                        className={`decision-pill ${
                          String(
                            transaction.decision ||
                              ""
                          ).toLowerCase()
                        }`}
                      >

                        {transaction.decision ||
                          "UNKNOWN"}

                      </span>

                    </div>

                  )
                )}

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          INVESTIGATION DRAWER
      ===================================================== */}

      {selectedAlert && (

        <div
          className="investigation-overlay"
          onClick={closeInvestigation}
        >

          <aside
            className="investigation-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* DRAWER HEADER */}

            <div className="investigation-header">

              <div>

                <span>
                  FRAUD INVESTIGATION
                </span>

                <h2>
                  Alert #
                  {selectedAlert.id ||
                    selectedAlert.alert_id}
                </h2>

              </div>

              <button
                className="close-investigation"
                onClick={closeInvestigation}
              >
                <X size={22} />
              </button>

            </div>


            {/* RISK */}

            <div className="investigation-risk">

              <div
                className={`investigation-score ${getRiskClass(
                  getRiskLevel(selectedAlert)
                )}`}
              >

                <strong>
                  {selectedAlert.risk_score ??
                    selectedAlert.score ??
                    0}
                </strong>

                <span>
                  /100
                </span>

              </div>


              <div>

                <span>
                  AI RISK LEVEL
                </span>

                <h3>
                  {getRiskLevel(
                    selectedAlert
                  )}
                </h3>

                <p>
                  Decision:{" "}
                  <strong>
                    {selectedAlert.decision ||
                      "REVIEW"}
                  </strong>
                </p>

              </div>

            </div>


            {/* AI EXPLANATION */}

            <div className="investigation-section">

              <h3>
                <Brain size={18} />

                AI Explanation
              </h3>

              <p className="investigation-message">

                {selectedAlert.message ||
                  "FraudShield detected suspicious activity based on multiple transaction and behavioural signals."}

              </p>

            </div>


            {/* REASONS */}

            <div className="investigation-section">

              <h3>
                <ShieldAlert size={18} />

                Why was it flagged?
              </h3>


              {Array.isArray(
                selectedAlert.reasons
              ) &&
              selectedAlert.reasons.length > 0 ? (

                <div className="investigation-reasons">

                  {selectedAlert.reasons.map(
                    (reason, index) => (

                      <div
                        className="investigation-reason"
                        key={index}
                      >

                        <AlertTriangle
                          size={16}
                        />

                        <span>
                          {reason}
                        </span>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p className="empty-investigation">
                  Detailed AI reasons were not
                  included in this alert.
                </p>

              )}

            </div>


            {/* DETECTED SIGNALS */}

            <div className="investigation-section">

              <h3>
                <Activity size={18} />

                Detected Signals
              </h3>


              {Array.isArray(
                selectedAlert.detected_signals
              ) &&
              selectedAlert.detected_signals.length >
                0 ? (

                <div className="signal-tags">

                  {selectedAlert.detected_signals.map(
                    (signal, index) => (

                      <span
                        className="signal-tag"
                        key={index}
                      >
                        {String(signal).replace(
                          /_/g,
                          " "
                        )}
                      </span>

                    )
                  )}

                </div>

              ) : (

                <p className="empty-investigation">
                  No individual signal data
                  was provided.
                </p>

              )}

            </div>


            {/* TRANSACTION DETAILS */}

            <div className="investigation-section">

              <h3>
                <Activity size={18} />

                Transaction Context
              </h3>


              <div className="context-grid">

                <div className="context-item">

                  <span>
                    Amount
                  </span>

                  <strong>
                    ₹
                    {Number(
                      selectedAlert.amount ||
                        selectedAlert.transaction_amount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>


                <div className="context-item">

                  <span>
                    Confidence
                  </span>

                  <strong>
                    {selectedAlert.confidence ??
                      "—"}
                    {selectedAlert.confidence !=
                    null
                      ? "%"
                      : ""}
                  </strong>

                </div>


                <div className="context-item">

                  <span>
                    Device
                  </span>

                  <strong>

                    {selectedAlert.device_new
                      ? "New"
                      : "Known"}

                  </strong>

                </div>


                <div className="context-item">

                  <span>
                    Location
                  </span>

                  <strong>

                    {selectedAlert.location_changed
                      ? "Changed"
                      : "Normal"}

                  </strong>

                </div>

                <div className="context-item">

                  <span>
                    Review Status
                  </span>

                  <strong>
                    {selectedAlert.review_status ||
                      (selectedAlert.is_read || selectedAlert.read
                        ? "REVIEWED"
                        : "PENDING")}
                  </strong>

                </div>

              </div>

            </div>


            {/* ANALYST REVIEW */}

            {canInvestigate && (
            <div className="investigation-section">

              <h3>
                <CheckCircle2 size={18} />
                Analyst Review
              </h3>

              <div className="review-status">

                {selectedAlert.review_status === "CONFIRMED_FRAUD" ? (

                  <>
                    <ShieldAlert size={18} />

                    <span>
                      Fraud confirmed by analyst.
                    </span>
                  </>

                ) : selectedAlert.review_status === "FALSE_POSITIVE" ? (

                  <>
                    <ShieldCheck size={18} />

                    <span>
                      Alert marked as false positive.
                    </span>
                  </>

                ) : selectedAlert.is_read || selectedAlert.read ? (

                  <>
                    <CheckCircle2 size={18} />

                    <span>
                      Alert reviewed. Awaiting final classification.
                    </span>
                  </>

                ) : (

                  <>
                    <Eye size={18} />

                    <span>
                      Awaiting analyst decision.
                    </span>
                  </>

                )}

              </div>

              <button
                className="confirm-fraud-button"
                onClick={() =>
                  reviewAlert(
                    selectedAlert.id || selectedAlert.alert_id,
                    "confirm"
                  )
                }
                disabled={
                  reviewing ||
                  selectedAlert.review_status === "CONFIRMED_FRAUD" ||
                  selectedAlert.review_status === "FALSE_POSITIVE"
                }
              >

                {reviewing ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="admin-spin"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={17} />
                    Confirm Fraud
                  </>
                )}

              </button>

              <button
                className="false-positive-button"
                onClick={() =>
                  reviewAlert(
                    selectedAlert.id || selectedAlert.alert_id,
                    "false-positive"
                  )
                }
                disabled={
                  reviewing ||
                  selectedAlert.review_status === "CONFIRMED_FRAUD" ||
                  selectedAlert.review_status === "FALSE_POSITIVE"
                }
              >

                {reviewing ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="admin-spin"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    Mark as False Positive
                  </>
                )}

              </button>

              <button
                className="review-button"
                onClick={markAsReviewed}
                disabled={
                  reviewing ||
                  selectedAlert.is_read ||
                  selectedAlert.read ||
                  selectedAlert.review_status === "CONFIRMED_FRAUD" ||
                  selectedAlert.review_status === "FALSE_POSITIVE"
                }
              >

                <CheckCircle2 size={17} />

                {selectedAlert.is_read || selectedAlert.read
                  ? "Already Reviewed"
                  : "Mark as Reviewed"}

              </button>

            </div>
            )}


            {/* ADMIN CONTROLS */}

            {isAdmin && (
              <div
                className="investigation-section"
                style={{
                  borderTop:
                    "1px solid rgba(239, 68, 68, 0.18)",
                  marginTop: "18px",
                  paddingTop: "18px",
                }}
              >
                <h3>
                  <UserCog size={18} />
                  Admin Controls
                </h3>

                <p
                  style={{
                    marginBottom: "12px",
                    opacity: 0.75,
                  }}
                >
                  Dismissing an alert permanently removes
                  it from the fraud alert list.
                </p>

                <button
                  type="button"
                  className="false-positive-button"
                  onClick={() =>
                    dismissAlert(
                      selectedAlert.id ||
                        selectedAlert.alert_id
                    )
                  }
                  disabled={reviewing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <Trash2 size={17} />
                  {reviewing
                    ? "Dismissing Alert..."
                    : "Delete / Dismiss Alert"}
                </button>
              </div>
            )}


            {/* NOTE */}

            <div className="analyst-note">

              <strong>
                🔎 Investigation note
              </strong>

              <p>
                Confirm the transaction details
                and contact the customer through
                an independent verified channel
                before taking further action.
              </p>

            </div>

          </aside>

        </div>

      )}

    </div>
  );
}

export default AdminDashboard;