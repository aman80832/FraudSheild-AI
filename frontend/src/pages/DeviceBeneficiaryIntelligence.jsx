import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Smartphone,
  CreditCard,
  MapPin,
  Activity,
  AlertTriangle,
  Bell,
  Search,
  Network,
  X,
  ChevronRight,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function DeviceBeneficiaryIntelligence() {
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState(null);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const loadNetwork = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login before viewing device intelligence.");
        return;
      }

      const response = await axios.get(`${API_URL}/api/fraud/network`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNetwork(response.data || {});
    } catch (err) {
      console.error("Device intelligence error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response.data?.detail ||
            "Unable to load device and beneficiary intelligence."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const nodes = Array.isArray(network?.nodes) ? network.nodes : [];
  const edges = Array.isArray(network?.edges) ? network.edges : [];

  const devices = useMemo(
    () => nodes.filter((node) => node.type === "device"),
    [nodes]
  );

  const beneficiaries = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.type === "beneficiary" ||
          node.type === "beneficiary_id"
      ),
    [nodes]
  );

  const locations = useMemo(
    () => nodes.filter((node) => node.type === "location"),
    [nodes]
  );

  const transactions = useMemo(
    () => nodes.filter((node) => node.type === "transaction"),
    [nodes]
  );

  const filteredEntities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filter = (items) =>
      items.filter((item) => {
        const risk = String(item.risk || "LOW").toUpperCase();
        const label = String(item.label || item.id || "").toLowerCase();

        return (
          (!query || label.includes(query)) &&
          (riskFilter === "ALL" || risk === riskFilter)
        );
      });

    return {
      devices: filter(devices),
      beneficiaries: filter(beneficiaries),
    };
  }, [devices, beneficiaries, searchTerm, riskFilter]);

  const getConnections = (nodeId) =>
    edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    ).length;

  const highRiskDevices = devices.filter(
    (device) => String(device.risk || "LOW").toUpperCase() === "HIGH"
  ).length;

  const highRiskBeneficiaries = beneficiaries.filter(
    (beneficiary) =>
      String(beneficiary.risk || "LOW").toUpperCase() === "HIGH"
  ).length;

  const mediumRiskDevices = devices.filter(
    (device) => String(device.risk || "LOW").toUpperCase() === "MEDIUM"
  ).length;

  const mediumRiskBeneficiaries = beneficiaries.filter(
    (beneficiary) =>
      String(beneficiary.risk || "LOW").toUpperCase() === "MEDIUM"
  ).length;

  const riskClass = (risk) =>
    String(risk || "LOW").toLowerCase();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const openEntity = (entity, entityType) => {
    setSelectedEntity({
      ...entity,
      entityType,
      connections: getConnections(entity.id),
    });
  };

  return (
    <div className="device-intelligence-page">
      <style>{`
        * { box-sizing: border-box; }

        .device-intelligence-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 75% 0%, rgba(14,165,233,.10), transparent 28%),
            radial-gradient(circle at 10% 20%, rgba(37,99,235,.07), transparent 25%),
            #030b17;
          color: #e5eefb;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .di-navbar {
          height: 72px;
          padding: 0 26px;
          display: flex;
          align-items: center;
          gap: 26px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(3,11,23,.94);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(96,165,250,.12);
        }

        .di-brand {
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
        }

        .di-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          color: #fff;
          background: linear-gradient(135deg,#0ea5e9,#2563eb);
          box-shadow: 0 0 24px rgba(14,165,233,.22);
        }

        .di-brand h2 {
          margin: 0;
          font-size: 15px;
          letter-spacing: -.02em;
        }

        .di-brand span {
          display: block;
          margin-top: 2px;
          color: #64748b;
          font-size: 8px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .di-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .di-nav::-webkit-scrollbar { display: none; }

        .di-nav button, .di-logout {
          border: 1px solid transparent;
          background: transparent;
          color: #8191a8;
          padding: 9px 11px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .di-nav button:hover {
          color: #dbeafe;
          background: rgba(30,64,175,.18);
        }

        .di-nav .active {
          color: #60a5fa;
          border-color: rgba(59,130,246,.28);
          background: rgba(30,64,175,.22);
        }

        .di-logout {
          color: #fca5a5;
          border-color: rgba(239,68,68,.28);
        }

        .di-main {
          width: min(1380px, calc(100% - 42px));
          margin: 0 auto;
          padding: 30px 0 60px;
        }

        .di-back {
          border: 0;
          background: transparent;
          color: #6f86a2;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0;
          font-size: 11px;
          cursor: pointer;
          margin-bottom: 26px;
        }

        .di-back:hover { color: #60a5fa; }

        .di-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 25px;
        }

        .di-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #38bdf8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .di-kicker i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 12px #22c55e;
        }

        .di-heading h1 {
          margin: 10px 0 7px;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -.045em;
          color: #f8fbff;
        }

        .di-heading p {
          max-width: 700px;
          margin: 0;
          color: #7086a3;
          font-size: 13px;
          line-height: 1.6;
        }

        .di-refresh {
          border: 1px solid rgba(59,130,246,.28);
          background: linear-gradient(135deg,#0ea5e9,#2563eb);
          color: #fff;
          padding: 12px 17px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(37,99,235,.18);
        }

        .di-refresh:disabled { opacity: .6; cursor: wait; }

        .di-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 15px;
          margin-bottom: 18px;
          color: #fca5a5;
          background: rgba(127,29,29,.18);
          border: 1px solid rgba(239,68,68,.3);
          border-radius: 10px;
          font-size: 12px;
        }

        .di-livebar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          margin-bottom: 16px;
          border: 1px solid rgba(34,197,94,.15);
          background: rgba(15,118,110,.07);
          border-radius: 10px;
        }

        .di-livebar span {
          color: #64748b;
          font-size: 10px;
        }

        .di-live {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #4ade80 !important;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .di-live b {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }

        .di-stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .di-stat {
          min-height: 105px;
          padding: 17px;
          border-radius: 12px;
          background: linear-gradient(145deg,rgba(12,27,47,.95),rgba(5,16,30,.95));
          border: 1px solid rgba(71,116,166,.18);
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .di-stat-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #38bdf8;
          background: rgba(14,165,233,.09);
          border: 1px solid rgba(14,165,233,.14);
        }

        .di-stat-icon.red {
          color: #f87171;
          background: rgba(239,68,68,.09);
          border-color: rgba(239,68,68,.14);
        }

        .di-stat-icon.amber {
          color: #fbbf24;
          background: rgba(245,158,11,.09);
          border-color: rgba(245,158,11,.14);
        }

        .di-stat span {
          display: block;
          color: #647b96;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .di-stat strong {
          display: block;
          margin-top: 4px;
          color: #f1f5f9;
          font-size: 23px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
        }

        .di-stat small {
          color: #43566e;
          font-size: 8px;
        }

        .di-panel {
          padding: 20px;
          margin-bottom: 18px;
          border-radius: 13px;
          background: rgba(8,21,37,.88);
          border: 1px solid rgba(71,116,166,.18);
          box-shadow: 0 18px 50px rgba(0,0,0,.12);
        }

        .di-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 17px;
        }

        .di-panel-head h2 {
          margin: 4px 0 4px;
          color: #eaf2fb;
          font-size: 17px;
          letter-spacing: -.02em;
        }

        .di-panel-head p {
          margin: 0;
          color: #607691;
          font-size: 10px;
        }

        .di-section-label {
          color: #38bdf8;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .di-panel-icon { color: #38bdf8; }

        .di-filters {
          display: grid;
          grid-template-columns: 1fr 190px auto;
          gap: 10px;
          align-items: center;
        }

        .di-search {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(71,116,166,.24);
          background: #071526;
          color: #526b88;
        }

        .di-search input {
          width: 100%;
          border: 0;
          outline: 0;
          color: #dbeafe;
          background: transparent;
          font-size: 11px;
        }

        .di-search input::placeholder { color: #40556d; }

        .di-select {
          height: 42px;
          padding: 0 11px;
          border-radius: 8px;
          border: 1px solid rgba(71,116,166,.24);
          outline: none;
          color: #b8c8da;
          background: #071526;
          font-size: 11px;
        }

        .di-result-count {
          color: #5f7590;
          font-size: 9px;
          white-space: nowrap;
        }

        .di-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .di-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .di-entity {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(71,116,166,.13);
          border-radius: 9px;
          background: #071526;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          cursor: pointer;
          transition: .18s ease;
        }

        .di-entity:hover {
          transform: translateY(-1px);
          border-color: rgba(56,189,248,.35);
          background: #0a1c31;
        }

        .di-entity-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          color: #38bdf8;
          border-radius: 9px;
          background: rgba(14,165,233,.08);
        }

        .di-entity-main {
          min-width: 0;
          flex: 1;
        }

        .di-entity-main strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #dbeafe;
          font-size: 11px;
        }

        .di-entity-main span {
          display: block;
          margin-top: 3px;
          color: #526b86;
          font-size: 9px;
        }

        .di-risk {
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .di-risk.high {
          color: #fca5a5;
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.2);
        }

        .di-risk.medium {
          color: #fcd34d;
          background: rgba(245,158,11,.11);
          border: 1px solid rgba(245,158,11,.18);
        }

        .di-risk.low {
          color: #6ee7b7;
          background: rgba(16,185,129,.1);
          border: 1px solid rgba(16,185,129,.18);
        }

        .di-empty {
          min-height: 180px;
          display: grid;
          place-items: center;
          text-align: center;
          color: #536a84;
        }

        .di-empty svg { color: #2b4967; }

        .di-empty h3 {
          margin: 10px 0 3px;
          color: #94a8bf;
          font-size: 12px;
        }

        .di-empty p {
          margin: 0;
          max-width: 380px;
          font-size: 9px;
          line-height: 1.6;
        }

        .di-context-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
        }

        .di-context {
          padding: 14px;
          border: 1px solid rgba(71,116,166,.14);
          border-radius: 9px;
          background: #071526;
        }

        .di-context svg { color: #38bdf8; }

        .di-context span {
          display: block;
          margin-top: 9px;
          color: #637a94;
          font-size: 9px;
        }

        .di-context strong {
          display: block;
          margin-top: 3px;
          color: #e2e8f0;
          font-size: 19px;
          font-family: "JetBrains Mono", monospace;
        }

        .di-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .di-summary div {
          padding: 11px 13px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #7187a0;
          border: 1px solid rgba(71,116,166,.13);
          border-radius: 8px;
          background: rgba(7,21,38,.65);
          font-size: 10px;
        }

        .di-summary svg { color: #f87171; }
        .di-summary strong { color: #e2e8f0; }

        .di-network-button {
          margin-top: 13px;
          width: 100%;
          height: 40px;
          border: 1px solid rgba(56,189,248,.25);
          border-radius: 8px;
          background: rgba(14,165,233,.08);
          color: #67e8f9;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .di-network-button:hover { background: rgba(14,165,233,.14); }

        .di-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(0,3,10,.76);
          backdrop-filter: blur(7px);
        }

        .di-modal {
          width: min(560px,100%);
          padding: 22px;
          border-radius: 14px;
          background: #071526;
          border: 1px solid rgba(56,189,248,.24);
          box-shadow: 0 30px 100px rgba(0,0,0,.55);
        }

        .di-modal-top {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .di-modal h2 {
          margin: 5px 0 3px;
          color: #f8fafc;
          font-size: 20px;
        }

        .di-modal-id {
          margin: 0;
          color: #627994;
          font-size: 10px;
          word-break: break-all;
        }

        .di-close {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(71,116,166,.2);
          border-radius: 7px;
          color: #8297af;
          background: #0b1c30;
          cursor: pointer;
        }

        .di-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-top: 18px;
        }

        .di-detail {
          padding: 13px;
          border-radius: 8px;
          background: #0a1b2e;
          border: 1px solid rgba(71,116,166,.12);
        }

        .di-detail span {
          display: block;
          color: #526b86;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .di-detail strong {
          display: block;
          margin-top: 6px;
          color: #dbeafe;
          font-size: 15px;
          font-family: "JetBrains Mono", monospace;
        }

        .di-modal-note {
          margin-top: 12px;
          padding: 13px;
          color: #7d94ae;
          background: rgba(14,165,233,.06);
          border: 1px solid rgba(14,165,233,.12);
          border-radius: 8px;
          font-size: 10px;
          line-height: 1.6;
        }

        .di-modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .di-modal-actions button {
          flex: 1;
          height: 38px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        .di-open {
          border: 1px solid rgba(56,189,248,.25);
          color: #fff;
          background: linear-gradient(135deg,#0891b2,#2563eb);
        }

        .di-cancel {
          border: 1px solid rgba(71,116,166,.2);
          color: #94a8bf;
          background: #0a1b2e;
        }

        .di-spin { animation: diSpin 1s linear infinite; }

        @keyframes diSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1050px) {
          .di-navbar { padding: 0 15px; }
          .di-brand { min-width: auto; }
          .di-brand > div:last-child { display: none; }
          .di-stats { grid-template-columns: repeat(2,1fr); }
          .di-columns { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .di-main { width: min(100% - 24px,1380px); padding-top: 20px; }
          .di-navbar { height: 62px; gap: 10px; }
          .di-nav button { padding: 8px; font-size: 0; }
          .di-nav button svg { width: 17px; }
          .di-logout { font-size: 9px; padding: 8px; }
          .di-heading { flex-direction: column; align-items: stretch; }
          .di-heading h1 { font-size: 32px; }
          .di-refresh { width: 100%; }
          .di-stats { grid-template-columns: 1fr 1fr; }
          .di-filters { grid-template-columns: 1fr; }
          .di-result-count { white-space: normal; }
          .di-context-grid { grid-template-columns: 1fr 1fr; }
          .di-summary { grid-template-columns: 1fr; }
        }

        @media (max-width: 430px) {
          .di-stats { grid-template-columns: 1fr; }
          .di-context-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <header className="di-navbar">
        <div className="di-brand" onClick={() => navigate("/dashboard")}>
          <div className="di-brand-icon"><Shield size={22} /></div>
          <div>
            <h2>FraudShield AI</h2>
            <span>Real-Time Transaction Protection</span>
          </div>
        </div>

        <nav className="di-nav">
          <button onClick={() => navigate("/dashboard")}><ShieldCheck size={14} />Dashboard</button>
          <button onClick={() => navigate("/transaction")}><Activity size={14} />Transaction</button>
          <button onClick={() => navigate("/voice-phishing")}><Bell size={14} />Phishing</button>
          <button onClick={() => navigate("/analytics")}><Activity size={14} />Analytics</button>
          <button onClick={() => navigate("/fraud-network")}><Network size={14} />Network</button>
          <button className="active"><Smartphone size={14} />Devices</button>
          <button onClick={() => navigate("/geographic-fraud")}><MapPin size={14} />Geography</button>
          <button onClick={() => navigate("/admin")}>Admin</button>
        </nav>

        <button className="di-logout" onClick={logout}>Logout</button>
      </header>

      <main className="di-main">
        <button className="di-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <section className="di-heading">
          <div>
            <div className="di-kicker"><i /> DEVICE & BENEFICIARY INTELLIGENCE</div>
            <h1>Device Intelligence</h1>
            <p>
              Identify high-risk devices, beneficiaries and connected entities
              across the FraudShield transaction network.
            </p>
          </div>

          <button className="di-refresh" onClick={loadNetwork} disabled={loading}>
            <RefreshCw size={15} className={loading ? "di-spin" : ""} />
            {loading ? "Syncing Intelligence..." : "Refresh Intelligence"}
          </button>
        </section>

        <div className="di-livebar">
          <span>Fraud network intelligence is connected to the live backend.</span>
          <span className="di-live"><b /> LIVE NETWORK</span>
        </div>

        {error && (
          <div className="di-error">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <section className="di-stats">
          <div className="di-stat">
            <div className="di-stat-icon"><Smartphone size={20} /></div>
            <div><span>Total Devices</span><strong>{devices.length}</strong><small>Known network devices</small></div>
          </div>

          <div className="di-stat">
            <div className="di-stat-icon"><CreditCard size={20} /></div>
            <div><span>Beneficiaries</span><strong>{beneficiaries.length}</strong><small>Connected destinations</small></div>
          </div>

          <div className="di-stat">
            <div className="di-stat-icon red"><AlertTriangle size={20} /></div>
            <div><span>High Risk</span><strong>{highRiskDevices + highRiskBeneficiaries}</strong><small>Entities requiring attention</small></div>
          </div>

          <div className="di-stat">
            <div className="di-stat-icon amber"><Network size={20} /></div>
            <div><span>Connections</span><strong>{edges.length}</strong><small>Network relationships</small></div>
          </div>
        </section>

        {loading ? (
          <section className="di-panel">
            <div className="di-empty">
              <div>
                <RefreshCw size={38} className="di-spin" />
                <h3>Loading intelligence...</h3>
                <p>FraudShield is analyzing your fraud-network entities.</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="di-panel">
              <div className="di-panel-head">
                <div>
                  <span className="di-section-label">INVESTIGATION TOOLS</span>
                  <h2>Search Network Entities</h2>
                  <p>Find suspicious devices and beneficiaries quickly.</p>
                </div>
                <Search size={21} className="di-panel-icon" />
              </div>

              <div className="di-filters">
                <label className="di-search">
                  <Search size={15} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search device, beneficiary or identifier..."
                  />
                </label>

                <select
                  className="di-select"
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>

                <span className="di-result-count">
                  Showing {filteredEntities.devices.length} devices · {filteredEntities.beneficiaries.length} beneficiaries
                </span>
              </div>
            </section>

            <section className="di-columns">
              <div className="di-panel">
                <div className="di-panel-head">
                  <div>
                    <span className="di-section-label">DEVICE INTELLIGENCE</span>
                    <h2>Known Devices</h2>
                    <p>Devices connected to your stored transaction network.</p>
                  </div>
                  <Smartphone size={21} className="di-panel-icon" />
                </div>

                {filteredEntities.devices.length === 0 ? (
                  <div className="di-empty">
                    <div>
                      <Smartphone size={35} />
                      <h3>No devices found</h3>
                      <p>Try changing your search or risk filter.</p>
                    </div>
                  </div>
                ) : (
                  <div className="di-list">
                    {filteredEntities.devices.map((device) => {
                      const risk = String(device.risk || "LOW").toUpperCase();
                      const connections = getConnections(device.id);

                      return (
                        <button
                          className="di-entity"
                          key={device.id}
                          onClick={() => openEntity(device, "Device")}
                        >
                          <div className="di-entity-icon"><Smartphone size={17} /></div>
                          <div className="di-entity-main">
                            <strong>{device.label || device.id}</strong>
                            <span>{connections} network connection{connections === 1 ? "" : "s"}</span>
                          </div>
                          <span className={`di-risk ${riskClass(risk)}`}>{risk}</span>
                          <ChevronRight size={14} color="#46617d" />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: 13, color: "#4f6680", fontSize: 9 }}>
                  Medium risk devices: <b style={{ color: "#fbbf24" }}>{mediumRiskDevices}</b>
                  {" · "}
                  High risk devices: <b style={{ color: "#f87171" }}>{highRiskDevices}</b>
                </div>
              </div>

              <div className="di-panel">
                <div className="di-panel-head">
                  <div>
                    <span className="di-section-label">BENEFICIARY INTELLIGENCE</span>
                    <h2>Known Beneficiaries</h2>
                    <p>Beneficiaries connected to your transaction network.</p>
                  </div>
                  <CreditCard size={21} className="di-panel-icon" />
                </div>

                {filteredEntities.beneficiaries.length === 0 ? (
                  <div className="di-empty">
                    <div>
                      <CreditCard size={35} />
                      <h3>No beneficiaries found</h3>
                      <p>Try changing your search or risk filter.</p>
                    </div>
                  </div>
                ) : (
                  <div className="di-list">
                    {filteredEntities.beneficiaries.map((beneficiary) => {
                      const risk = String(beneficiary.risk || "LOW").toUpperCase();
                      const connections = getConnections(beneficiary.id);

                      return (
                        <button
                          className="di-entity"
                          key={beneficiary.id}
                          onClick={() => openEntity(beneficiary, "Beneficiary")}
                        >
                          <div className="di-entity-icon"><CreditCard size={17} /></div>
                          <div className="di-entity-main">
                            <strong>{beneficiary.label || beneficiary.id}</strong>
                            <span>{connections} network connection{connections === 1 ? "" : "s"}</span>
                          </div>
                          <span className={`di-risk ${riskClass(risk)}`}>{risk}</span>
                          <ChevronRight size={14} color="#46617d" />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: 13, color: "#4f6680", fontSize: 9 }}>
                  Medium risk beneficiaries: <b style={{ color: "#fbbf24" }}>{mediumRiskBeneficiaries}</b>
                  {" · "}
                  High risk beneficiaries: <b style={{ color: "#f87171" }}>{highRiskBeneficiaries}</b>
                </div>
              </div>
            </section>

            <section className="di-panel">
              <div className="di-panel-head">
                <div>
                  <span className="di-section-label">NETWORK CONTEXT</span>
                  <h2>Connected Intelligence</h2>
                  <p>See how devices and beneficiaries relate to transactions and locations.</p>
                </div>
                <Network size={21} className="di-panel-icon" />
              </div>

              <div className="di-context-grid">
                <div className="di-context"><Smartphone size={18} /><span>Devices</span><strong>{devices.length}</strong></div>
                <div className="di-context"><CreditCard size={18} /><span>Beneficiaries</span><strong>{beneficiaries.length}</strong></div>
                <div className="di-context"><MapPin size={18} /><span>Locations</span><strong>{locations.length}</strong></div>
                <div className="di-context"><Activity size={18} /><span>Transactions</span><strong>{transactions.length}</strong></div>
              </div>

              <div className="di-summary">
                <div><AlertTriangle size={14} /> High-risk beneficiaries: <strong>{highRiskBeneficiaries}</strong></div>
                <div><Network size={14} /> Total network relationships: <strong>{edges.length}</strong></div>
              </div>

              <button className="di-network-button" onClick={() => navigate("/fraud-network")}>
                Open Full Fraud Network <ChevronRight size={14} />
              </button>
            </section>
          </>
        )}
      </main>

      {selectedEntity && (
        <div className="di-modal-backdrop" onClick={() => setSelectedEntity(null)}>
          <div className="di-modal" onClick={(event) => event.stopPropagation()}>
            <div className="di-modal-top">
              <div>
                <span className="di-section-label">INTELLIGENCE ENTITY</span>
                <h2>{selectedEntity.entityType}</h2>
                <p className="di-modal-id">
                  {selectedEntity.label || selectedEntity.id}
                </p>
              </div>

              <button className="di-close" onClick={() => setSelectedEntity(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="di-detail-grid">
              <div className="di-detail">
                <span>RISK LEVEL</span>
                <strong style={{
                  color:
                    String(selectedEntity.risk || "LOW").toUpperCase() === "HIGH"
                      ? "#f87171"
                      : String(selectedEntity.risk || "LOW").toUpperCase() === "MEDIUM"
                      ? "#fbbf24"
                      : "#34d399"
                }}>
                  {String(selectedEntity.risk || "LOW").toUpperCase()}
                </strong>
              </div>

              <div className="di-detail">
                <span>NETWORK CONNECTIONS</span>
                <strong>{selectedEntity.connections || 0}</strong>
              </div>
            </div>

            <div className="di-modal-note">
              This entity is connected to the FraudShield fraud network.
              Use the full Fraud Network view to investigate related
              transactions, users and locations.
            </div>

            <div className="di-modal-actions">
              <button
                className="di-open"
                onClick={() => {
                  setSelectedEntity(null);
                  navigate("/fraud-network");
                }}
              >
                Open Fraud Network
              </button>
              <button className="di-cancel" onClick={() => setSelectedEntity(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }

export default DeviceBeneficiaryIntelligence;