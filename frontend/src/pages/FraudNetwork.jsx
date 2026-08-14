import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Shield,
  ShieldCheck,
  Network,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  User,
  Smartphone,
  MapPin,
  CreditCard,
  Activity,
  Ban,
  Search,
  X,
  ExternalLink,
} from "lucide-react";

function FraudNetwork() {
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Investigation controls
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedNode, setSelectedNode] = useState(null);

  const loadNetwork = useCallback(async () => {
    try {
      setError("");

      if (!network) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.get(
        "/api/fraud/network",
        {
          timeout: 10000,
        }
      );

      setNetwork(response.data);
    } catch (err) {
      console.error("Fraud Network error:", err);

      if (
        err.code === "ERR_NETWORK" ||
        err.message === "Network Error"
      ) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Redirecting to login..."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load Fraud Network."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [network]);

  useEffect(() => {
    loadNetwork();
  }, []);

  const nodes = network?.nodes || [];
  const edges = network?.edges || [];
  const statistics = network?.statistics || {};

  const nodeCounts = useMemo(() => {
    return nodes.reduce(
      (counts, node) => {
        const type = String(node.type || "").toLowerCase();

        if (type === "device") counts.devices += 1;
        if (type === "beneficiary") counts.beneficiaries += 1;
        if (type === "location") counts.locations += 1;
        if (type === "transaction") counts.transactions += 1;
        if (type === "user") counts.users += 1;

        return counts;
      },
      {
        users: 0,
        transactions: 0,
        devices: 0,
        beneficiaries: 0,
        locations: 0,
      }
    );
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return nodes.filter((node) => {
      const type = String(node.type || "").toUpperCase();
      const risk = String(node.risk || "LOW").toUpperCase();
      const label = String(node.label || "").toLowerCase();

      const matchesSearch =
        !query ||
        label.includes(query) ||
        type.toLowerCase().includes(query) ||
        String(node.id || "").toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" || type === typeFilter;

      const matchesRisk =
        riskFilter === "ALL" || risk === riskFilter;

      return matchesSearch && matchesType && matchesRisk;
    });
  }, [nodes, search, typeFilter, riskFilter]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];

    return edges.filter(
      (edge) =>
        edge.source === selectedNode.id ||
        edge.target === selectedNode.id
    );
  }, [edges, selectedNode]);

  const getNodeIcon = (type, size = 17) => {
    switch (String(type).toLowerCase()) {
      case "user":
        return <User size={size} />;
      case "device":
        return <Smartphone size={size} />;
      case "beneficiary":
        return <CreditCard size={size} />;
      case "location":
        return <MapPin size={size} />;
      case "transaction":
        return <Activity size={size} />;
      default:
        return <Network size={size} />;
    }
  };

  const getRiskClass = (risk) =>
    String(risk || "LOW").toLowerCase();

  const getRiskLabel = (risk) =>
    String(risk || "LOW").toUpperCase();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setRiskFilter("ALL");
  };

  const selectNode = (node) => {
    setSelectedNode(node);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <RefreshCw
            size={38}
            className="network-loading-spin"
          />
          <h2>Building Fraud Network...</h2>
          <p>
            Loading users, transactions, devices,
            beneficiaries and locations.
          </p>
        </div>
      </div>
    );
  }

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

          <button className="nav-button active">
            <Network size={16} />
            Fraud Network
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/geographic-fraud")}
          >
            <MapPin size={16} />
            Geography
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
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
              FRAUD INTELLIGENCE NETWORK
            </div>

            <h1>Fraud Network</h1>

            <p>
              Investigate connections between users,
              transactions, devices, beneficiaries and
              locations.
            </p>
          </div>

          <button
            className="analyze-button"
            onClick={loadNetwork}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "network-loading-spin"
                  : ""
              }
            />
            {refreshing
              ? "Refreshing..."
              : "Refresh Network"}
          </button>
        </section>

        {error && (
          <div className="dashboard-error">
            <AlertTriangle size={18} />
            {error}

            <button
              className="nav-button"
              onClick={() => navigate("/login")}
              style={{ marginLeft: "auto" }}
            >
              Login
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* NETWORK RISK */}
            <section className="network-risk-banner">
              <div>
                <span className="section-kicker">
                  NETWORK RISK
                </span>

                <h2>
                  {getRiskLabel(
                    network?.network_risk
                  )}
                </h2>

                <p>
                  Risk calculated from recent
                  transactions and connected fraud
                  entities.
                </p>
              </div>

              {getRiskLabel(
                network?.network_risk
              ) === "HIGH" ? (
                <AlertTriangle size={42} />
              ) : (
                <Network size={42} />
              )}
            </section>

            {/* STATISTICS */}
            <section className="dashboard-stats">
              <div className="stat-card">
                <Activity size={21} />
                <div>
                  <span>Transactions</span>
                  <strong>
                    {statistics.transactions ??
                      nodeCounts.transactions}
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <Network size={21} />
                <div>
                  <span>Connections</span>
                  <strong>
                    {statistics.connections ??
                      edges.length}
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <AlertTriangle size={21} />
                <div>
                  <span>High Risk</span>
                  <strong>
                    {statistics.high_risk_transactions ??
                      0}
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <Ban size={21} />
                <div>
                  <span>Blocked</span>
                  <strong>
                    {statistics.blocked_transactions ??
                      0}
                  </strong>
                </div>
              </div>
            </section>

            {/* ENTITY SUMMARY */}
            <section className="network-entities">
              <div className="network-entity-card">
                <User size={21} />
                <span>Users</span>
                <strong>{nodeCounts.users}</strong>
              </div>

              <div className="network-entity-card">
                <Activity size={21} />
                <span>Transactions</span>
                <strong>
                  {nodeCounts.transactions}
                </strong>
              </div>

              <div className="network-entity-card">
                <Smartphone size={21} />
                <span>Devices</span>
                <strong>{nodeCounts.devices}</strong>
              </div>

              <div className="network-entity-card">
                <CreditCard size={21} />
                <span>Beneficiaries</span>
                <strong>
                  {nodeCounts.beneficiaries}
                </strong>
              </div>

              <div className="network-entity-card">
                <MapPin size={21} />
                <span>Locations</span>
                <strong>
                  {nodeCounts.locations}
                </strong>
              </div>
            </section>

            {/* INVESTIGATION FILTERS */}
            <section className="transaction-section network-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    INVESTIGATION TOOLS
                  </span>

                  <h2>
                    Search Network Entities
                  </h2>

                  <p>
                    Find suspicious devices,
                    beneficiaries, locations or
                    transactions quickly.
                  </p>
                </div>

                <Search size={27} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(220px, 2fr) repeat(2, minmax(150px, 1fr)) auto",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <label>
                  Search
                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        opacity: 0.6,
                      }}
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search ID, name or location..."
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding:
                          "12px 38px 12px 36px",
                        borderRadius: "8px",
                        border:
                          "1px solid rgba(148,163,184,.25)",
                        background:
                          "rgba(15,23,42,.65)",
                        color: "inherit",
                      }}
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          background: "transparent",
                          border: 0,
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </label>

                <label>
                  Entity Type
                  <select
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      background:
                        "rgba(15,23,42,.65)",
                      color: "inherit",
                    }}
                  >
                    <option value="ALL">
                      All Types
                    </option>
                    <option value="USER">
                      Users
                    </option>
                    <option value="TRANSACTION">
                      Transactions
                    </option>
                    <option value="DEVICE">
                      Devices
                    </option>
                    <option value="BENEFICIARY">
                      Beneficiaries
                    </option>
                    <option value="LOCATION">
                      Locations
                    </option>
                  </select>
                </label>

                <label>
                  Risk
                  <select
                    value={riskFilter}
                    onChange={(e) =>
                      setRiskFilter(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      background:
                        "rgba(15,23,42,.65)",
                      color: "inherit",
                    }}
                  >
                    <option value="ALL">
                      All Risk Levels
                    </option>
                    <option value="HIGH">
                      High
                    </option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="LOW">
                      Low
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  className="nav-button"
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>
            </section>

            {/* CONNECTION GRAPH / ENTITY LIST */}
            <section className="transaction-section network-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    ENTITY RELATIONSHIPS
                  </span>

                  <h2>
                    Fraud Connection Map
                  </h2>

                  <p>
                    Select an entity to inspect its
                    connected relationships.
                  </p>
                </div>

                <Network size={30} />
              </div>

              {filteredNodes.length === 0 ? (
                <div className="risk-empty">
                  <Network size={50} />
                  <h3>
                    {nodes.length === 0
                      ? "No network data yet"
                      : "No matching entities"}
                  </h3>

                  <p>
                    {nodes.length === 0
                      ? "Analyze transactions with device, beneficiary or location identifiers to build the network."
                      : "Try a different search term or clear the filters."}
                  </p>
                </div>
              ) : (
                <div className="network-map">
                  {filteredNodes.map((node) => {
                    const isSelected =
                      selectedNode?.id === node.id;

                    return (
                      <button
                        type="button"
                        className={`network-node ${getRiskClass(
                          node.risk
                        )}`}
                        key={node.id}
                        onClick={() =>
                          selectNode(node)
                        }
                        style={{
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                          outline: isSelected
                            ? "2px solid #22d3ee"
                            : "none",
                        }}
                      >
                        <div className="network-node-icon">
                          {getNodeIcon(node.type)}
                        </div>

                        <div className="network-node-content">
                          <strong>
                            {node.label ||
                              node.id}
                          </strong>

                          <span>
                            {String(
                              node.type ||
                                "ENTITY"
                            ).toUpperCase()}
                          </span>
                        </div>

                        <small>
                          {getRiskLabel(node.risk)}
                        </small>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SELECTED ENTITY INVESTIGATION */}
            {selectedNode && (
              <section className="transaction-section network-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      ENTITY INVESTIGATION
                    </span>

                    <h2>
                      {selectedNode.label ||
                        selectedNode.id}
                    </h2>

                    <p>
                      Inspect relationships connected
                      to this entity.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="nav-button"
                    onClick={() =>
                      setSelectedNode(null)
                    }
                  >
                    <X size={16} />
                    Close
                  </button>
                </div>

                <div
                  className={`network-investigation-card ${getRiskClass(
                    selectedNode.risk
                  )}`}
                >
                  <div>
                    <span>ENTITY TYPE</span>
                    <strong>
                      {String(
                        selectedNode.type ||
                          "ENTITY"
                      ).toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>ENTITY ID</span>
                    <strong>
                      {selectedNode.id}
                    </strong>
                  </div>

                  <div>
                    <span>RISK</span>
                    <strong>
                      {getRiskLabel(
                        selectedNode.risk
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>CONNECTIONS</span>
                    <strong>
                      {selectedConnections.length}
                    </strong>
                  </div>
                </div>

                {selectedConnections.length === 0 ? (
                  <div className="risk-empty">
                    <p>
                      No relationships were found for
                      this entity.
                    </p>
                  </div>
                ) : (
                  <div className="network-edges">
                    {selectedConnections.map(
                      (edge, index) => {
                        const source = nodes.find(
                          (node) =>
                            node.id ===
                            edge.source
                        );

                        const target = nodes.find(
                          (node) =>
                            node.id ===
                            edge.target
                        );

                        const other =
                          edge.source ===
                          selectedNode.id
                            ? target
                            : source;

                        return (
                          <div
                            className="network-edge"
                            key={`${edge.source}-${edge.target}-${index}`}
                          >
                            <div>
                              <strong>
                                {selectedNode.label ||
                                  selectedNode.id}
                              </strong>

                              <span>
                                {selectedNode.type ||
                                  "entity"}
                              </span>
                            </div>

                            <div className="edge-arrow">
                              <ArrowRight size={18} />
                              <small>
                                {String(
                                  edge.relationship ||
                                    "CONNECTED"
                                ).replace(
                                  /_/g,
                                  " "
                                )}
                              </small>
                            </div>

                            <div>
                              <strong>
                                {other?.label ||
                                  (edge.source ===
                                  selectedNode.id
                                    ? edge.target
                                    : edge.source)}
                              </strong>

                              <span>
                                {other?.type ||
                                  "entity"}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ALL RELATIONSHIPS */}
            <section className="transaction-section network-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    DETECTED CONNECTIONS
                  </span>

                  <h2>
                    Network Relationships
                  </h2>

                  <p>
                    All relationships returned by the
                    FraudShield network engine.
                  </p>
                </div>

                <Network size={27} />
              </div>

              {edges.length === 0 ? (
                <div className="risk-empty">
                  <Network size={45} />
                  <h3>
                    No connections detected
                  </h3>

                  <p>
                    Connections will appear after
                    transactions contain network
                    identifiers.
                  </p>
                </div>
              ) : (
                <div className="network-edges">
                  {edges.map((edge, index) => {
                    const source = nodes.find(
                      (node) =>
                        node.id === edge.source
                    );

                    const target = nodes.find(
                      (node) =>
                        node.id === edge.target
                    );

                    return (
                      <div
                        className="network-edge"
                        key={`${edge.source}-${edge.target}-${index}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            source &&
                            selectNode(source)
                          }
                          style={{
                            background:
                              "transparent",
                            border: 0,
                            color: "inherit",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <strong>
                            {source?.label ||
                              edge.source}
                          </strong>

                          <span>
                            {source?.type ||
                              "entity"}
                          </span>
                        </button>

                        <div className="edge-arrow">
                          <ArrowRight size={18} />
                          <small>
                            {String(
                              edge.relationship ||
                                "CONNECTED"
                            ).replace(
                              /_/g,
                              " "
                            )}
                          </small>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            target &&
                            selectNode(target)
                          }
                          style={{
                            background:
                              "transparent",
                            border: 0,
                            color: "inherit",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <strong>
                            {target?.label ||
                              edge.target}
                          </strong>

                          <span>
                            {target?.type ||
                              "entity"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ACTIONS */}
            <section className="transaction-section network-section">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <button
                  className="nav-button"
                  onClick={() =>
                    navigate("/transaction")
                  }
                >
                  <Activity size={16} />
                  Analyze Transaction
                </button>

                <button
                  className="nav-button"
                  onClick={() =>
                    navigate("/geographic-fraud")
                  }
                >
                  <MapPin size={16} />
                  Geographic Intelligence
                </button>

                <button
                  className="nav-button"
                  onClick={() =>
                    navigate("/admin")
                  }
                >
                  <ExternalLink size={16} />
                  Open Analyst Center
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <style>{`
        .network-loading-spin {
          animation: fraudNetworkSpin 1s linear infinite;
        }

        @keyframes fraudNetworkSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .network-node {
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .network-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.18);
        }

        .network-investigation-card {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 18px;
          margin-bottom: 18px;
          border: 1px solid rgba(148,163,184,.2);
          border-radius: 12px;
          background: rgba(15,23,42,.45);
        }

        .network-investigation-card > div {
          min-width: 0;
        }

        .network-investigation-card span {
          display: block;
          font-size: 9px;
          letter-spacing: .08em;
          opacity: .65;
          margin-bottom: 5px;
        }

        .network-investigation-card strong {
          display: block;
          overflow-wrap: anywhere;
        }

        .network-investigation-card.high {
          border-color: rgba(248,113,113,.45);
        }

        .network-investigation-card.medium {
          border-color: rgba(251,191,36,.45);
        }

        .network-investigation-card.low {
          border-color: rgba(45,212,191,.3);
        }

        @media (max-width: 900px) {
          .network-investigation-card {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .network-investigation-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .network-section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default FraudNetwork;