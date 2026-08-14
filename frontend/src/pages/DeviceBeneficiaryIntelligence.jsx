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

      const response = await axios.get(
        `${API_URL}/api/fraud/network`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const nodes = Array.isArray(network?.nodes)
    ? network.nodes
    : [];

  const edges = Array.isArray(network?.edges)
    ? network.edges
    : [];

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

  const filteredDevices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return devices.filter((device) => {
      const risk =
        String(device.risk || "LOW").toUpperCase();

      const label =
        String(device.label || device.id || "")
          .toLowerCase();

      const matchesSearch =
        !query || label.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [devices, searchTerm, riskFilter]);

  const filteredBeneficiaries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return beneficiaries.filter((beneficiary) => {
      const risk =
        String(beneficiary.risk || "LOW").toUpperCase();

      const label =
        String(
          beneficiary.label ||
            beneficiary.id ||
            ""
        ).toLowerCase();

      const matchesSearch =
        !query || label.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [
    beneficiaries,
    searchTerm,
    riskFilter,
  ]);

  const getConnections = (nodeId) =>
    edges.filter(
      (edge) =>
        edge.source === nodeId ||
        edge.target === nodeId
    ).length;

  const highRiskDevices = devices.filter(
    (device) =>
      String(device.risk || "LOW").toUpperCase() === "HIGH"
  ).length;

  const highRiskBeneficiaries = beneficiaries.filter(
    (beneficiary) =>
      String(beneficiary.risk || "LOW").toUpperCase() === "HIGH"
  ).length;

  const riskClass = (risk) =>
    String(risk || "LOW").toLowerCase();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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

          <button
            className="nav-button"
            onClick={() => navigate("/fraud-network")}
          >
            Fraud Network
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/alerts")}
          >
            <Bell size={16} />
            Alerts
          </button>

          <button
            className="nav-button active"
            onClick={() => navigate("/device-intelligence")}
          >
            <Smartphone size={16} />
            Devices
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        </nav>

        <button className="logout-button" onClick={logout}>
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
              DEVICE & BENEFICIARY INTELLIGENCE
            </div>

            <h1>Device & Beneficiary Intelligence</h1>

            <p>
              Identify new, high-risk and highly connected devices,
              beneficiaries and locations from your fraud network.
            </p>
          </div>

          <button
            className="analyze-button"
            onClick={loadNetwork}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        {error && (
          <div className="dashboard-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className="dashboard-stats">
          <div className="stat-card">
            <Smartphone size={21} />
            <div>
              <span>Devices</span>
              <strong>{devices.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <CreditCard size={21} />
            <div>
              <span>Beneficiaries</span>
              <strong>{beneficiaries.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <AlertTriangle size={21} />
            <div>
              <span>High-Risk Devices</span>
              <strong>{highRiskDevices}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Activity size={21} />
            <div>
              <span>Connections</span>
              <strong>{edges.length}</strong>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="transaction-section">
            <div className="risk-empty">
              <RefreshCw size={42} />
              <h3>Loading intelligence...</h3>
              <p>
                FraudShield is analyzing your fraud-network entities.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* =================================================
                INTELLIGENCE SEARCH / FILTER
            ================================================= */}

            <section
              style={{
                marginBottom: "20px",
                padding: "18px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "white",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: "1 1 280px",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0 12px",
                }}
              >
                <Activity size={16} />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search device or beneficiary..."
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    padding: "11px 9px",
                    fontSize: "12px",
                    background: "transparent",
                  }}
                />
              </div>

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value)
                }
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  background: "white",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">
                  All Risk Levels
                </option>
                <option value="HIGH">
                  High Risk
                </option>
                <option value="MEDIUM">
                  Medium Risk
                </option>
                <option value="LOW">
                  Low Risk
                </option>
              </select>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                Showing {filteredDevices.length} devices and{" "}
                {filteredBeneficiaries.length} beneficiaries
              </span>
            </section>

            <section className="profile-columns">
              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      DEVICE INTELLIGENCE
                    </span>
                    <h2>Known Devices</h2>
                    <p>
                      Devices connected to your stored transaction
                      network.
                    </p>
                  </div>

                  <Smartphone size={29} />
                </div>

                {devices.length === 0 ? (
                  <div className="risk-empty">
                    <Smartphone size={38} />
                    <h3>No device identifiers found</h3>
                    <p>
                      Run transactions containing device identifiers
                      to populate this section.
                    </p>
                  </div>
                ) : (
                  <div className="intelligence-list">
                    {filteredDevices.map((device) => {
                      const risk = String(
                        device.risk || "LOW"
                      ).toUpperCase();

                      return (
                        <div
                          className="intelligence-item"
                          key={device.id}
                          onClick={() =>
                            setSelectedEntity({
                              ...device,
                              entityType: "Device",
                              connections:
                                getConnections(device.id),
                            })
                          }
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          <div className="intelligence-icon">
                            <Smartphone size={20} />
                          </div>

                          <div className="intelligence-content">
                            <strong>
                              {device.label || device.id}
                            </strong>

                            <span>
                              {getConnections(device.id)} network
                              connection
                              {getConnections(device.id) === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>

                          <span
                            className={`risk-pill ${riskClass(
                              risk
                            )}`}
                          >
                            {risk}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      BENEFICIARY INTELLIGENCE
                    </span>
                    <h2>Known Beneficiaries</h2>
                    <p>
                      Beneficiaries connected to your transaction
                      network.
                    </p>
                  </div>

                  <CreditCard size={29} />
                </div>

                {beneficiaries.length === 0 ? (
                  <div className="risk-empty">
                    <CreditCard size={38} />
                    <h3>No beneficiary identifiers found</h3>
                    <p>
                      Run transactions containing beneficiary
                      identifiers to populate this section.
                    </p>
                  </div>
                ) : (
                  <div className="intelligence-list">
                    {filteredBeneficiaries.map((beneficiary) => {
                      const risk = String(
                        beneficiary.risk || "LOW"
                      ).toUpperCase();

                      return (
                        <div
                          className="intelligence-item"
                          key={beneficiary.id}
                          onClick={() =>
                            setSelectedEntity({
                              ...beneficiary,
                              entityType: "Beneficiary",
                              connections:
                                getConnections(beneficiary.id),
                            })
                          }
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          <div className="intelligence-icon">
                            <CreditCard size={20} />
                          </div>

                          <div className="intelligence-content">
                            <strong>
                              {beneficiary.label ||
                                beneficiary.id}
                            </strong>

                            <span>
                              {getConnections(beneficiary.id)} network
                              connection
                              {getConnections(beneficiary.id) === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>

                          <span
                            className={`risk-pill ${riskClass(
                              risk
                            )}`}
                          >
                            {risk}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    NETWORK CONTEXT
                  </span>
                  <h2>Connected Intelligence</h2>
                  <p>
                    See how devices and beneficiaries relate to
                    transactions and locations.
                  </p>
                </div>

                <Activity size={29} />
              </div>

              <div className="network-entities">
                <div className="network-entity-card">
                  <Smartphone size={21} />
                  <span>Devices</span>
                  <strong>{devices.length}</strong>
                </div>

                <div className="network-entity-card">
                  <CreditCard size={21} />
                  <span>Beneficiaries</span>
                  <strong>{beneficiaries.length}</strong>
                </div>

                <div className="network-entity-card">
                  <MapPin size={21} />
                  <span>Locations</span>
                  <strong>{locations.length}</strong>
                </div>

                <div className="network-entity-card">
                  <Activity size={21} />
                  <span>Transactions</span>
                  <strong>{transactions.length}</strong>
                </div>
              </div>

              <div className="intelligence-summary">
                <div>
                  <AlertTriangle size={18} />
                  <span>
                    High-risk beneficiaries:{" "}
                    <strong>{highRiskBeneficiaries}</strong>
                  </span>
                </div>

                <div>
                  <Activity size={18} />
                  <span>
                    Total network relationships:{" "}
                    <strong>{edges.length}</strong>
                  </span>
                </div>
              </div>

              <button
                className="analyze-button"
                onClick={() => navigate("/fraud-network")}
                style={{ marginTop: "20px" }}
              >
                Open Full Fraud Network
              </button>
            </section>
          </>
        )}
        {/* =================================================
            ENTITY DETAILS
        ================================================= */}

        {selectedEntity && (
          <div
            onClick={() => setSelectedEntity(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "min(560px, 100%)",
                background: "white",
                borderRadius: "14px",
                padding: "24px",
                boxShadow:
                  "0 25px 70px rgba(0,0,0,.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#2563eb",
                      fontSize: "9px",
                      fontWeight: 900,
                      letterSpacing: "1.5px",
                    }}
                  >
                    INTELLIGENCE ENTITY
                  </span>

                  <h2
                    style={{
                      margin: "6px 0 4px",
                    }}
                  >
                    {selectedEntity.entityType}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "12px",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedEntity.label ||
                      selectedEntity.id}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedEntity(null)
                  }
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "9px",
                    padding: "15px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    RISK LEVEL
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    {String(
                      selectedEntity.risk ||
                        "LOW"
                    ).toUpperCase()}
                  </strong>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "9px",
                    padding: "15px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    NETWORK CONNECTIONS
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    {selectedEntity.connections ||
                      0}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "9px",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                This entity is connected to the
                FraudShield fraud network. Use the
                full Fraud Network view to investigate
                related transactions, users and
                locations.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "18px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="analyze-button"
                  onClick={() => {
                    setSelectedEntity(null);
                    navigate("/fraud-network");
                  }}
                >
                  Open Fraud Network
                </button>

                <button
                  onClick={() =>
                    setSelectedEntity(null)
                  }
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "white",
                    borderRadius: "7px",
                    padding: "9px 13px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default DeviceBeneficiaryIntelligence;