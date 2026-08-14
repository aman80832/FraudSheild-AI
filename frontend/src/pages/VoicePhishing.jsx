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
} from "lucide-react";

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

    if (!selectedFile) {
      return;
    }

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

      const response = await axios.post(
        "http://localhost:8000/api/fraud/voice/analyze",
        {
          transcript: transcript.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data);

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

  const getRiskClass = (level) => {
    return String(level || "LOW").toLowerCase();
  };

  return (
    <div className="voice-page">

      <div className="voice-container">

        {/* HEADER */}

        <div className="voice-header">

          <div>

            <div className="voice-badge">
              <Mic size={16} />
              AI VOICE SECURITY
            </div>

            <h1>
              Voice Phishing Detector
            </h1>

            <p>
              Detect social-engineering and phishing
              patterns in suspicious phone conversations.
            </p>

            <div className="voice-live-status">
              <span className="voice-live-dot"></span>
              AI ENGINE READY
            </div>

          </div>

          <button
            className="voice-clear-button"
            onClick={clearAnalysis}
          >
            <RefreshCw size={17} />
            Reset
          </button>

        </div>


        {/* MAIN GRID */}

        <div className="voice-grid">

          {/* INPUT */}

          <section className="voice-panel">

            <div className="voice-panel-header">

              <div>

                <h2>
                  <FileAudio size={19} />
                  Conversation Analysis
                </h2>

                <p>
                  Paste a transcript from a suspicious call.
                </p>

              </div>

            </div>


            <div className="voice-input-meta">
              <span>SECURE ANALYSIS</span>
              <span>LOCAL SESSION</span>
              <span>AI POWERED</span>
            </div>

            {/* FILE */}

            <label className="voice-upload">

              <Upload size={24} />

              <strong>
                Upload call recording
              </strong>

              <span>
                MP3, WAV, M4A or other supported audio
              </span>

              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />

            </label>


            {file && (

              <div className="voice-file">

                <FileAudio size={18} />

                <div>
                  <strong>
                    {file.name}
                  </strong>

                  <small>
                    {(file.size / 1024 / 1024).toFixed(2)}
                    {" "}MB
                  </small>
                </div>

              </div>

            )}


            <div className="voice-divider">
              OR
            </div>


            {/* TRANSCRIPT */}

            <label className="voice-label">
              Call Transcript
            </label>

            <textarea
              className="voice-textarea"
              value={transcript}
              onChange={(e) =>
                setTranscript(e.target.value)
              }
              placeholder={
                "Example:\n\nHello, I am calling from your bank. Your account will be blocked today. Please share the OTP sent to your phone so I can verify your account."
              }
              rows={10}
            />

            <div className="voice-textarea-footer">
              <span>Transcript is analyzed securely.</span>
              <span>{transcript.length} characters</span>
            </div>

            <button
              className="voice-analyze-button"
              onClick={analyzeTranscript}
              disabled={
                loading ||
                !transcript.trim()
              }
            >

              {loading ? (
                <>
                  <RefreshCw
                    size={18}
                    className="voice-spin"
                  />
                  Analyzing Conversation...
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  Analyze for Phishing
                </>
              )}

            </button>


            {error && (

              <div className="voice-error">

                <AlertTriangle size={18} />

                <span>
                  {error}
                </span>

              </div>

            )}

          </section>


          {/* RESULT */}

          <section className="voice-panel">

            <div className="voice-panel-header">

              <div>

                <h2>
                  <ShieldCheck size={19} />
                  AI Assessment
                </h2>

                <p>
                  Explainable phishing risk analysis.
                </p>

              </div>

            </div>


            {!result ? (

              <div className="voice-empty">

                <Mic size={48} />

                <h3>
                  Awaiting conversation
                </h3>

                <p>
                  Enter a transcript and run the
                  AI analysis to see the result.
                </p>

              </div>

            ) : (

              <div className="voice-result">

                <div className="voice-result-status">
                  <span className="voice-result-dot"></span>
                  ANALYSIS COMPLETE
                </div>

                {/* SCORE */}

                <div
                  className={`voice-risk-card ${getRiskClass(
                    result.risk_level
                  )}`}
                >

                  <div>

                    <span>
                      PHISHING RISK
                    </span>

                    <strong>
                      {result.risk_score ?? 0}
                    </strong>

                    <small>
                      / 100
                    </small>

                  </div>

                  <div className="voice-risk-level">

                    {result.risk_level === "HIGH" && (
                      <ShieldAlert size={28} />
                    )}

                    {result.risk_level === "MEDIUM" && (
                      <AlertTriangle size={28} />
                    )}

                    {result.risk_level === "LOW" && (
                      <ShieldCheck size={28} />
                    )}

                    <strong>
                      {result.risk_level}
                    </strong>

                  </div>

                </div>


                {/* DECISION */}

                <div className="voice-decision">

                  <span>
                    Recommended Action
                  </span>

                  <strong>
                    {result.decision || "REVIEW"}
                  </strong>

                </div>

                <div className="voice-action-note">
                  <ShieldCheck size={16} />
                  <span>
                    FraudShield has evaluated the conversation using
                    explainable phishing indicators.
                  </span>
                </div>


                {/* CONFIDENCE */}

                <div className="voice-confidence">

                  <div>

                    <span>
                      AI Confidence
                    </span>

                    <strong>
                      {result.confidence ?? 0}%
                    </strong>

                  </div>

                  <div className="confidence-track">

                    <div
                      style={{
                        width: `${Math.min(
                          result.confidence ?? 0,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {/* MESSAGE */}

                <div className="voice-message">

                  <AlertTriangle size={19} />

                  <p>
                    {result.message}
                  </p>

                </div>


                {/* REASONS */}

                <div className="voice-reasons">

                  <h3>
                    Detected Phishing Indicators
                  </h3>

                  {result.reasons?.length ? (

                    <div>

                      {result.reasons.map(
                        (reason, index) => (

                          <div
                            className="voice-reason"
                            key={index}
                          >

                            <ShieldAlert size={17} />

                            <span>
                              {reason}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="voice-safe">

                      <ShieldCheck size={18} />

                      No major phishing indicators
                      detected.

                    </div>

                  )}

                </div>


                {/* SIGNALS */}

                {result.detected_signals?.length > 0 && (

                  <div className="voice-signals">

                    <h3>
                      Detected Signals
                    </h3>

                    <div>

                      {result.detected_signals.map(
                        (signal) => (

                          <span key={signal}>
                            {signal.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

          </section>

        </div>

      </div>

    </div>
  );
}

export default VoicePhishing;