import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Smartphone,
  MapPin,
  User,
  Clock3,
  LockKeyhole,
  BrainCircuit,
  RefreshCw,
} from "lucide-react";

function Transaction() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
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

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const getReasons = (result) => {
    if (!result) return [];
    if (Array.isArray(result.reasons)) return result.reasons.filter(Boolean);
    if (typeof result.reasons === "string") {
      return result.reasons.split("|").map((x) => x.trim()).filter(Boolean);
    }
    if (typeof result.reason === "string") {
      return result.reason.split("|").map((x) => x.trim()).filter(Boolean);
    }
    return [];
  };

  const getSignals = (result) => {
    if (!result) return [];
    if (Array.isArray(result.detected_signals)) {
      return result.detected_signals.filter(Boolean);
    }
    if (typeof result.detected_signals === "string") {
      return result.detected_signals.split("|").map((x) => x.trim()).filter(Boolean);
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

  const analyzeTransaction = async () => {
    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      if (!amount || Number(amount) <= 0) {
        setError("Please enter a valid transaction amount.");
        return;
      }
      if (!deviceId.trim()) {
        setError("Please enter a Device ID.");
        return;
      }
      if (!beneficiaryId.trim()) {
        setError("Please enter a Beneficiary ID.");
        return;
      }
      if (!location.trim()) {
        setError("Please enter the transaction location.");
        return;
      }

      const response = await api.post("/api/fraud/analyze", {
        amount: Number(amount),
        device_id: deviceId.trim(),
        beneficiary_id: beneficiaryId.trim(),
        location: location.trim(),
        beneficiary_new: beneficiaryNew,
        device_new: deviceNew,
        location_changed: locationChanged,
        transaction_count_last_hour: Number(transactionsLastHour),
        is_night_transaction: nightTransaction,
      });

      setAnalysis(response.data.analysis || response.data);
    } catch (err) {
      console.error("Transaction analysis error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
      } else if (err.response?.status === 422) {
        setError("Invalid transaction data. Please check your inputs.");
      } else {
        setError(err.response?.data?.detail || "Fraud analysis failed.");
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

  const risk = getRiskLevel(analysis);
  const score = getRiskScore(analysis);
  const decision = String(analysis?.decision || "REVIEW").toUpperCase();
  const mlScore = getMLScore(analysis);
  const ruleScore = getRuleScore(analysis);
  const confidence = getConfidence(analysis);

  const riskClass =
    risk === "HIGH" ? "high" : risk === "MEDIUM" ? "medium" : "low";

  const decisionClass =
    decision === "BLOCK" ? "block" : decision === "ALLOW" ? "allow" : "review";

  const riskMessage =
    risk === "HIGH"
      ? "This transaction contains strong fraud indicators and requires immediate attention."
      : risk === "MEDIUM"
      ? "This transaction contains suspicious signals and should be reviewed."
      : "No major suspicious pattern was detected in this transaction.";

  return (
    <div className="tx-page">
      <header className="tx-nav">
        <button className="tx-brand" onClick={() => navigate("/dashboard")}>
          <span className="tx-brand-icon"><Shield size={20} /></span>
          <span>
            <strong>FraudShield AI</strong>
            <small>TRANSACTION SECURITY</small>
          </span>
        </button>

        <nav className="tx-nav-links">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="active">Transaction</button>
          <button onClick={() => navigate("/voice-phishing")}>Voice Phishing</button>
          <button onClick={() => navigate("/analytics")}>Analytics</button>
          <button onClick={() => navigate("/fraud-network")}>Fraud Network</button>
          <button onClick={() => navigate("/alerts")}>Alerts</button>
          <button onClick={() => navigate("/admin")}>Analyst Center</button>
        </nav>

        <button className="tx-logout" onClick={logout}>Logout</button>
      </header>

      <main className="tx-main">
        <button className="tx-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <section className="tx-hero">
          <div>
            <div className="tx-kicker"><span /> REAL-TIME FRAUD ENGINE</div>
            <h1>Transaction Risk Analyzer</h1>
            <p>
              Submit a transaction context and FraudShield evaluates behavioral,
              device, beneficiary, location and timing signals before the payment is completed.
            </p>
          </div>
          <div className="tx-engine">
            <ShieldCheck size={18} />
            <span>AI ENGINE ONLINE</span>
          </div>
        </section>

        {error && (
          <div className="tx-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className="tx-layout">
          <div className="tx-card tx-input-card">
            <div className="tx-card-head">
              <div>
                <span>STEP 01</span>
                <h2>Transaction Context</h2>
                <p>Provide the signals available at payment time.</p>
              </div>
              <Activity size={20} />
            </div>

            <label className="tx-field">
              <span>Transaction Amount</span>
              <div className="tx-money">
                <b>₹</b>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter transaction amount"
                />
              </div>
            </label>

            <div className="tx-grid">
              <label className="tx-field">
                <span><Smartphone size={13} /> Device ID</span>
                <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="DEV-10293" />
                <small>Unique device identifier.</small>
              </label>

              <label className="tx-field">
                <span><User size={13} /> Beneficiary ID</span>
                <input value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} placeholder="BEN-78452" />
                <small>UPI ID or recipient reference.</small>
              </label>
            </div>

            <label className="tx-field">
              <span><MapPin size={13} /> Transaction Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bhubaneswar" />
              <small>City, area or location associated with the transaction.</small>
            </label>

            <div className="tx-section-label">BEHAVIORAL SECURITY SIGNALS</div>

            <div className="tx-signal-grid">
              <SignalToggle label="New beneficiary" description="Recipient has not been used before." checked={beneficiaryNew} onChange={setBeneficiaryNew} />
              <SignalToggle label="New device" description="Transaction originates from a new device." checked={deviceNew} onChange={setDeviceNew} />
              <SignalToggle label="Location changed" description="Location differs from normal behavior." checked={locationChanged} onChange={setLocationChanged} />
              <SignalToggle label="Night transaction" description="Transaction occurs during unusual hours." checked={nightTransaction} onChange={setNightTransaction} />
            </div>

            <label className="tx-field">
              <span><Clock3 size={13} /> Transactions in last hour</span>
              <input
                type="number"
                min="0"
                value={transactionsLastHour}
                onChange={(e) => setTransactionsLastHour(e.target.value)}
              />
            </label>

            <div className="tx-actions">
              <button className="tx-analyze" onClick={analyzeTransaction} disabled={loading}>
                {loading ? <><RefreshCw size={16} className="spin" /> Analyzing...</> : <><BrainCircuit size={16} /> Analyze Transaction</>}
              </button>
              <button className="tx-clear" onClick={resetTransaction} disabled={loading}>
                Clear
              </button>
            </div>
          </div>

          <div className="tx-card tx-result-card">
            {!analysis ? (
              <div className="tx-empty">
                <div className="tx-empty-icon"><Shield size={30} /></div>
                <span>STEP 02</span>
                <h2>Awaiting Risk Assessment</h2>
                <p>
                  Complete the transaction context and run the AI engine.
                  The explainable result will appear here.
                </p>
                <div className="tx-empty-points">
                  <span><CheckCircle2 size={14} /> ML risk scoring</span>
                  <span><CheckCircle2 size={14} /> Rule evaluation</span>
                  <span><CheckCircle2 size={14} /> Explainable signals</span>
                </div>
              </div>
            ) : (
              <div className="tx-result">
                <div className="tx-card-head">
                  <div>
                    <span>STEP 02 · EXPLAINABLE AI</span>
                    <h2>Risk Assessment</h2>
                    <p>{riskMessage}</p>
                  </div>
                  <div className={`tx-risk-pill ${riskClass}`}>{risk} RISK</div>
                </div>

                <div className="tx-score-row">
                  <div className={`tx-score ${riskClass}`}>
                    <strong>{score}</strong><span>/100</span>
                    <small>RISK SCORE</small>
                  </div>

                  <div className="tx-decision">
                    <span>AI DECISION</span>
                    <strong className={decisionClass}>
                      {decision === "BLOCK" ? <XCircle size={17} /> : decision === "ALLOW" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                      {decision}
                    </strong>
                    <small>FraudShield recommendation</small>
                  </div>
                </div>

                <div className="tx-models">
                  <ModelBar label="Machine Learning" value={mlScore} suffix="%" />
                  <ModelBar label="Rule Engine" value={ruleScore} suffix="/100" />
                  <ModelBar label="Hybrid Risk Score" value={score} suffix="/100" />
                </div>

                {analysis.message && (
                  <div className="tx-message"><LockKeyhole size={15} />{analysis.message}</div>
                )}

                <div className="tx-result-section">
                  <div className="tx-section-heading">
                    <div><span>WHY THIS DECISION?</span><h3>Explainable Risk Signals</h3></div>
                    <BrainCircuit size={18} />
                  </div>

                  {getReasons(analysis).length ? (
                    <div className="tx-reasons">
                      {getReasons(analysis).map((reason, i) => (
                        <div key={i}><AlertTriangle size={15} /><span>{reason}</span></div>
                      ))}
                    </div>
                  ) : (
                    <div className="tx-safe"><CheckCircle2 size={16} /> No major suspicious signals were detected.</div>
                  )}
                </div>

                {getSignals(analysis).length > 0 && (
                  <div className="tx-result-section">
                    <div className="tx-section-heading">
                      <div><span>DETECTED SIGNALS</span><h3>Fraud Indicators</h3></div>
                      <Activity size={18} />
                    </div>
                    <div className="tx-tags">
                      {getSignals(analysis).map((signal, i) => <span key={i}>{formatSignal(signal)}</span>)}
                    </div>
                  </div>
                )}

                <div className="tx-result-section">
                  <div className="tx-section-heading">
                    <div><span>TRANSACTION CONTEXT</span><h3>Signals Used by the Engine</h3></div>
                  </div>
                  <div className="tx-context">
                    <Context label="Amount" value={`₹${Number(amount || 0).toLocaleString("en-IN")}`} />
                    <Context label="Beneficiary" value={beneficiaryId || "—"} sub={beneficiaryNew ? "NEW" : "KNOWN"} />
                    <Context label="Device" value={deviceId || "—"} sub={deviceNew ? "NEW" : "KNOWN"} />
                    <Context label="Location" value={location || "—"} sub={locationChanged ? "CHANGED" : "NORMAL"} />
                    <Context label="Txn / hour" value={transactionsLastHour} />
                    <Context label="Night transaction" value={nightTransaction ? "YES" : "NO"} />
                  </div>
                </div>

                <div className="tx-confidence">
                  <div><span>AI CONFIDENCE</span><strong>{confidence}%</strong></div>
                  <div className="tx-confidence-track"><i style={{ width: `${confidence}%` }} /></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .tx-page{min-height:100vh;background:#050b16;color:#e2e8f0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
        .tx-nav{height:68px;background:#07111f;border-bottom:1px solid rgba(59,130,246,.14);display:flex;align-items:center;gap:22px;padding:0 28px;position:sticky;top:0;z-index:50}
        .tx-brand{border:0;background:none;color:inherit;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;min-width:190px}
        .tx-brand-icon{width:38px;height:38px;border-radius:10px;background:#2563eb;display:grid;place-items:center;box-shadow:0 8px 24px rgba(37,99,235,.25)}
        .tx-brand strong{display:block;font-size:14px}.tx-brand small{display:block;color:#64748b;font-size:8px;letter-spacing:1.8px;margin-top:2px}
        .tx-nav-links{display:flex;gap:4px;align-items:center;flex:1;overflow:auto}.tx-nav-links button{border:1px solid transparent;background:transparent;color:#64748b;padding:9px 11px;border-radius:8px;font-size:11px;white-space:nowrap;cursor:pointer}.tx-nav-links button:hover,.tx-nav-links .active{color:#60a5fa;background:#0d2343;border-color:rgba(59,130,246,.25)}
        .tx-logout{border:1px solid rgba(239,68,68,.2);background:#2a1014;color:#f87171;border-radius:8px;padding:8px 13px;font-size:11px;cursor:pointer}
        .tx-main{max-width:1450px;margin:auto;padding:26px 30px 50px}
        .tx-back{border:0;background:none;color:#64748b;display:flex;gap:7px;align-items:center;font-size:12px;cursor:pointer;margin-bottom:22px}.tx-back:hover{color:#93c5fd}
        .tx-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}.tx-kicker,.tx-card-head>div>span,.tx-section-heading span{font-size:9px;letter-spacing:1.8px;font-weight:800;color:#3b82f6}.tx-kicker{display:flex;align-items:center;gap:7px}.tx-kicker span{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e}.tx-hero h1{font-size:29px;line-height:1.15;margin:8px 0 8px;color:#f8fafc}.tx-hero p{max-width:760px;color:#64748b;font-size:13px;line-height:1.7;margin:0}.tx-engine{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(16,185,129,.22);background:#071e1a;color:#34d399;border-radius:9px;font-size:9px;font-weight:800;letter-spacing:1px;white-space:nowrap}
        .tx-error{display:flex;gap:9px;align-items:center;padding:12px 14px;border:1px solid rgba(239,68,68,.25);background:#2a0e13;color:#fca5a5;border-radius:10px;font-size:12px;margin-bottom:18px}
        .tx-layout{display:grid;grid-template-columns:minmax(360px,.9fr) minmax(460px,1.1fr);gap:20px;align-items:start}.tx-card{background:#091525;border:1px solid rgba(59,130,246,.13);border-radius:15px;box-shadow:0 15px 40px rgba(0,0,0,.2)}.tx-input-card,.tx-result-card{padding:22px}.tx-card-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:20px}.tx-card-head>svg,.tx-section-heading>svg{color:#60a5fa}.tx-card-head h2{font-size:17px;margin:5px 0;color:#f1f5f9}.tx-card-head p{font-size:11px;color:#64748b;line-height:1.55;margin:0;max-width:600px}
        .tx-field{display:block;margin-bottom:15px}.tx-field>span{display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:11px;font-weight:650;margin-bottom:7px}.tx-field small{display:block;color:#475569;font-size:9px;margin-top:5px}.tx-field input{width:100%;height:42px;border:1px solid rgba(59,130,246,.15);background:#050d18;color:#e2e8f0;border-radius:9px;padding:0 12px;outline:none;font-size:12px}.tx-field input:focus{border-color:rgba(59,130,246,.65);box-shadow:0 0 0 3px rgba(59,130,246,.08)}.tx-money{height:52px;border:1px solid rgba(59,130,246,.18);background:#050d18;border-radius:10px;display:flex;align-items:center}.tx-money b{padding:0 14px;color:#60a5fa;font-size:17px;border-right:1px solid rgba(59,130,246,.12)}.tx-money input{border:0;height:100%;background:transparent;font-size:16px;font-weight:700}.tx-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .tx-section-label{font-size:9px;font-weight:800;letter-spacing:1.5px;color:#475569;border-top:1px solid rgba(59,130,246,.1);padding-top:18px;margin:20px 0 10px}.tx-signal-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px}.tx-toggle{border:1px solid rgba(59,130,246,.1);background:#07111f;border-radius:9px;padding:11px;display:flex;justify-content:space-between;gap:8px;cursor:pointer}.tx-toggle:hover{border-color:rgba(59,130,246,.3)}.tx-toggle strong{display:block;font-size:10px;color:#cbd5e1}.tx-toggle small{display:block;color:#475569;font-size:8px;line-height:1.4;margin-top:3px}.tx-switch{width:30px;height:16px;border-radius:20px;background:#1e293b;position:relative;flex:none;margin-top:2px}.tx-switch i{position:absolute;width:12px;height:12px;top:2px;left:2px;border-radius:50%;background:#64748b;transition:.2s}.tx-toggle.on .tx-switch{background:#2563eb}.tx-toggle.on .tx-switch i{transform:translateX(14px);background:#fff}
        .tx-actions{display:flex;gap:9px;margin-top:20px}.tx-analyze{flex:1;height:43px;border:0;border-radius:9px;background:#2563eb;color:white;font-weight:750;font-size:12px;cursor:pointer;display:flex;justify-content:center;align-items:center;gap:8px;box-shadow:0 8px 22px rgba(37,99,235,.2)}.tx-analyze:hover{background:#3b82f6}.tx-analyze:disabled,.tx-clear:disabled{opacity:.5;cursor:not-allowed}.tx-clear{width:90px;border:1px solid rgba(59,130,246,.16);background:#0d1c30;color:#94a3b8;border-radius:9px;cursor:pointer}.spin{animation:txspin 1s linear infinite}@keyframes txspin{to{transform:rotate(360deg)}}
        .tx-empty{min-height:650px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px}.tx-empty-icon{width:72px;height:72px;border-radius:18px;background:#0d2340;border:1px solid rgba(59,130,246,.2);display:grid;place-items:center;color:#3b82f6;margin-bottom:18px}.tx-empty>span{font-size:9px;letter-spacing:1.6px;color:#3b82f6;font-weight:800}.tx-empty h2{font-size:18px;color:#cbd5e1;margin:7px 0}.tx-empty p{font-size:11px;color:#475569;max-width:330px;line-height:1.6}.tx-empty-points{display:flex;flex-direction:column;gap:8px;margin-top:15px;text-align:left}.tx-empty-points span{font-size:10px;color:#64748b;display:flex;gap:7px;align-items:center}.tx-empty-points svg{color:#22c55e}
        .tx-risk-pill{font-size:9px;font-weight:900;letter-spacing:1px;padding:6px 9px;border-radius:7px;border:1px solid}.tx-risk-pill.high,.tx-score.high{color:#f87171;background:#2b0e13;border-color:rgba(239,68,68,.3)}.tx-risk-pill.medium,.tx-score.medium{color:#fbbf24;background:#2b2007;border-color:rgba(245,158,11,.3)}.tx-risk-pill.low,.tx-score.low{color:#34d399;background:#062119;border-color:rgba(16,185,129,.3)}
        .tx-score-row{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:center;border-bottom:1px solid rgba(59,130,246,.1);padding-bottom:20px}.tx-score{width:150px;height:150px;border-radius:50%;border:10px solid currentColor;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;align-content:center;box-shadow:inset 0 0 35px rgba(0,0,0,.3)}.tx-score strong{font-size:43px;line-height:1}.tx-score>span{font-size:12px;margin-top:20px;opacity:.7}.tx-score small{width:100%;text-align:center;font-size:7px;letter-spacing:1.5px;opacity:.55}.tx-decision{padding:18px;border-radius:11px;background:#07111f;border:1px solid rgba(59,130,246,.1)}.tx-decision>span{display:block;color:#475569;font-size:8px;letter-spacing:1.5px;font-weight:800}.tx-decision strong{display:flex;align-items:center;gap:7px;font-size:22px;margin-top:7px}.tx-decision strong.block{color:#f87171}.tx-decision strong.review{color:#fbbf24}.tx-decision strong.allow{color:#34d399}.tx-decision small{display:block;color:#475569;font-size:9px;margin-top:5px}
        .tx-models{display:grid;gap:13px;padding:19px 0;border-bottom:1px solid rgba(59,130,246,.1)}.tx-model{display:grid;gap:6px}.tx-model-top{display:flex;justify-content:space-between;color:#64748b;font-size:9px}.tx-model-top strong{color:#cbd5e1}.tx-track{height:6px;background:#17263a;border-radius:10px;overflow:hidden}.tx-track i{display:block;height:100%;border-radius:10px;background:#3b82f6}.tx-model:nth-child(2) .tx-track i{background:#8b5cf6}.tx-model:nth-child(3) .tx-track i{background:#14b8a6}
        .tx-message{display:flex;gap:8px;align-items:flex-start;background:#071c2a;border:1px solid rgba(14,165,233,.18);padding:11px;border-radius:9px;color:#7dd3fc;font-size:10px;line-height:1.5;margin-top:17px}.tx-result-section{border-bottom:1px solid rgba(59,130,246,.1);padding:19px 0}.tx-section-heading{display:flex;justify-content:space-between;gap:12px}.tx-section-heading h3{font-size:13px;color:#cbd5e1;margin:4px 0 14px}.tx-reasons{display:grid;gap:7px}.tx-reasons div{display:flex;gap:8px;padding:10px;border-radius:8px;background:#170f13;border:1px solid rgba(239,68,68,.12);color:#cbd5e1;font-size:10px;line-height:1.5}.tx-reasons svg{color:#f87171;flex:none}.tx-safe{display:flex;align-items:center;gap:8px;background:#071e18;border:1px solid rgba(16,185,129,.16);padding:11px;border-radius:8px;color:#6ee7b7;font-size:10px}.tx-tags{display:flex;flex-wrap:wrap;gap:7px}.tx-tags span{font-size:9px;color:#fbbf24;background:#241b08;border:1px solid rgba(245,158,11,.18);padding:6px 8px;border-radius:6px}.tx-context{display:grid;grid-template-columns:1fr 1fr;gap:8px}.tx-context-item{background:#07111f;border:1px solid rgba(59,130,246,.08);padding:10px;border-radius:8px}.tx-context-item span{display:block;color:#475569;font-size:8px;text-transform:uppercase;letter-spacing:.8px}.tx-context-item strong{display:block;color:#cbd5e1;font-size:10px;margin-top:4px;word-break:break-word}.tx-context-item small{color:#3b82f6;font-size:7px}.tx-confidence{padding-top:18px}.tx-confidence>div:first-child{display:flex;justify-content:space-between;color:#64748b;font-size:9px}.tx-confidence strong{color:#60a5fa}.tx-confidence-track{height:7px;background:#17263a;border-radius:10px;margin-top:8px;overflow:hidden}.tx-confidence-track i{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#22d3ee);border-radius:10px}
        @media(max-width:1100px){.tx-nav-links button:nth-child(n+5){display:none}.tx-layout{grid-template-columns:1fr}.tx-empty{min-height:300px}}
        @media(max-width:700px){.tx-nav{padding:0 14px}.tx-brand{min-width:auto}.tx-brand small,.tx-nav-links{display:none}.tx-logout{margin-left:auto}.tx-main{padding:20px 14px 40px}.tx-hero{display:block}.tx-engine{display:inline-flex;margin-top:14px}.tx-grid,.tx-signal-grid,.tx-context{grid-template-columns:1fr}.tx-input-card,.tx-result-card{padding:16px}.tx-score-row{grid-template-columns:1fr;text-align:center}.tx-score{margin:auto}.tx-decision{text-align:left}.tx-actions{flex-direction:column}.tx-clear{width:100%;height:42px}}
      `}</style>
    </div>
  );
}

function SignalToggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      className={`tx-toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span style={{ textAlign: "left" }}>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className="tx-switch"><i /></span>
    </button>
  );
}

function ModelBar({ label, value, suffix }) {
  return (
    <div className="tx-model">
      <div className="tx-model-top">
        <span>{label}</span>
        <strong>{value == null ? "—" : `${value}${suffix}`}</strong>
      </div>
      <div className="tx-track">
        <i style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

function Context({ label, value, sub }) {
  return (
    <div className="tx-context-item">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export default Transaction;