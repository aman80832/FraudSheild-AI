import { useState } from "react";
import axios from "axios";
import {
  Mic,
  Upload,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileAudio,
  RefreshCw,
  Activity,
  LockKeyhole,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

function VoicePhishing() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const analyzeTranscript = async () => {
    if (!transcript.trim()) {
      setError("Please enter or paste a voice transcript.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      if (!token) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/voice/analyze`,
        { transcript: transcript.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data.analysis || response.data);
    } catch (err) {
      console.error("Voice analysis error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to analyze the voice transcript."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setFile(null);
    setTranscript("");
    setResult(null);
    setError("");
  };

  const risk = String(result?.risk_level || "LOW").toUpperCase();
  const score = Number(result?.risk_score || 0);
  const confidence = Math.min(Number(result?.confidence || 0), 100);

  const riskMeta = {
    HIGH: {
      color: "#ef4444",
      bg: "rgba(239,68,68,.10)",
      border: "rgba(239,68,68,.25)",
      icon: ShieldAlert,
      label: "HIGH RISK",
    },
    MEDIUM: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,.10)",
      border: "rgba(245,158,11,.25)",
      icon: AlertTriangle,
      label: "MEDIUM RISK",
    },
    LOW: {
      color: "#10b981",
      bg: "rgba(16,185,129,.10)",
      border: "rgba(16,185,129,.25)",
      icon: ShieldCheck,
      label: "LOW RISK",
    },
  }[risk] || {
    color: "#10b981",
    bg: "rgba(16,185,129,.10)",
    border: "rgba(16,185,129,.25)",
    icon: ShieldCheck,
    label: "LOW RISK",
  };

  const RiskIcon = riskMeta.icon;

  return (
    <div className="fs-voice-page">
      <style>{`
        .fs-voice-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 85% 5%, rgba(37,99,235,.10), transparent 28%),
            #f5f7fb;
          color: #0f172a;
          padding: 28px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .fs-voice-container {
          width: min(1320px, 100%);
          margin: 0 auto;
        }

        .fs-voice-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .fs-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          margin-bottom: 10px;
        }

        .fs-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .06em;
        }

        .fs-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,.12);
        }

        .fs-voice-header h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.05;
          letter-spacing: -.04em;
          color: #0f172a;
        }

        .fs-voice-header p {
          margin: 10px 0 0;
          color: #64748b;
          max-width: 680px;
          font-size: 14px;
          line-height: 1.65;
        }

        .fs-reset {
          border: 1px solid #dbe3ef;
          background: white;
          color: #475569;
          border-radius: 10px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          transition: .18s;
          box-shadow: 0 5px 18px rgba(15,23,42,.04);
        }

        .fs-reset:hover {
          border-color: #93c5fd;
          color: #2563eb;
          transform: translateY(-1px);
        }

        .fs-voice-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
        }

        .fs-card {
          background: rgba(255,255,255,.96);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 14px 40px rgba(15,23,42,.06);
          overflow: hidden;
        }

        .fs-card-head {
          padding: 19px 20px;
          border-bottom: 1px solid #edf1f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .fs-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fs-card-title-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #dbeafe;
        }

        .fs-card-title h2 {
          margin: 0;
          font-size: 14px;
          color: #0f172a;
        }

        .fs-card-title p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .fs-card-body {
          padding: 20px;
        }

        .fs-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .fs-meta span {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          border-radius: 7px;
          padding: 6px 8px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fs-upload {
          border: 1.5px dashed #bfdbfe;
          background: #f8fbff;
          border-radius: 14px;
          min-height: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: .18s;
          padding: 18px;
        }

        .fs-upload:hover {
          background: #eff6ff;
          border-color: #60a5fa;
        }

        .fs-upload-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          color: #2563eb;
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .fs-upload strong {
          color: #334155;
          font-size: 13px;
        }

        .fs-upload span {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 4px;
        }

        .fs-upload input {
          display: none;
        }

        .fs-file {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .fs-file svg {
          color: #2563eb;
          flex: 0 0 auto;
        }

        .fs-file strong {
          display: block;
          color: #334155;
          font-size: 11px;
          word-break: break-all;
        }

        .fs-file small {
          color: #94a3b8;
          font-size: 10px;
        }

        .fs-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .fs-divider::before,
        .fs-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: #e2e8f0;
        }

        .fs-label-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .fs-label-row label {
          color: #334155;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .fs-label-row span {
          color: #94a3b8;
          font-size: 10px;
        }

        .fs-textarea {
          width: 100%;
          min-height: 230px;
          resize: vertical;
          border: 1px solid #dbe3ef;
          background: #fbfdff;
          color: #334155;
          border-radius: 12px;
          padding: 13px;
          outline: none;
          font: 13px/1.65 inherit;
          transition: .18s;
        }

        .fs-textarea:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37,99,235,.08);
          background: white;
        }

        .fs-textarea::placeholder {
          color: #a8b3c2;
        }

        .fs-analyze {
          width: 100%;
          margin-top: 13px;
          border: 0;
          border-radius: 11px;
          padding: 13px 16px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 800;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(37,99,235,.22);
          transition: .18s;
        }

        .fs-analyze:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 13px 26px rgba(37,99,235,.27);
        }

        .fs-analyze:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .fs-error {
          margin-top: 12px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 10px;
          font-size: 11px;
          line-height: 1.5;
        }

        .fs-empty {
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          padding: 30px;
        }

        .fs-empty-icon {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: #eff6ff;
          color: #60a5fa;
          border: 1px solid #dbeafe;
          margin-bottom: 15px;
        }

        .fs-empty h3 {
          margin: 0;
          color: #334155;
          font-size: 15px;
        }

        .fs-empty p {
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.6;
          max-width: 280px;
          margin: 7px 0 0;
        }

        .fs-result {
          padding: 20px;
        }

        .fs-complete {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #059669;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .1em;
          margin-bottom: 14px;
        }

        .fs-complete span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }

        .fs-risk {
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid;
          margin-bottom: 13px;
        }

        .fs-risk-label {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .12em;
          opacity: .72;
        }

        .fs-score {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-top: 3px;
        }

        .fs-score strong {
          font-size: 40px;
          line-height: 1;
          letter-spacing: -.04em;
        }

        .fs-score small {
          font-size: 12px;
          opacity: .55;
        }

        .fs-risk-level {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 90px;
        }

        .fs-risk-level strong {
          font-size: 10px;
          letter-spacing: .08em;
        }

        .fs-decision {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 13px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          background: #f8fafc;
        }

        .fs-decision span {
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
        }

        .fs-decision strong {
          color: #0f172a;
          font-size: 11px;
          letter-spacing: .08em;
        }

        .fs-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px;
          font-size: 10px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .fs-note svg {
          color: #2563eb;
          flex: 0 0 auto;
        }

        .fs-confidence {
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 13px;
        }

        .fs-confidence-top {
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .fs-confidence-top strong {
          color: #0f172a;
        }

        .fs-track {
          height: 7px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .fs-track > div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #06b6d4);
          transition: width .5s ease;
        }

        .fs-message {
          border: 1px solid #fed7aa;
          background: #fff7ed;
          color: #9a3412;
          border-radius: 12px;
          padding: 13px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 11px;
          line-height: 1.55;
          margin-bottom: 17px;
        }

        .fs-message svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .fs-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .fs-section-title h3 {
          margin: 0;
          color: #334155;
          font-size: 11px;
          letter-spacing: .03em;
        }

        .fs-reason {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 10px 11px;
          background: #f8fafc;
          border: 1px solid #e5eaf0;
          border-radius: 9px;
          color: #475569;
          font-size: 10px;
          line-height: 1.5;
          margin-bottom: 7px;
        }

        .fs-reason svg {
          color: #ef4444;
          flex: 0 0 auto;
        }

        .fs-safe {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px;
          border-radius: 9px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          font-size: 10px;
        }

        .fs-signals {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #edf1f6;
        }

        .fs-signal-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .fs-signal {
          padding: 7px 9px;
          border-radius: 7px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #1d4ed8;
          font-size: 9px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .fs-footer-strip {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .fs-footer-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 11px 13px;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .fs-footer-item svg {
          color: #2563eb;
        }

        .fs-footer-item span {
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .05em;
        }

        .fs-spin {
          animation: fs-spin 1s linear infinite;
        }

        @keyframes fs-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .fs-voice-grid { grid-template-columns: 1fr; }
          .fs-empty { min-height: 300px; }
        }

        @media (max-width: 640px) {
          .fs-voice-page { padding: 16px; }
          .fs-voice-header { align-items: flex-start; flex-direction: column; }
          .fs-risk { align-items: flex-start; }
          .fs-footer-strip { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="fs-voice-container">
        <header className="fs-voice-header">
          <div>
            <div className="fs-eyebrow">
              <ShieldCheck size={15} />
              FRAUDSHIELD AI · SOCIAL ENGINEERING DEFENSE
              <span className="fs-live">
                <span className="fs-live-dot" />
                AI ENGINE READY
              </span>
            </div>
            <h1>Voice Phishing Protection</h1>
            <p>
              Analyze suspicious conversations with explainable AI signals
              designed to detect OTP requests, impersonation, urgency and
              other social-engineering patterns.
            </p>
          </div>

          <button className="fs-reset" onClick={clearAnalysis}>
            <RefreshCw size={15} />
            Reset Analysis
          </button>
        </header>

        <div className="fs-voice-grid">
          <section className="fs-card">
            <div className="fs-card-head">
              <div className="fs-card-title">
                <div className="fs-card-title-icon">
                  <FileAudio size={17} />
                </div>
                <div>
                  <h2>Conversation Analysis</h2>
                  <p>Submit a suspicious call transcript for AI analysis.</p>
                </div>
              </div>
              <Activity size={17} color="#94a3b8" />
            </div>

            <div className="fs-card-body">
              <div className="fs-meta">
                <span>SECURE ANALYSIS</span>
                <span>JWT PROTECTED</span>
                <span>EXPLAINABLE AI</span>
              </div>

              <label className="fs-upload">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
                <div className="fs-upload-icon">
                  <Upload size={20} />
                </div>
                <strong>Upload call recording</strong>
                <span>MP3, WAV, M4A or supported audio format</span>
              </label>

              {file && (
                <div className="fs-file">
                  <FileAudio size={17} />
                  <div>
                    <strong>{file.name}</strong>
                    <small>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                </div>
              )}

              <div className="fs-divider">OR PASTE TRANSCRIPT</div>

              <div className="fs-label-row">
                <label>CALL TRANSCRIPT</label>
                <span>{transcript.length} characters</span>
              </div>

              <textarea
                className="fs-textarea"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  "Example:\n\nHello, I am calling from your bank. Your account will be blocked today. Please share the OTP sent to your phone so I can verify your account."
                }
                rows={10}
              />

              <button
                className="fs-analyze"
                onClick={analyzeTranscript}
                disabled={loading || !transcript.trim()}
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} className="fs-spin" />
                    Analyzing Conversation...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={17} />
                    Analyze for Phishing
                  </>
                )}
              </button>

              {error && (
                <div className="fs-error">
                  <AlertTriangle size={17} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>

          <section className="fs-card">
            <div className="fs-card-head">
              <div className="fs-card-title">
                <div className="fs-card-title-icon">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h2>AI Assessment</h2>
                  <p>Explainable phishing risk analysis.</p>
                </div>
              </div>
              <LockKeyhole size={17} color="#94a3b8" />
            </div>

            {!result ? (
              <div className="fs-empty">
                <div className="fs-empty-icon">
                  <Mic size={35} />
                </div>
                <h3>Awaiting conversation</h3>
                <p>
                  Enter a transcript on the left and run the AI analysis
                  to see risk, confidence and detected indicators.
                </p>
              </div>
            ) : (
              <div className="fs-result">
                <div className="fs-complete">
                  <span />
                  ANALYSIS COMPLETE
                </div>

                <div
                  className="fs-risk"
                  style={{
                    color: riskMeta.color,
                    background: riskMeta.bg,
                    borderColor: riskMeta.border,
                  }}
                >
                  <div>
                    <div className="fs-risk-label">PHISHING RISK SCORE</div>
                    <div className="fs-score">
                      <strong>{score}</strong>
                      <small>/ 100</small>
                    </div>
                  </div>

                  <div className="fs-risk-level">
                    <RiskIcon size={28} />
                    <strong>{riskMeta.label}</strong>
                  </div>
                </div>

                <div className="fs-decision">
                  <span>RECOMMENDED ACTION</span>
                  <strong>{result.decision || "REVIEW"}</strong>
                </div>

                <div className="fs-note">
                  <ShieldCheck size={15} />
                  <span>
                    FraudShield evaluated the conversation using explainable
                    phishing indicators and the configured fraud model.
                  </span>
                </div>

                <div className="fs-confidence">
                  <div className="fs-confidence-top">
                    <span>AI CONFIDENCE</span>
                    <strong>{confidence}%</strong>
                  </div>
                  <div className="fs-track">
                    <div style={{ width: `${confidence}%` }} />
                  </div>
                </div>

                {result.message && (
                  <div className="fs-message">
                    <AlertTriangle size={17} />
                    <span>{result.message}</span>
                  </div>
                )}

                <div>
                  <div className="fs-section-title">
                    <h3>DETECTED PHISHING INDICATORS</h3>
                    {result.reasons?.length ? (
                      <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 800 }}>
                        {result.reasons.length} DETECTED
                      </span>
                    ) : null}
                  </div>

                  {result.reasons?.length ? (
                    result.reasons.map((reason, index) => (
                      <div className="fs-reason" key={index}>
                        <XCircle size={15} />
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <div className="fs-safe">
                      <CheckCircle2 size={16} />
                      No major phishing indicators detected.
                    </div>
                  )}
                </div>

                {result.detected_signals?.length > 0 && (
                  <div className="fs-signals">
                    <div className="fs-section-title">
                      <h3>DETECTED SIGNALS</h3>
                    </div>
                    <div className="fs-signal-list">
                      {result.detected_signals.map((signal) => (
                        <span className="fs-signal" key={signal}>
                          {String(signal).replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="fs-footer-strip">
          <div className="fs-footer-item">
            <LockKeyhole size={16} />
            <span>AUTHENTICATED ANALYSIS</span>
          </div>
          <div className="fs-footer-item">
            <ShieldCheck size={16} />
            <span>EXPLAINABLE AI DECISIONS</span>
          </div>
          <div className="fs-footer-item">
            <Activity size={16} />
            <span>REAL-TIME FRAUD INTELLIGENCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoicePhishing;