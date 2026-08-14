import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function Transaction() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");

  // Fraud Network / Geographic Intelligence identifiers
  const [deviceId, setDeviceId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [location, setLocation] = useState("");

  const [beneficiaryNew, setBeneficiaryNew] = useState(false);
  const [deviceNew, setDeviceNew] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);
  const [nightTransaction, setNightTransaction] = useState(false);
  const [transactionsLastHour, setTransactionsLastHour] = useState(1);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // EXPLAINABLE AI HELPERS
  // =====================================================

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const getReasons = (result) => {
    if (!result) return [];

    if (Array.isArray(result.reasons)) {
      return result.reasons.filter(Boolean);
    }

    if (typeof result.reasons === "string") {
      return result.reasons
        .split("|")
        .map((reason) => reason.trim())
        .filter(Boolean);
    }

    if (typeof result.reason === "string") {
      return result.reason
        .split("|")
        .map((reason) => reason.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getSignals = (result) => {
    if (!result) return [];

    if (Array.isArray(result.detected_signals)) {
      return result.detected_signals.filter(Boolean);
    }

    if (typeof result.detected_signals === "string") {
      return result.detected_signals
        .split("|")
        .map((signal) => signal.trim())
        .filter(Boolean);
    }

    return [];
  };

  const formatSignal = (signal) =>
    String(signal)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getRiskLevel = (result) =>
    String(result?.risk_level || "LOW").toUpperCase();

  const getRiskScore = (result) =>
    Math.min(100, Math.max(0, toNumber(result?.risk_score)));

  const getMLScore = (result) => {
    const value =
      result?.ml_risk_score ??
      result?.fraud_probability ??
      result?.ml_probability;

    return value == null
      ? null
      : Math.min(100, Math.max(0, toNumber(value)));
  };

  const getRuleScore = (result) => {
    const value = result?.rule_risk_score;

    return value == null
      ? null
      : Math.min(100, Math.max(0, toNumber(value)));
  };

  const getConfidence = (result) =>
    Math.min(100, Math.max(0, toNumber(result?.confidence)));

  // =====================================================
  // ANALYZE TRANSACTION
  // =====================================================

  const analyzeTransaction = async () => {
    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      if (!amount || Number(amount) <= 0) {
        setError("Please enter a valid transaction amount.");
        setLoading(false);
        return;
      }

      if (!deviceId.trim()) {
        setError("Please enter a Device ID.");
        setLoading(false);
        return;
      }

      if (!beneficiaryId.trim()) {
        setError("Please enter a Beneficiary ID.");
        setLoading(false);
        return;
      }

      if (!location.trim()) {
        setError("Please enter the transaction location.");
        setLoading(false);
        return;
      }

      const response = await api.post(
        "/api/fraud/analyze",
        {
          amount: Number(amount),

          // Fraud Network identifiers
          device_id: deviceId.trim(),
          beneficiary_id: beneficiaryId.trim(),
          location: location.trim(),

          beneficiary_new: beneficiaryNew,
          device_new: deviceNew,
          location_changed: locationChanged,
          transaction_count_last_hour: Number(
            transactionsLastHour
          ),
          is_night_transaction: nightTransaction,
        }
      );

      setAnalysis(
        response.data.analysis || response.data
      );

    } catch (err) {
      console.error("Transaction analysis error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. " +
            "Make sure FastAPI is running on port 8000."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Redirecting to login..."
        );
      } else if (err.response?.status === 422) {
        setError(
          "Invalid transaction data. Please check your inputs."
        );
      } else {
        setError(
          err.response.data?.detail ||
            "Fraud analysis failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const resetTransaction = () => {
    setAmount("");
    setDeviceId("");
    setBeneficiaryId("");
    setLocation("");
    setBeneficiaryNew(false);
    setDeviceNew(false);
    setLocationChanged(false);
    setNightTransaction(false);
    setTransactionsLastHour(1);
    setAnalysis(null);
    setError("");
  };


  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-brand" onClick={() => navigate("/dashboard")}>
          <div className="brand-icon"><Shield size={23} /></div>
          <div><h2>FraudShield AI</h2><span>Real-Time Transaction Protection</span></div>
        </div>
        <nav className="dashboard-nav">
          <button className="nav-button" onClick={() => navigate("/dashboard")}><ShieldCheck size={16} /> Dashboard</button>
          <button className="nav-button active"><ShieldCheck size={16} /> Transaction</button>
          <button className="nav-button" onClick={() => navigate("/voice-phishing")}>Voice Phishing</button>
          <button className="nav-button" onClick={() => navigate("/analytics")}>Analytics</button>
          <button className="nav-button" onClick={() => navigate("/admin")}>Admin</button>
        </nav>
        <button className="logout-button" onClick={logout}>Logout</button>
      </header>

      <main className="dashboard-main">
        <button className="nav-button" onClick={() => navigate("/dashboard")} style={{ marginBottom: "20px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <section className="dashboard-heading">
          <div>
            <div className="dashboard-status"><span></span> CORE FRAUD ENGINE</div>
            <h1>Transaction Security</h1>
            <p>Analyze a transaction before it is completed and understand why FraudShield may consider it risky.</p>
          </div>
        </section>

        {/* =================================================
            TRANSACTION ANALYZER
        ================================================= */}

        <section
          id="transaction-analyzer"
          className="transaction-section"
        >

          <div className="section-title">

            <div>
              <span className="section-kicker">
                CORE FRAUD ENGINE
              </span>

              <h2>
                Transaction Risk Analyzer
              </h2>

              <p>
                Analyze a transaction before it is completed
                and understand why FraudShield may consider
                it risky.
              </p>
            </div>

            <Shield size={30} />

          </div>


          <div className="transaction-grid">

            {/* INPUT */}

            <div className="transaction-form">

              <label>
                Transaction Amount
              </label>

              <div className="amount-input">

                <span>₹</span>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="Enter amount"
                />

              </div>


              {/* =================================================
                  FRAUD NETWORK DETAILS
              ================================================= */}

              <div className="network-inputs">

                <h3>Fraud Network Details</h3>

                <p className="network-input-help">
                  These identifiers connect this transaction to
                  Fraud Network and Geographic Intelligence.
                </p>

                <label>
                  Device ID

                  <input
                    className="number-input"
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="Example: DEV-10293"
                    maxLength={100}
                  />

                  <small>
                    Unique identifier of the device used for this transaction.
                  </small>
                </label>

                <label>
                  Beneficiary ID

                  <input
                    className="number-input"
                    type="text"
                    value={beneficiaryId}
                    onChange={(e) => setBeneficiaryId(e.target.value)}
                    placeholder="Example: BEN-78452"
                    maxLength={100}
                  />

                  <small>
                    UPI ID, beneficiary reference, or recipient identifier.
                  </small>
                </label>

                <label>
                  Transaction Location

                  <input
                    className="number-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Example: Bhubaneswar"
                    maxLength={150}
                  />

                  <small>
                    City, area, or other location associated with the transaction.
                  </small>
                </label>

              </div>


              <div className="security-signals">

                <h3>
                  Security Signals
                </h3>


                <label className="signal-row">

                  <span>
                    New beneficiary
                    <small>
                      Is this recipient new?
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={beneficiaryNew}
                    onChange={(e) =>
                      setBeneficiaryNew(
                        e.target.checked
                      )
                    }
                  />

                </label>


                <label className="signal-row">

                  <span>
                    New device
                    <small>
                      Is this a new device?
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={deviceNew}
                    onChange={(e) =>
                      setDeviceNew(
                        e.target.checked
                      )
                    }
                  />

                </label>


                <label className="signal-row">

                  <span>
                    Location changed
                    <small>
                      Is the location unusual?
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={locationChanged}
                    onChange={(e) =>
                      setLocationChanged(
                        e.target.checked
                      )
                    }
                  />

                </label>


                <label>
                  Transactions in last hour

                  <input
                    className="number-input"
                    type="number"
                    min="0"
                    value={transactionsLastHour}
                    onChange={(e) =>
                      setTransactionsLastHour(
                        e.target.value
                      )
                    }
                  />

                </label>


                <label className="signal-row">

                  <span>
                    Unusual / night transaction
                    <small>
                      Is this transaction occurring late?
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={nightTransaction}
                    onChange={(e) =>
                      setNightTransaction(
                        e.target.checked
                      )
                    }
                  />

                </label>

              </div>


              {error && (

                <div className="dashboard-error">
                  <AlertTriangle size={17} />
                  {error}
                </div>

              )}


              <button
                className="analyze-button"
                onClick={analyzeTransaction}
                disabled={loading}
              >

                {loading
                  ? "Analyzing..."
                  : "Analyze Transaction"}

              </button>

              <button
                type="button"
                className="nav-button"
                onClick={resetTransaction}
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  justifyContent: "center",
                }}
              >
                Clear Transaction
              </button>

            </div>


            {/* RESULT */}

            <div className="risk-panel">

              {!analysis ? (

                <div className="risk-empty">

                  <Shield size={55} />

                  <h3>
                    Ready to Analyze
                  </h3>

                  <p>
                    Enter transaction details and run
                    the AI risk assessment.
                  </p>

                </div>

              ) : (

                <div className="risk-result">

                  {/* EXPLAINABLE AI HEADER */}

                  <div className="explainable-header">

                    <div>
                      <span className="section-kicker">
                        EXPLAINABLE AI
                      </span>

                      <h3>
                        AI Risk Assessment
                      </h3>

                      <p>
                        FraudShield explains the signals
                        that influenced this decision.
                      </p>
                    </div>

                    <ShieldCheck size={28} />

                  </div>


                  {/* RISK SCORE */}

                  <div className="risk-gauge">

                    <div
                      className={`risk-circle ${getRiskLevel(
                        analysis
                      ).toLowerCase()}`}
                    >

                      <strong>
                        {getRiskScore(analysis)}
                      </strong>

                      <span>
                        /100
                      </span>

                    </div>

                    <div className="risk-level">

                      <span>
                        Risk Level
                      </span>

                      <strong>
                        {getRiskLevel(analysis)}
                      </strong>

                    </div>

                  </div>


                  {/* DECISION */}

                  <div className="ai-decision">

                    <span>
                      AI Decision
                    </span>

                    <strong
                      className={String(
                        analysis.decision || "REVIEW"
                      ).toLowerCase()}
                    >
                      {analysis.decision || "REVIEW"}
                    </strong>

                  </div>


                  {/* MODEL BREAKDOWN */}

                  <div className="model-breakdown">

                    <h4>
                      Model Breakdown
                    </h4>

                    <div className="model-row">

                      <div className="model-label">
                        <span>
                          Machine Learning
                        </span>

                        <strong>
                          {getMLScore(analysis) == null
                            ? "—"
                            : `${getMLScore(analysis)}%`}
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill ml"
                          style={{
                            width: `${
                              getMLScore(analysis) ?? 0
                            }%`,
                          }}
                        />
                      </div>

                    </div>


                    <div className="model-row">

                      <div className="model-label">
                        <span>
                          Rule Engine
                        </span>

                        <strong>
                          {getRuleScore(analysis) == null
                            ? "—"
                            : `${getRuleScore(analysis)}/100`}
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill rule"
                          style={{
                            width: `${
                              getRuleScore(analysis) ?? 0
                            }%`,
                          }}
                        />
                      </div>

                    </div>


                    <div className="model-row">

                      <div className="model-label">
                        <span>
                          Hybrid Risk Score
                        </span>

                        <strong>
                          {getRiskScore(analysis)}/100
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill hybrid"
                          style={{
                            width: `${getRiskScore(
                              analysis
                            )}%`,
                          }}
                        />
                      </div>

                    </div>

                  </div>


                  {/* MESSAGE */}

                  {analysis.message && (

                    <div className="result-message">
                      {analysis.message}
                    </div>

                  )}


                  {/* WHY */}

                  <div className="ai-explanation">

                    <h4>
                      Why did FraudShield make
                      this decision?
                    </h4>

                    {getReasons(analysis).length > 0 ? (

                      getReasons(analysis).map(
                        (reason, index) => (

                          <div
                            className="explanation-item"
                            key={index}
                          >

                            <AlertTriangle size={16} />

                            <span>
                              {reason}
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="explanation-safe">

                        <CheckCircle2 size={17} />

                        <span>
                          No major suspicious signals
                          were detected.
                        </span>

                      </div>

                    )}

                  </div>


                  {/* DETECTED SIGNALS */}

                  {getSignals(analysis).length > 0 && (

                    <div className="detected-signals">

                      <h4>
                        Detected Fraud Signals
                      </h4>

                      <div className="signal-tags">

                        {getSignals(analysis).map(
                          (signal, index) => (

                            <span
                              className="signal-tag"
                              key={index}
                            >
                              {formatSignal(signal)}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* TRANSACTION CONTEXT */}

                  <div className="transaction-context">

                    <h4>
                      Transaction Context
                    </h4>

                    <div className="context-grid">

                      <div className="context-item">
                        <span>Amount</span>

                        <strong>
                          ₹
                          {Number(
                            amount || 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <div className="context-item">
                        <span>Beneficiary</span>
                        <strong>{beneficiaryId || "—"}</strong>
                        <small>{beneficiaryNew ? "New" : "Known"}</small>
                      </div>

                      <div className="context-item">
                        <span>Device</span>
                        <strong>{deviceId || "—"}</strong>
                        <small>{deviceNew ? "New" : "Known"}</small>
                      </div>

                      <div className="context-item">
                        <span>Location</span>
                        <strong>{location || "—"}</strong>
                        <small>{locationChanged ? "Changed" : "Normal"}</small>
                      </div>

                      <div className="context-item">
                        <span>
                          Transactions / Hour
                        </span>

                        <strong>
                          {transactionsLastHour}
                        </strong>
                      </div>

                      <div className="context-item">
                        <span>
                          Night Transaction
                        </span>

                        <strong>
                          {nightTransaction
                            ? "Yes"
                            : "No"}
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* CONFIDENCE */}

                  <div className="confidence-box">

                    <div>

                      <span>
                        AI Confidence
                      </span>

                      <strong>
                        {getConfidence(analysis)}%
                      </strong>

                    </div>

                    <div className="confidence-track">

                      <div
                        style={{
                          width: `${getConfidence(
                            analysis
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              )}

            </div>


          </div>
        </section>



      </main>
    </div>
  );
}

export default Transaction;