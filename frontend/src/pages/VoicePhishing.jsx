import { useEffect, useRef, useState } from "react";
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

  const [liveListening, setLiveListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveInterim, setLiveInterim] = useState("");
  const [liveResult, setLiveResult] = useState(null);
  const [liveError, setLiveError] = useState("");
  const [liveAnalyzing, setLiveAnalyzing] = useState(false);
  const [liveSupported, setLiveSupported] = useState(true);
  const [liveAutoAnalyze, setLiveAutoAnalyze] = useState(true);

  const recognitionRef = useRef(null);
  const liveTextRef = useRef("");
  const lastAnalyzedTextRef = useRef("");
  const analyzeTimerRef = useRef(null);

  const getSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  const analyzeLiveTranscript = async (textOverride = null) => {
    const text = String(textOverride ?? liveTextRef.current).trim();
    if (!text || text.length < 8 || text === lastAnalyzedTextRef.current) return;

    if (!token) {
      setLiveError("Please login again.");
      return;
    }

    try {
      setLiveAnalyzing(true);
      setLiveError("");

      const response = await axios.post(
        `${API_URL}/api/voice/analyze`,
        { transcript: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      lastAnalyzedTextRef.current = text;
      setLiveResult(response.data.analysis || response.data);
    } catch (err) {
      console.error("Live voice analysis error:", err);
      setLiveError(
        err.response?.data?.detail ||
          "Unable to analyze live conversation."
      );
    } finally {
      setLiveAnalyzing(false);
    }
  };

  const scheduleLiveAnalysis = (text) => {
    if (!liveAutoAnalyze) return;
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);

    analyzeTimerRef.current = setTimeout(() => {
      analyzeLiveTranscript(text);
    }, 1200);
  };

  const startLiveDetection = () => {
    const SpeechRecognitionAPI = getSpeechRecognition();

    if (!SpeechRecognitionAPI) {
      setLiveSupported(false);
      setLiveError(
        "Live microphone transcription is not supported here. Use Chrome or Edge on localhost/HTTPS."
      );
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.stop();

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setLiveListening(true);
        setLiveError("");
      };

      recognition.onresult = (event) => {
        let finalText = liveTextRef.current;
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) finalText += `${part} `;
          else interimText += part;
        }

        finalText = finalText.replace(/\s+/g, " ").trim();
        liveTextRef.current = finalText;
        setLiveTranscript(finalText);
        setLiveInterim(interimText);

        if (finalText.length >= 8) scheduleLiveAnalysis(finalText);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          setLiveError("Microphone permission was denied. Allow microphone access and try again.");
        } else if (event.error === "audio-capture") {
          setLiveError("No working microphone was detected.");
        } else if (event.error !== "no-speech") {
          setLiveError(`Live speech recognition error: ${event.error}`);
        }

        if (event.error === "not-allowed" || event.error === "audio-capture") {
          setLiveListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onend = () => {
        setLiveListening(false);
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {
            // Browser may reject an immediate restart.
          }
        }
      };

      recognitionRef.current = recognition;
      liveTextRef.current = "";
      lastAnalyzedTextRef.current = "";
      setLiveTranscript("");
      setLiveInterim("");
      setLiveResult(null);
      setLiveError("");
      recognition.start();
    } catch (err) {
      console.error("Unable to start live detection:", err);
      setLiveListening(false);
      setLiveError("Unable to start the microphone. Check browser permissions.");
    }
  };

  const stopLiveDetection = () => {
    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = null;
    }

    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    if (recognition) {
      try { recognition.stop(); } catch {}
    }

    setLiveListening(false);
    setLiveInterim("");

    if (liveTextRef.current.trim()) analyzeLiveTranscript(liveTextRef.current);
  };

  const clearLiveDetection = () => {
    stopLiveDetection();
    liveTextRef.current = "";
    lastAnalyzedTextRef.current = "";
    setLiveTranscript("");
    setLiveInterim("");
    setLiveResult(null);
    setLiveError("");
  };

  useEffect(() => {
    setLiveSupported(Boolean(getSpeechRecognition()));

    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

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
    <div className="fs-voice-page" data-page="voice-phishing">
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


        .fs-live-card {
          grid-column: 1 / -1;
          border-color: #bfdbfe;
          background: linear-gradient(180deg, rgba(239,246,255,.98), rgba(255,255,255,.98));
        }

        .fs-live-title-icon {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .fs-live-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dbe3ef;
          background: #f8fafc;
          color: #64748b;
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .fs-live-status > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .fs-live-status.active {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .fs-live-status.active > span {
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,.12);
          animation: fs-live-pulse 1.2s infinite;
        }

        @keyframes fs-live-pulse {
          50% { opacity: .35; transform: scale(.75); }
        }

        .fs-live-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
        }

        .fs-live-start,
        .fs-live-stop {
          border: 0;
          border-radius: 11px;
          padding: 12px 16px;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .18s;
        }

        .fs-live-start {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 9px 20px rgba(220,38,38,.2);
        }

        .fs-live-stop {
          background: linear-gradient(135deg, #475569, #334155);
        }

        .fs-live-start:hover:not(:disabled),
        .fs-live-stop:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .fs-live-start:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .fs-live-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 14px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          cursor: pointer;
        }

        .fs-live-toggle input {
          accent-color: #2563eb;
        }

        .fs-live-toggle span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fs-live-toggle strong {
          color: #334155;
          font-size: 10px;
        }

        .fs-live-toggle small {
          color: #94a3b8;
          font-size: 9px;
        }

        .fs-live-transcript {
          border: 1px solid #dbe3ef;
          background: #fbfdff;
          border-radius: 12px;
          padding: 13px;
        }

        .fs-live-text {
          min-height: 125px;
          max-height: 240px;
          overflow-y: auto;
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .fs-live-placeholder {
          color: #a8b3c2;
        }

        .fs-interim {
          color: #94a3b8;
          font-style: italic;
        }

        .fs-live-analyzing {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 11px;
          padding: 10px 12px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
        }

        .fs-live-result {
          margin-top: 13px;
          border: 1px solid;
          border-radius: 13px;
          background: white;
          padding: 15px;
        }

        .fs-live-result-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .fs-live-result-head > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fs-live-result-head span {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .fs-live-result-head strong {
          color: #0f172a;
          font-size: 16px;
        }

        .fs-live-score {
          font-size: 30px;
          line-height: 1;
          font-weight: 900;
        }

        .fs-live-score small {
          color: #94a3b8;
          font-size: 10px;
          margin-left: 3px;
        }

        .fs-live-decision {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #edf1f6;
        }

        .fs-live-decision span {
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
        }

        .fs-live-decision strong {
          color: #0f172a;
          font-size: 10px;
          letter-spacing: .08em;
        }

        .fs-live-reasons {
          margin-top: 11px;
          display: grid;
          gap: 6px;
        }

        .fs-live-reasons > div {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          padding: 8px 9px;
          border-radius: 8px;
          background: #fff7ed;
          color: #9a3412;
          font-size: 9px;
          line-height: 1.45;
        }

        .fs-live-message {
          margin: 10px 0 0;
          color: #475569;
          font-size: 10px;
          line-height: 1.5;
        }

        .fs-live-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 9px 11px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 9px;
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .fs-live-disclaimer svg {
          color: #2563eb;
          flex: 0 0 auto;
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

        /* =====================================================
           FRAUDSHIELD DARK MODE
           Theme is controlled by:
           html[data-theme="dark"]
           html.dark
           body.dark
        ===================================================== */

        html[data-theme="dark"] .fs-voice-page,
        html.dark .fs-voice-page,
        body.dark .fs-voice-page {
          background:
            radial-gradient(circle at 85% 5%, rgba(37,99,235,.16), transparent 28%),
            #07111f;
          color: #f8fafc;
        }

        html[data-theme="dark"] .fs-voice-page .fs-voice-header h1,
        html.dark .fs-voice-page .fs-voice-header h1,
        body.dark .fs-voice-page .fs-voice-header h1 {
          color: #f8fafc;
        }

        html[data-theme="dark"] .fs-voice-page .fs-voice-header p,
        html.dark .fs-voice-page .fs-voice-header p,
        body.dark .fs-voice-page .fs-voice-header p {
          color: #9fb0c4;
        }

        html[data-theme="dark"] .fs-voice-page .fs-card,
        html.dark .fs-voice-page .fs-card,
        body.dark .fs-voice-page .fs-card {
          background: #0d1a2a;
          border-color: rgba(148,163,184,.17);
          box-shadow: 0 18px 45px rgba(0,0,0,.28);
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-card,
        html.dark .fs-voice-page .fs-live-card,
        body.dark .fs-voice-page .fs-live-card {
          background:
            linear-gradient(180deg, rgba(13,26,42,.98), rgba(10,22,37,.98));
          border-color: rgba(96,165,250,.22);
        }

        html[data-theme="dark"] .fs-voice-page .fs-card-head,
        html.dark .fs-voice-page .fs-card-head,
        body.dark .fs-voice-page .fs-card-head {
          border-bottom-color: rgba(148,163,184,.12);
        }

        html[data-theme="dark"] .fs-voice-page .fs-card-title h2,
        html.dark .fs-voice-page .fs-card-title h2,
        body.dark .fs-voice-page .fs-card-title h2 {
          color: #f1f5f9;
        }

        html[data-theme="dark"] .fs-voice-page .fs-card-title p,
        html.dark .fs-voice-page .fs-card-title p,
        body.dark .fs-voice-page .fs-card-title p {
          color: #8295aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-card-title-icon,
        html.dark .fs-voice-page .fs-card-title-icon,
        body.dark .fs-voice-page .fs-card-title-icon {
          background: rgba(59,130,246,.10);
          border-color: rgba(96,165,250,.22);
          color: #60a5fa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-title-icon,
        html.dark .fs-voice-page .fs-live-title-icon,
        body.dark .fs-voice-page .fs-live-title-icon {
          background: rgba(239,68,68,.10);
          border-color: rgba(239,68,68,.25);
          color: #f87171;
        }

        html[data-theme="dark"] .fs-voice-page .fs-reset,
        html.dark .fs-voice-page .fs-reset,
        body.dark .fs-voice-page .fs-reset {
          background: #101f32;
          color: #d7e1ec;
          border-color: rgba(148,163,184,.22);
          box-shadow: none;
        }

        html[data-theme="dark"] .fs-voice-page .fs-reset:hover,
        html.dark .fs-voice-page .fs-reset:hover,
        body.dark .fs-voice-page .fs-reset:hover {
          background: #14263b;
          border-color: rgba(96,165,250,.40);
          color: #93c5fd;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-status,
        html.dark .fs-voice-page .fs-live-status,
        body.dark .fs-voice-page .fs-live-status {
          background: #0a1625;
          border-color: rgba(148,163,184,.20);
          color: #91a4b9;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-toggle,
        html.dark .fs-voice-page .fs-live-toggle,
        body.dark .fs-voice-page .fs-live-toggle {
          background: #0a1625;
          border-color: rgba(148,163,184,.17);
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-toggle strong,
        html.dark .fs-voice-page .fs-live-toggle strong,
        body.dark .fs-voice-page .fs-live-toggle strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-toggle small,
        html.dark .fs-voice-page .fs-live-toggle small,
        body.dark .fs-voice-page .fs-live-toggle small {
          color: #71859a;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-transcript,
        html.dark .fs-voice-page .fs-live-transcript,
        body.dark .fs-voice-page .fs-live-transcript {
          background: #081522;
          border-color: rgba(148,163,184,.20);
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-text,
        html.dark .fs-voice-page .fs-live-text,
        body.dark .fs-voice-page .fs-live-text {
          color: #d8e2ed;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-placeholder,
        html.dark .fs-voice-page .fs-live-placeholder,
        body.dark .fs-voice-page .fs-live-placeholder {
          color: #64788e;
        }

        html[data-theme="dark"] .fs-voice-page .fs-interim,
        html.dark .fs-voice-page .fs-interim,
        body.dark .fs-voice-page .fs-interim {
          color: #8195aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-analyzing,
        html.dark .fs-voice-page .fs-live-analyzing,
        body.dark .fs-voice-page .fs-live-analyzing {
          background: rgba(37,99,235,.10);
          border-color: rgba(96,165,250,.22);
          color: #93c5fd;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-result,
        html.dark .fs-voice-page .fs-live-result,
        body.dark .fs-voice-page .fs-live-result {
          background: #0a1625;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-result-head strong,
        html.dark .fs-voice-page .fs-live-result-head strong,
        body.dark .fs-voice-page .fs-live-result-head strong {
          color: #f8fafc;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-decision,
        html.dark .fs-voice-page .fs-live-decision,
        body.dark .fs-voice-page .fs-live-decision {
          border-top-color: rgba(148,163,184,.14);
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-decision span,
        html.dark .fs-voice-page .fs-live-decision span,
        body.dark .fs-voice-page .fs-live-decision span {
          color: #8195aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-decision strong,
        html.dark .fs-voice-page .fs-live-decision strong,
        body.dark .fs-voice-page .fs-live-decision strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-reasons > div,
        html.dark .fs-voice-page .fs-live-reasons > div,
        body.dark .fs-voice-page .fs-live-reasons > div {
          background: rgba(154,52,18,.12);
          color: #fdba74;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-message,
        html.dark .fs-voice-page .fs-live-message,
        body.dark .fs-voice-page .fs-live-message {
          color: #a7b5c7;
        }

        html[data-theme="dark"] .fs-voice-page .fs-live-disclaimer,
        html.dark .fs-voice-page .fs-live-disclaimer,
        body.dark .fs-voice-page .fs-live-disclaimer {
          background: #0a1625;
          border-color: rgba(148,163,184,.15);
          color: #8195aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-meta span,
        html.dark .fs-voice-page .fs-meta span,
        body.dark .fs-voice-page .fs-meta span {
          background: #0a1625;
          border-color: rgba(148,163,184,.17);
          color: #91a4b9;
        }

        html[data-theme="dark"] .fs-voice-page .fs-upload,
        html.dark .fs-voice-page .fs-upload,
        body.dark .fs-voice-page .fs-upload {
          background: #081522;
          border-color: rgba(96,165,250,.30);
        }

        html[data-theme="dark"] .fs-voice-page .fs-upload:hover,
        html.dark .fs-voice-page .fs-upload:hover,
        body.dark .fs-voice-page .fs-upload:hover {
          background: #0a1a2c;
          border-color: #60a5fa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-upload-icon,
        html.dark .fs-voice-page .fs-upload-icon,
        body.dark .fs-voice-page .fs-upload-icon {
          background: #0d1a2a;
          border-color: rgba(96,165,250,.22);
          color: #60a5fa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-upload strong,
        html.dark .fs-voice-page .fs-upload strong,
        body.dark .fs-voice-page .fs-upload strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-upload span,
        html.dark .fs-voice-page .fs-upload span,
        body.dark .fs-voice-page .fs-upload span {
          color: #71859a;
        }

        html[data-theme="dark"] .fs-voice-page .fs-file,
        html.dark .fs-voice-page .fs-file,
        body.dark .fs-voice-page .fs-file {
          background: #0a1625;
          border-color: rgba(148,163,184,.17);
        }

        html[data-theme="dark"] .fs-voice-page .fs-file strong,
        html.dark .fs-voice-page .fs-file strong,
        body.dark .fs-voice-page .fs-file strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-file small,
        html.dark .fs-voice-page .fs-file small,
        body.dark .fs-voice-page .fs-file small {
          color: #71859a;
        }

        html[data-theme="dark"] .fs-voice-page .fs-divider::before,
        html[data-theme="dark"] .fs-voice-page .fs-divider::after,
        html.dark .fs-voice-page .fs-divider::before,
        html.dark .fs-voice-page .fs-divider::after,
        body.dark .fs-voice-page .fs-divider::before,
        body.dark .fs-voice-page .fs-divider::after {
          background: rgba(148,163,184,.14);
        }

        html[data-theme="dark"] .fs-voice-page .fs-label-row label,
        html.dark .fs-voice-page .fs-label-row label,
        body.dark .fs-voice-page .fs-label-row label {
          color: #dbe5ef;
        }

        html[data-theme="dark"] .fs-voice-page .fs-label-row span,
        html.dark .fs-voice-page .fs-label-row span,
        body.dark .fs-voice-page .fs-label-row span {
          color: #71859a;
        }

        html[data-theme="dark"] .fs-voice-page .fs-textarea,
        html.dark .fs-voice-page .fs-textarea,
        body.dark .fs-voice-page .fs-textarea {
          background: #081522;
          color: #e2e8f0;
          border-color: rgba(148,163,184,.22);
        }

        html[data-theme="dark"] .fs-voice-page .fs-textarea:focus,
        html.dark .fs-voice-page .fs-textarea:focus,
        body.dark .fs-voice-page .fs-textarea:focus {
          background: #081522;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96,165,250,.12);
        }

        html[data-theme="dark"] .fs-voice-page .fs-textarea::placeholder,
        html.dark .fs-voice-page .fs-textarea::placeholder,
        body.dark .fs-voice-page .fs-textarea::placeholder {
          color: #61758a;
        }

        html[data-theme="dark"] .fs-voice-page .fs-empty h3,
        html.dark .fs-voice-page .fs-empty h3,
        body.dark .fs-voice-page .fs-empty h3 {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-empty p,
        html.dark .fs-voice-page .fs-empty p,
        body.dark .fs-voice-page .fs-empty p {
          color: #7f93a8;
        }

        html[data-theme="dark"] .fs-voice-page .fs-empty-icon,
        html.dark .fs-voice-page .fs-empty-icon,
        body.dark .fs-voice-page .fs-empty-icon {
          background: rgba(59,130,246,.10);
          border-color: rgba(96,165,250,.22);
          color: #60a5fa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-decision,
        html.dark .fs-voice-page .fs-decision,
        body.dark .fs-voice-page .fs-decision {
          background: #0a1625;
          border-color: rgba(148,163,184,.16);
        }

        html[data-theme="dark"] .fs-voice-page .fs-decision span,
        html.dark .fs-voice-page .fs-decision span,
        body.dark .fs-voice-page .fs-decision span {
          color: #8195aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-decision strong,
        html.dark .fs-voice-page .fs-decision strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-note,
        html.dark .fs-voice-page .fs-note,
        body.dark .fs-voice-page .fs-note {
          background: #0a1625;
          border-color: rgba(148,163,184,.16);
          color: #9fb0c4;
        }

        html[data-theme="dark"] .fs-voice-page .fs-confidence,
        html.dark .fs-voice-page .fs-confidence,
        body.dark .fs-voice-page .fs-confidence {
          border-color: rgba(148,163,184,.16);
        }

        html[data-theme="dark"] .fs-voice-page .fs-confidence-top,
        html.dark .fs-voice-page .fs-confidence-top,
        body.dark .fs-voice-page .fs-confidence-top {
          color: #8195aa;
        }

        html[data-theme="dark"] .fs-voice-page .fs-confidence-top strong,
        html.dark .fs-voice-page .fs-confidence-top strong,
        body.dark .fs-voice-page .fs-confidence-top strong {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .fs-voice-page .fs-track,
        html.dark .fs-voice-page .fs-track,
        body.dark .fs-voice-page .fs-track {
          background: #223247;
        }

        html[data-theme="dark"] .fs-voice-page .fs-section-title h3,
        html.dark .fs-voice-page .fs-section-title h3,
        body.dark .fs-voice-page .fs-section-title h3 {
          color: #dbe5ef;
        }

        html[data-theme="dark"] .fs-voice-page .fs-reason,
        html.dark .fs-voice-page .fs-reason,
        body.dark .fs-voice-page .fs-reason {
          background: #0a1625;
          border-color: rgba(148,163,184,.15);
          color: #a7b5c7;
        }

        html[data-theme="dark"] .fs-voice-page .fs-safe,
        html.dark .fs-voice-page .fs-safe,
        body.dark .fs-voice-page .fs-safe {
          background: rgba(16,185,129,.10);
          border-color: rgba(52,211,153,.24);
          color: #6ee7b7;
        }

        html[data-theme="dark"] .fs-voice-page .fs-signals,
        html.dark .fs-voice-page .fs-signals,
        body.dark .fs-voice-page .fs-signals {
          border-top-color: rgba(148,163,184,.12);
        }

        html[data-theme="dark"] .fs-voice-page .fs-signal,
        html.dark .fs-voice-page .fs-signal,
        body.dark .fs-voice-page .fs-signal {
          background: rgba(59,130,246,.10);
          border-color: rgba(96,165,250,.20);
          color: #93c5fd;
        }

        html[data-theme="dark"] .fs-voice-page .fs-footer-item,
        html.dark .fs-voice-page .fs-footer-item,
        body.dark .fs-voice-page .fs-footer-item {
          background: #0d1a2a;
          border-color: rgba(148,163,184,.16);
        }

        html[data-theme="dark"] .fs-voice-page .fs-footer-item span,
        html.dark .fs-voice-page .fs-footer-item span,
        body.dark .fs-voice-page .fs-footer-item span {
          color: #91a4b9;
        }

        html[data-theme="dark"] .fs-voice-page .fs-error,
        html.dark .fs-voice-page .fs-error,
        body.dark .fs-voice-page .fs-error {
          background: rgba(239,68,68,.10);
          border-color: rgba(239,68,68,.25);
          color: #fca5a5;
        }

        /* Keep browser autofill from turning voice-page inputs white. */
        html[data-theme="dark"] .fs-voice-page input:-webkit-autofill,
        html[data-theme="dark"] .fs-voice-page input:-webkit-autofill:hover,
        html[data-theme="dark"] .fs-voice-page input:-webkit-autofill:focus,
        html.dark .fs-voice-page input:-webkit-autofill,
        html.dark .fs-voice-page input:-webkit-autofill:hover,
        html.dark .fs-voice-page input:-webkit-autofill:focus,
        body.dark .fs-voice-page input:-webkit-autofill,
        body.dark .fs-voice-page input:-webkit-autofill:hover,
        body.dark .fs-voice-page input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f8fafc !important;
          -webkit-box-shadow: 0 0 0 1000px #081522 inset !important;
          box-shadow: 0 0 0 1000px #081522 inset !important;
          background-color: #081522 !important;
          caret-color: #ffffff !important;
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

          <section className="fs-card fs-live-card">
            <div className="fs-card-head">
              <div className="fs-card-title">
                <div className="fs-card-title-icon fs-live-title-icon">
                  <Mic size={17} />
                </div>
                <div>
                  <h2>Live Call Detection</h2>
                  <p>Microphone speech → FraudShield AI analysis in real time.</p>
                </div>
              </div>

              <span className={`fs-live-status ${liveListening ? "active" : ""}`}>
                <span />
                {liveListening ? "LISTENING" : "READY"}
              </span>
            </div>

            <div className="fs-card-body">
              {!liveSupported && (
                <div className="fs-error">
                  <AlertTriangle size={17} />
                  <span>Use Chrome or Edge on localhost/HTTPS for live microphone transcription.</span>
                </div>
              )}

              <div className="fs-live-controls">
                {!liveListening ? (
                  <button
                    className="fs-live-start"
                    onClick={startLiveDetection}
                    disabled={!liveSupported}
                  >
                    <Mic size={18} />
                    Start Live Detection
                  </button>
                ) : (
                  <button className="fs-live-stop" onClick={stopLiveDetection}>
                    <XCircle size={18} />
                    Stop Detection
                  </button>
                )}

                <button
                  className="fs-reset"
                  onClick={clearLiveDetection}
                  disabled={liveListening}
                >
                  <RefreshCw size={14} />
                  Clear
                </button>
              </div>

              <label className="fs-live-toggle">
                <input
                  type="checkbox"
                  checked={liveAutoAnalyze}
                  onChange={(e) => setLiveAutoAnalyze(e.target.checked)}
                />
                <span>
                  <strong>Automatic AI analysis</strong>
                  <small>Analyze completed speech automatically.</small>
                </span>
              </label>

              <div className="fs-live-transcript">
                <div className="fs-label-row">
                  <label>LIVE TRANSCRIPT</label>
                  <span>{liveListening ? "Microphone active" : "Waiting for speech"}</span>
                </div>

                <div className="fs-live-text">
                  {liveTranscript || liveInterim ? (
                    <>
                      <span>{liveTranscript}</span>
                      {liveInterim && <span className="fs-interim">{liveTranscript ? " " : ""}{liveInterim}</span>}
                    </>
                  ) : (
                    <span className="fs-live-placeholder">
                      Press “Start Live Detection” and speak into your microphone.
                    </span>
                  )}
                </div>
              </div>

              {liveAnalyzing && (
                <div className="fs-live-analyzing">
                  <RefreshCw size={14} className="fs-spin" />
                  FraudShield AI is analyzing the latest speech...
                </div>
              )}

              {liveError && (
                <div className="fs-error">
                  <AlertTriangle size={17} />
                  <span>{liveError}</span>
                </div>
              )}

              {liveResult && (
                <div
                  className="fs-live-result"
                  style={{
                    borderColor:
                      liveResult.risk_level === "HIGH"
                        ? "rgba(239,68,68,.35)"
                        : liveResult.risk_level === "MEDIUM"
                        ? "rgba(245,158,11,.35)"
                        : "rgba(16,185,129,.35)",
                  }}
                >
                  <div className="fs-live-result-head">
                    <div>
                      <span>LIVE AI ASSESSMENT</span>
                      <strong>{String(liveResult.risk_level || "LOW").toUpperCase()} RISK</strong>
                    </div>
                    <div
                      className="fs-live-score"
                      style={{
                        color:
                          liveResult.risk_level === "HIGH"
                            ? "#ef4444"
                            : liveResult.risk_level === "MEDIUM"
                            ? "#f59e0b"
                            : "#10b981",
                      }}
                    >
                      {Number(liveResult.risk_score || 0)}
                      <small>/100</small>
                    </div>
                  </div>

                  <div className="fs-live-decision">
                    <span>RECOMMENDED ACTION</span>
                    <strong>{liveResult.decision || "REVIEW"}</strong>
                  </div>

                  {liveResult.reasons?.length > 0 && (
                    <div className="fs-live-reasons">
                      {liveResult.reasons.slice(0, 5).map((reason, index) => (
                        <div key={index}>
                          <AlertTriangle size={13} />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {liveResult.message && (
                    <p className="fs-live-message">{liveResult.message}</p>
                  )}
                </div>
              )}

              <div className="fs-live-disclaimer">
                <ShieldCheck size={14} />
                <span>
                  Controlled browser-microphone detection. It analyzes captured speech;
                  it does not automatically intercept cellular or WhatsApp calls.
                </span>
              </div>
            </div>
          </section>

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