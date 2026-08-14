import { useEffect, useState } from "react";
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
} from "lucide-react";

function FraudAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/fraud/analytics"
      );

      setAnalytics(response.data);

    } catch (err) {
      console.error("Analytics error:", err);

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Redirecting to login..."
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
            "Unable to load fraud analytics."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <RefreshCw className="analytics-spin" size={30} />
          <h2>Loading Fraud Intelligence...</h2>
          <p>
            Analyzing your transaction and fraud data.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <AlertTriangle size={40} />

          <h2>Unable to load analytics</h2>

          <p>{error}</p>

          <button
            className="analytics-refresh"
            onClick={fetchAnalytics}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const risk = analytics?.risk_distribution || {};
  const decisions = analytics?.decisions || {};
  const feedback =
    analytics?.analyst_feedback || {};

  const topSignals =
    analytics?.top_risk_signals || [];

  const totalRisk =
    (risk.HIGH || 0) +
    (risk.MEDIUM || 0) +
    (risk.LOW || 0);

  const fraudConfirmed =
    feedback.CONFIRMED_FRAUD || 0;

  const falsePositive =
    feedback.FALSE_POSITIVE || 0;

  const pending =
    feedback.PENDING || 0;

  const reviewed =
    fraudConfirmed + falsePositive;

  const falsePositiveRate =
    reviewed > 0
      ? Math.round(
          (falsePositive / reviewed) * 100
        )
      : 0;

  const getPercentage = (value) => {
    if (!totalRisk) return 0;

    return Math.round(
      (value / totalRisk) * 100
    );
  };

  return (
    <div className="analytics-page">

      <div className="analytics-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="analytics-header">

          <div>

            <div className="analytics-badge">
              <BarChart3 size={16} />
              FRAUD INTELLIGENCE CENTER
            </div>

            <h1>
              Fraud Analytics
            </h1>

            <p>
              Real-time intelligence from your
              transaction and fraud detection activity.
            </p>

          </div>

          <button
            className="analytics-refresh"
            onClick={fetchAnalytics}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

        </div>


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="analytics-stats">

          <div className="analytics-stat">

            <div className="analytics-stat-icon">
              <Activity size={22} />
            </div>

            <div>
              <span>
                Transactions
              </span>

              <strong>
                {summary.total_transactions || 0}
              </strong>
            </div>

          </div>


          <div className="analytics-stat danger">

            <div className="analytics-stat-icon">
              <ShieldAlert size={22} />
            </div>

            <div>
              <span>
                High Risk
              </span>

              <strong>
                {summary.high_risk || 0}
              </strong>
            </div>

          </div>


          <div className="analytics-stat warning">

            <div className="analytics-stat-icon">
              <Ban size={22} />
            </div>

            <div>
              <span>
                Blocked
              </span>

              <strong>
                {summary.blocked || 0}
              </strong>
            </div>

          </div>


          <div className="analytics-stat success">

            <div className="analytics-stat-icon">
              <TrendingUp size={22} />
            </div>

            <div>
              <span>
                Average Risk
              </span>

              <strong>
                {summary.average_risk || 0}/100
              </strong>
            </div>

          </div>

        </div>


        {/* =================================================
            SECONDARY METRICS
        ================================================= */}

        <div className="analytics-mini-grid">

          <div className="analytics-mini-card">

            <span>
              Total Alerts
            </span>

            <strong>
              {summary.total_alerts || 0}
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              Amount at Risk
            </span>

            <strong>
              ₹
              {Number(
                summary.amount_at_risk || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              Confirmed Fraud
            </span>

            <strong className="text-danger">
              {fraudConfirmed}
            </strong>

          </div>


          <div className="analytics-mini-card">

            <span>
              False Positive Rate
            </span>

            <strong className="text-warning">
              {falsePositiveRate}%
            </strong>

          </div>

        </div>


        {/* =================================================
            ANALYTICS GRID
        ================================================= */}

        <div className="analytics-grid">


          {/* RISK DISTRIBUTION */}

          <section className="analytics-panel">

            <div className="analytics-panel-header">

              <div>

                <h2>
                  Risk Distribution
                </h2>

                <p>
                  Transaction risk classification.
                </p>

              </div>

              <ShieldAlert size={22} />

            </div>


            <div className="risk-bars">

              <div className="risk-bar-item">

                <div className="risk-bar-label">

                  <span>
                    HIGH
                  </span>

                  <strong>
                    {risk.HIGH || 0}
                  </strong>

                </div>

                <div className="risk-bar-track">

                  <div
                    className="risk-bar high"
                    style={{
                      width: `${getPercentage(
                        risk.HIGH || 0
                      )}%`,
                    }}
                  />

                </div>

                <small>
                  {getPercentage(
                    risk.HIGH || 0
                  )}%
                </small>

              </div>


              <div className="risk-bar-item">

                <div className="risk-bar-label">

                  <span>
                    MEDIUM
                  </span>

                  <strong>
                    {risk.MEDIUM || 0}
                  </strong>

                </div>

                <div className="risk-bar-track">

                  <div
                    className="risk-bar medium"
                    style={{
                      width: `${getPercentage(
                        risk.MEDIUM || 0
                      )}%`,
                    }}
                  />

                </div>

                <small>
                  {getPercentage(
                    risk.MEDIUM || 0
                  )}%
                </small>

              </div>


              <div className="risk-bar-item">

                <div className="risk-bar-label">

                  <span>
                    LOW
                  </span>

                  <strong>
                    {risk.LOW || 0}
                  </strong>

                </div>

                <div className="risk-bar-track">

                  <div
                    className="risk-bar low"
                    style={{
                      width: `${getPercentage(
                        risk.LOW || 0
                      )}%`,
                    }}
                  />

                </div>

                <small>
                  {getPercentage(
                    risk.LOW || 0
                  )}%
                </small>

              </div>

            </div>

          </section>


          {/* AI DECISIONS */}

          <section className="analytics-panel">

            <div className="analytics-panel-header">

              <div>

                <h2>
                  AI Decisions
                </h2>

                <p>
                  Actions recommended by FraudShield AI.
                </p>

              </div>

              <Activity size={22} />

            </div>


            <div className="decision-list">

              <div className="decision-item">

                <div className="decision-icon block">
                  <Ban size={18} />
                </div>

                <div>
                  <span>
                    BLOCK
                  </span>

                  <strong>
                    {decisions.BLOCK || 0}
                  </strong>
                </div>

              </div>


              <div className="decision-item">

                <div className="decision-icon review">
                  <AlertTriangle size={18} />
                </div>

                <div>
                  <span>
                    REVIEW
                  </span>

                  <strong>
                    {decisions.REVIEW || 0}
                  </strong>
                </div>

              </div>


              <div className="decision-item">

                <div className="decision-icon allow">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <span>
                    ALLOW
                  </span>

                  <strong>
                    {decisions.ALLOW || 0}
                  </strong>
                </div>

              </div>

            </div>

          </section>


          {/* TOP RISK SIGNALS */}

          <section className="analytics-panel">

            <div className="analytics-panel-header">

              <div>

                <h2>
                  Top Risk Signals
                </h2>

                <p>
                  Most frequently detected indicators.
                </p>

              </div>

              <AlertTriangle size={22} />

            </div>


            {topSignals.length === 0 ? (

              <div className="analytics-empty">

                <ShieldCheck size={35} />

                <p>
                  No risk signals detected yet.
                </p>

              </div>

            ) : (

              <div className="signals-list">

                {topSignals.map(
                  (item, index) => (

                    <div
                      className="signal-row"
                      key={`${item.signal}-${index}`}
                    >

                      <div className="signal-rank">
                        #{index + 1}
                      </div>

                      <div className="signal-name">
                        {item.signal}
                      </div>

                      <div className="signal-count">
                        {item.count}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>


          {/* ANALYST FEEDBACK */}

          <section className="analytics-panel">

            <div className="analytics-panel-header">

              <div>

                <h2>
                  Analyst Feedback
                </h2>

                <p>
                  Human review of AI-generated alerts.
                </p>

              </div>

              <CheckCircle2 size={22} />

            </div>


            <div className="feedback-grid">

              <div className="feedback-card confirmed">

                <ShieldAlert size={22} />

                <span>
                  Confirmed Fraud
                </span>

                <strong>
                  {fraudConfirmed}
                </strong>

              </div>


              <div className="feedback-card false">

                <XCircle size={22} />

                <span>
                  False Positive
                </span>

                <strong>
                  {falsePositive}
                </strong>

              </div>


              <div className="feedback-card pending">

                <AlertTriangle size={22} />

                <span>
                  Pending
                </span>

                <strong>
                  {pending}
                </strong>

              </div>

            </div>


            <div className="feedback-summary">

              <div>

                <span>
                  Reviewed Alerts
                </span>

                <strong>
                  {reviewed}
                </strong>

              </div>

              <div>

                <span>
                  False Positive Rate
                </span>

                <strong>
                  {falsePositiveRate}%
                </strong>

              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

export default FraudAnalytics;