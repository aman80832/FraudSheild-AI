import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Activity,
  AlertTriangle,
  Bell,
  Network,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function GeographicFraud() {
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const token = localStorage.getItem("access_token");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login before viewing geographic intelligence.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/fraud/network`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      setNetwork(response.data || {});
    } catch (err) {
      console.error("Geographic intelligence error:", err);

      if (!err.response) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );
      } else if (err.response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError(
          "Your login session is invalid or expired. Please login again."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setError(
          err.response.data?.detail ||
            "Unable to load geographic fraud intelligence."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nodes = Array.isArray(network?.nodes)
    ? network.nodes
    : [];

  const edges = Array.isArray(network?.edges)
    ? network.edges
    : [];

  const locations = useMemo(
    () => nodes.filter((node) => node.type === "location"),
    [nodes]
  );

  const transactions = useMemo(
    () => nodes.filter((node) => node.type === "transaction"),
    [nodes]
  );

  const getConnections = (nodeId) =>
    edges.filter(
      (edge) =>
        edge.source === nodeId ||
        edge.target === nodeId
    ).length;

  const highRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() === "HIGH"
  );

  const mediumRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() === "MEDIUM"
  );

  const lowRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() === "LOW"
  );

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return locations.filter((location) => {
      const risk =
        String(location.risk || "LOW").toUpperCase();

      const label =
        String(
          location.label ||
            location.id ||
            ""
        ).toLowerCase();

      const matchesSearch =
        !query || label.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [locations, searchTerm, riskFilter]);

  const totalLocationConnections = locations.reduce(
    (total, location) =>
      total + getConnections(location.id),
    0
  );

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
            <Network size={16} />
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
            className="nav-button"
            onClick={() => navigate("/device-intelligence")}
          >
            Devices
          </button>

          <button
            className="nav-button active"
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
              GEOGRAPHIC FRAUD INTELLIGENCE
            </div>

            <h1>Geographic Fraud Intelligence</h1>

            <p>
              Analyze transaction locations and identify
              suspicious geographic activity.
            </p>
          </div>

          <button
            className="analyze-button"
            onClick={loadData}
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

        {/* =================================================
            GEOGRAPHIC OVERVIEW
        ================================================= */}

        {!loading && !error && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                LOCATION CONNECTIONS
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "22px",
                }}
              >
                {totalLocationConnections}
              </strong>

              <small
                style={{
                  color: "#94a3b8",
                  fontSize: "10px",
                }}
              >
                Network relationships
              </small>
            </div>

            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <span
                style={{
                  color: "#9f1239",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                HIGH-RISK LOCATIONS
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "22px",
                  color: "#be123c",
                }}
              >
                {highRiskLocations.length}
              </strong>

              <small
                style={{
                  color: "#9f1239",
                  fontSize: "10px",
                }}
              >
                Require investigation
              </small>
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <span
                style={{
                  color: "#1d4ed8",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                LOCATION COVERAGE
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "22px",
                  color: "#1d4ed8",
                }}
              >
                {locations.length}
              </strong>

              <small
                style={{
                  color: "#1d4ed8",
                  fontSize: "10px",
                }}
              >
                Observed locations
              </small>
            </div>
          </section>
        )}

        <section className="dashboard-stats">
          <div className="stat-card">
            <MapPin size={21} />
            <div>
              <span>Locations</span>
              <strong>{locations.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <AlertTriangle size={21} />
            <div>
              <span>High Risk</span>
              <strong>{highRiskLocations.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Activity size={21} />
            <div>
              <span>Medium Risk</span>
              <strong>{mediumRiskLocations.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Network size={21} />
            <div>
              <span>Transactions</span>
              <strong>{transactions.length}</strong>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="transaction-section">
            <div className="risk-empty">
              <RefreshCw size={42} />
              <h3>Loading geographic intelligence...</h3>
              <p>
                FraudShield is analyzing location relationships.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* =================================================
                GEOGRAPHIC SEARCH / FILTER
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
                <MapPin size={16} />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search location..."
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
                Showing {filteredLocations.length} of{" "}
                {locations.length} locations
              </span>
            </section>


            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    LOCATION RISK
                  </span>

                  <h2>Observed Locations</h2>

                  <p>
                    Locations connected to your stored transaction
                    network.
                  </p>
                </div>

                <MapPin size={30} />
              </div>

              {locations.length === 0 ? (
                <div className="risk-empty">
                  <MapPin size={40} />
                  <h3>No location data found</h3>
                  <p>
                    Run transactions containing location data to
                    populate geographic intelligence.
                  </p>
                </div>
              ) : (
                <div className="intelligence-list">
                  {filteredLocations.map((location, index) => {
                    const risk = String(
                      location.risk || "LOW"
                    ).toUpperCase();

                    const connections = getConnections(location.id);

                    return (
                      <div
                        className="intelligence-item"
                        key={location.id || index}
                        onClick={() =>
                          setSelectedLocation({
                            ...location,
                            connections: getConnections(
                              location.id
                            ),
                          })
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <div className="intelligence-icon">
                          <MapPin size={20} />
                        </div>

                        <div className="intelligence-content">
                          <strong>
                            {location.label || location.id}
                          </strong>

                          <span>
                            {connections} network connection
                            {connections === 1 ? "" : "s"}
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
            </section>

            <section className="profile-columns">
              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      HIGH-RISK GEOGRAPHY
                    </span>
                    <h2>High-Risk Locations</h2>
                  </div>

                  <AlertTriangle size={27} />
                </div>

                {highRiskLocations.length === 0 ? (
                  <div className="risk-empty">
                    <ShieldCheck size={38} />
                    <h3>No high-risk locations</h3>
                    <p>
                      No locations are currently marked high risk.
                    </p>
                  </div>
                ) : (
                  <div className="intelligence-list">
                    {highRiskLocations.map((location, index) => (
                      <div
                        className="intelligence-item"
                        key={location.id || index}
                        onClick={() =>
                          setSelectedLocation({
                            ...location,
                            connections: getConnections(
                              location.id
                            ),
                          })
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <div className="intelligence-icon">
                          <AlertTriangle size={20} />
                        </div>

                        <div className="intelligence-content">
                          <strong>
                            {location.label || location.id}
                          </strong>

                          <span>
                            {getConnections(location.id)} connections
                          </span>
                        </div>

                        <span className="risk-pill high">
                          HIGH
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="transaction-section">
                <div className="section-title">
                  <div>
                    <span className="section-kicker">
                      LOCATION PATTERNS
                    </span>
                    <h2>Geographic Signals</h2>
                  </div>

                  <Activity size={27} />
                </div>

                <div className="ai-explanation">
                  <div className="explanation-item">
                    <MapPin size={16} />
                    <span>
                      Locations are derived from the fraud-network
                      data available to your account.
                    </span>
                  </div>

                  <div className="explanation-item">
                    <AlertTriangle size={16} />
                    <span>
                      High-risk locations should be investigated
                      alongside transaction and device signals.
                    </span>
                  </div>

                  <div className="explanation-item">
                    <Network size={16} />
                    <span>
                      Connected locations can be investigated in
                      the full Fraud Network.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="transaction-section">
              <div className="section-title">
                <div>
                  <span className="section-kicker">
                    INVESTIGATION
                  </span>

                  <h2>Continue Investigation</h2>

                  <p>
                    Combine geographic evidence with alerts and
                    network relationships.
                  </p>
                </div>

                <Shield size={30} />
              </div>

              <div className="quick-buttons">
                <button
                  onClick={() => navigate("/fraud-network")}
                >
                  <Network size={18} />
                  Open Fraud Network
                </button>

                <button
                  onClick={() => navigate("/alerts")}
                >
                  <Bell size={18} />
                  Open Fraud Alerts
                </button>

                <button
                  onClick={() => navigate("/device-intelligence")}
                >
                  <Activity size={18} />
                  Device Intelligence
                </button>
              </div>
            </section>
          </>
        )}
        {/* =================================================
            LOCATION INVESTIGATION PANEL
        ================================================= */}

        {selectedLocation && (
          <div
            onClick={() => setSelectedLocation(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.55)",
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
                    LOCATION INVESTIGATION
                  </span>

                  <h2
                    style={{
                      margin: "6px 0",
                    }}
                  >
                    {selectedLocation.label ||
                      selectedLocation.id}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "11px",
                      wordBreak: "break-all",
                    }}
                  >
                    Geographic entity from the FraudShield
                    network.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedLocation(null)
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
                      selectedLocation.risk ||
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
                    {selectedLocation.connections ||
                      0}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "9px",
                  background:
                    String(
                      selectedLocation.risk ||
                        "LOW"
                    ).toUpperCase() === "HIGH"
                      ? "#fff1f2"
                      : "#eff6ff",
                  color:
                    String(
                      selectedLocation.risk ||
                        "LOW"
                    ).toUpperCase() === "HIGH"
                      ? "#9f1239"
                      : "#1e3a8a",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                Geographic risk should be reviewed together
                with transaction amount, device, beneficiary,
                timing and other fraud signals. This page
                uses the location relationships available in
                the FraudShield network.
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
                    setSelectedLocation(null);
                    navigate("/fraud-network");
                  }}
                >
                  <Network size={16} />
                  Open Fraud Network
                </button>

                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    navigate("/alerts");
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "white",
                    borderRadius: "7px",
                    padding: "9px 13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Bell size={16} />
                  View Alerts
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default GeographicFraud;