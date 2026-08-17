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
  Network,
  Bell,
  Smartphone,
  Search,
  X,
  ExternalLink,
  Navigation,
  Crosshair,
  Globe2,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

function GeographicFraud() {
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const token = localStorage.getItem("access_token");

  // =====================================================
  // LOAD GEOGRAPHIC INTELLIGENCE
  // =====================================================

  const loadData = async () => {
    try {
      setError("");

      if (network) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!token) {
        setError(
          "Please login before viewing geographic intelligence."
        );
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // DATA
  // =====================================================

  const nodes = Array.isArray(network?.nodes)
    ? network.nodes
    : [];

  const edges = Array.isArray(network?.edges)
    ? network.edges
    : [];

  const locations = useMemo(
    () =>
      nodes.filter(
        (node) => node.type === "location"
      ),
    [nodes]
  );

  const transactions = useMemo(
    () =>
      nodes.filter(
        (node) => node.type === "transaction"
      ),
    [nodes]
  );

  const devices = useMemo(
    () =>
      nodes.filter(
        (node) => node.type === "device"
      ),
    [nodes]
  );

  const beneficiaries = useMemo(
    () =>
      nodes.filter(
        (node) => node.type === "beneficiary"
      ),
    [nodes]
  );

  const getConnections = (nodeId) =>
    edges.filter(
      (edge) =>
        edge.source === nodeId ||
        edge.target === nodeId ||
        edge.from === nodeId ||
        edge.to === nodeId
    ).length;

  const highRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() ===
      "HIGH"
  );

  const mediumRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() ===
      "MEDIUM"
  );

  const lowRiskLocations = locations.filter(
    (location) =>
      String(location.risk || "LOW").toUpperCase() ===
      "LOW"
  );

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return locations.filter((location) => {
      const risk = String(
        location.risk || "LOW"
      ).toUpperCase();

      const label = String(
        location.label ||
          location.id ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        label.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        risk === riskFilter;

      return (
        matchesSearch &&
        matchesRisk
      );
    });
  }, [
    locations,
    searchTerm,
    riskFilter,
  ]);

  const totalLocationConnections =
    locations.reduce(
      (total, location) =>
        total +
        getConnections(location.id),
      0
    );

  const totalEntities = nodes.length;
  const suspiciousEdges = edges.filter(
    (edge) =>
      edge.suspicious === true ||
      edge.risk === "HIGH" ||
      edge.is_suspicious === true
  ).length;

  // =====================================================
  // HELPERS
  // =====================================================

  const riskClass = (risk) =>
    String(
      risk || "LOW"
    ).toLowerCase();

  const riskColor = (risk) => {
    const value = String(
      risk || "LOW"
    ).toUpperCase();

    if (value === "HIGH")
      return "#ef4444";

    if (value === "MEDIUM")
      return "#f59e0b";

    return "#10b981";
  };

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const selectLocation = (location) => {
    setSelectedLocation({
      ...location,
      connections:
        getConnections(location.id),
    });
  };

  // =====================================================
  // NAV ITEM
  // =====================================================

  const NavButton = ({
    icon: Icon,
    label,
    path,
    active = false,
  }) => (
    <button
      className={`geo-nav-button ${
        active ? "active" : ""
      }`}
      onClick={() => navigate(path)}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );

  // =====================================================
  // RISK BADGE
  // =====================================================

  const RiskBadge = ({ risk }) => {
    const value = String(
      risk || "LOW"
    ).toUpperCase();

    return (
      <span
        className={`geo-risk-badge ${riskClass(
          value
        )}`}
      >
        <span />
        {value}
      </span>
    );
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="geo-page">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="geo-navbar">

        <div
          className="geo-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="geo-brand-icon">
            <Shield size={21} />
          </div>

          <div>
            <strong>FraudShield AI</strong>
            <span>
              REAL-TIME FRAUD INTELLIGENCE
            </span>
          </div>
        </div>

        <nav className="geo-nav">

          <NavButton
            icon={ShieldCheck}
            label="Dashboard"
            path="/dashboard"
          />

          <NavButton
            icon={Activity}
            label="Transactions"
            path="/transaction"
          />

          <NavButton
            icon={Activity}
            label="Voice AI"
            path="/voice-phishing"
          />

          <NavButton
            icon={Activity}
            label="Analytics"
            path="/analytics"
          />

          <NavButton
            icon={Network}
            label="Network"
            path="/fraud-network"
          />

          <NavButton
            icon={MapPin}
            label="Geography"
            path="/geographic-fraud"
            active
          />

          <NavButton
            icon={Shield}
            label="Admin"
            path="/admin"
          />

        </nav>

        <div className="geo-nav-actions">

          <button
            className="geo-icon-button"
            onClick={() =>
              navigate("/alerts")
            }
            title="Fraud Alerts"
          >
            <Bell size={17} />
          </button>

          <button
            className="geo-logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="geo-main">

        {/* BACK */}
        <button
          className="geo-back"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>


        {/* =================================================
            HERO
        ================================================= */}

        <section className="geo-hero">

          <div>

            <div className="geo-kicker">
              <span />
              GEOGRAPHIC FRAUD INTELLIGENCE
            </div>

            <h1>
              Geographic
              <span> Intelligence</span>
            </h1>

            <p>
              Investigate suspicious transaction
              locations and discover geographic
              fraud patterns across the network.
            </p>

          </div>

          <button
            className="geo-refresh"
            onClick={loadData}
            disabled={
              loading || refreshing
            }
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "geo-spin"
                  : ""
              }
            />

            {refreshing
              ? "Syncing Intelligence..."
              : "Sync Intelligence"}
          </button>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="geo-error">
            <AlertTriangle size={17} />

            <div>
              <strong>
                Intelligence service error
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}


        {/* =================================================
            LIVE STATUS
        ================================================= */}

        <div className="geo-status-row">

          <div className="geo-live">
            <span />
            LIVE GEOGRAPHIC MONITORING
          </div>

          <div className="geo-updated">
            {loading
              ? "Synchronizing..."
              : `${locations.length} locations indexed`}
          </div>

        </div>


        {/* =================================================
            KPI CARDS
        ================================================= */}

        <section className="geo-kpis">

          <div className="geo-kpi">

            <div className="geo-kpi-icon blue">
              <MapPin size={19} />
            </div>

            <div>
              <span>LOCATIONS</span>
              <strong>
                {locations.length}
              </strong>
              <small>
                Geographic entities
              </small>
            </div>

          </div>


          <div className="geo-kpi">

            <div className="geo-kpi-icon red">
              <AlertTriangle size={19} />
            </div>

            <div>
              <span>HIGH RISK</span>
              <strong className="danger">
                {highRiskLocations.length}
              </strong>
              <small>
                Require investigation
              </small>
            </div>

          </div>


          <div className="geo-kpi">

            <div className="geo-kpi-icon amber">
              <Activity size={19} />
            </div>

            <div>
              <span>MEDIUM RISK</span>
              <strong>
                {mediumRiskLocations.length}
              </strong>
              <small>
                Monitor activity
              </small>
            </div>

          </div>


          <div className="geo-kpi">

            <div className="geo-kpi-icon cyan">
              <Network size={19} />
            </div>

            <div>
              <span>CONNECTIONS</span>
              <strong>
                {totalLocationConnections}
              </strong>
              <small>
                Network relationships
              </small>
            </div>

          </div>

        </section>


        {/* =================================================
            RISK OVERVIEW
        ================================================= */}

        <section className="geo-overview-grid">

          <div className="geo-panel">

            <div className="geo-panel-heading">

              <div>
                <span>
                  RISK OVERVIEW
                </span>

                <h2>
                  Geographic Risk Distribution
                </h2>
              </div>

              <Globe2 size={21} />

            </div>

            <div className="geo-risk-bars">

              <div className="geo-risk-row">

                <div>
                  <span className="risk-dot high" />
                  High Risk
                  <strong>
                    {highRiskLocations.length}
                  </strong>
                </div>

                <div className="geo-progress">
                  <span
                    className="high"
                    style={{
                      width: `${
                        locations.length
                          ? (highRiskLocations.length /
                              locations.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

              </div>


              <div className="geo-risk-row">

                <div>
                  <span className="risk-dot medium" />
                  Medium Risk
                  <strong>
                    {mediumRiskLocations.length}
                  </strong>
                </div>

                <div className="geo-progress">
                  <span
                    className="medium"
                    style={{
                      width: `${
                        locations.length
                          ? (mediumRiskLocations.length /
                              locations.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

              </div>


              <div className="geo-risk-row">

                <div>
                  <span className="risk-dot low" />
                  Low Risk
                  <strong>
                    {lowRiskLocations.length}
                  </strong>
                </div>

                <div className="geo-progress">
                  <span
                    className="low"
                    style={{
                      width: `${
                        locations.length
                          ? (lowRiskLocations.length /
                              locations.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>


          <div className="geo-panel">

            <div className="geo-panel-heading">

              <div>
                <span>
                  NETWORK TELEMETRY
                </span>

                <h2>
                  Intelligence Coverage
                </h2>
              </div>

              <Crosshair size={21} />

            </div>

            <div className="geo-coverage-grid">

              <div>
                <span>ENTITIES</span>
                <strong>
                  {totalEntities}
                </strong>
              </div>

              <div>
                <span>TRANSACTIONS</span>
                <strong>
                  {transactions.length}
                </strong>
              </div>

              <div>
                <span>DEVICES</span>
                <strong>
                  {devices.length}
                </strong>
              </div>

              <div>
                <span>BENEFICIARIES</span>
                <strong>
                  {beneficiaries.length}
                </strong>
              </div>

              <div>
                <span>NETWORK EDGES</span>
                <strong>
                  {edges.length}
                </strong>
              </div>

              <div>
                <span>SUSPICIOUS</span>
                <strong className="danger">
                  {suspiciousEdges}
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            SEARCH
        ================================================= */}

        {!loading && !error && (
          <section className="geo-search-panel">

            <div className="geo-search-heading">

              <div>
                <span>
                  INVESTIGATION TOOLS
                </span>

                <h2>
                  Search Geographic Entities
                </h2>

                <p>
                  Find suspicious locations
                  and investigate their network
                  relationships.
                </p>
              </div>

              <Search size={22} />

            </div>

            <div className="geo-search-controls">

              <div className="geo-search-box">

                <Search size={15} />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search location, ID or city..."
                />

                {searchTerm && (
                  <button
                    onClick={() =>
                      setSearchTerm("")
                    }
                  >
                    <X size={13} />
                  </button>
                )}

              </div>


              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value
                  )
                }
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


              <div className="geo-result-count">
                Showing{" "}
                <strong>
                  {filteredLocations.length}
                </strong>{" "}
                / {locations.length}
              </div>

            </div>

          </section>
        )}


        {/* =================================================
            LOCATIONS
        ================================================= */}

        <section className="geo-panel locations-panel">

          <div className="geo-panel-heading">

            <div>
              <span>
                LOCATION RISK INTELLIGENCE
              </span>

              <h2>
                Observed Locations
              </h2>

              <p>
                Geographic entities connected
                to your fraud intelligence network.
              </p>
            </div>

            <MapPin size={23} />

          </div>


          {loading ? (

            <div className="geo-empty">

              <RefreshCw
                size={34}
                className="geo-spin"
              />

              <h3>
                Loading geographic intelligence
              </h3>

              <p>
                FraudShield is analyzing
                location relationships.
              </p>

            </div>

          ) : locations.length === 0 ? (

            <div className="geo-empty">

              <MapPin size={35} />

              <h3>
                No location data found
              </h3>

              <p>
                Run transactions containing
                location data to populate
                geographic intelligence.
              </p>

            </div>

          ) : filteredLocations.length === 0 ? (

            <div className="geo-empty">

              <Search size={34} />

              <h3>
                No matching locations
              </h3>

              <p>
                Try changing your search
                or risk filter.
              </p>

            </div>

          ) : (

            <div className="geo-location-grid">

              {filteredLocations.map(
                (location, index) => {

                  const risk =
                    String(
                      location.risk ||
                        "LOW"
                    ).toUpperCase();

                  const connections =
                    getConnections(
                      location.id
                    );

                  return (
                    <button
                      className={`geo-location-card ${riskClass(
                        risk
                      )}`}
                      key={
                        location.id ||
                        index
                      }
                      onClick={() =>
                        selectLocation(
                          location
                        )
                      }
                    >

                      <div className="geo-location-top">

                        <div
                          className="geo-location-icon"
                          style={{
                            color:
                              riskColor(
                                risk
                              ),
                            background:
                              `${riskColor(
                                risk
                              )}14`,
                          }}
                        >
                          <MapPin size={18} />
                        </div>

                        <RiskBadge
                          risk={risk}
                        />

                      </div>


                      <div className="geo-location-info">

                        <strong>
                          {location.label ||
                            location.id}
                        </strong>

                        <span>
                          Geographic entity
                        </span>

                      </div>


                      <div className="geo-location-footer">

                        <span>
                          <Network
                            size={12}
                          />
                          {connections}{" "}
                          connection
                          {connections !== 1
                            ? "s"
                            : ""}
                        </span>

                        <ExternalLink
                          size={13}
                        />

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          )}

        </section>


        {/* =================================================
            HIGH RISK + SIGNALS
        ================================================= */}

        {!loading &&
          !error && (
            <section className="geo-two-column">

              <div className="geo-panel">

                <div className="geo-panel-heading">

                  <div>
                    <span className="danger-label">
                      HIGH-RISK GEOGRAPHY
                    </span>

                    <h2>
                      Locations Requiring Attention
                    </h2>
                  </div>

                  <AlertTriangle
                    size={21}
                  />

                </div>


                {highRiskLocations.length ===
                0 ? (

                  <div className="geo-safe-state">

                    <ShieldCheck
                      size={30}
                    />

                    <strong>
                      No high-risk locations
                    </strong>

                    <span>
                      Geographic intelligence
                      currently shows no
                      high-risk locations.
                    </span>

                  </div>

                ) : (

                  <div className="geo-mini-list">

                    {highRiskLocations.map(
                      (location, index) => (

                        <button
                          key={
                            location.id ||
                            index
                          }
                          onClick={() =>
                            selectLocation(
                              location
                            )
                          }
                        >

                          <div className="mini-risk-icon">
                            <AlertTriangle
                              size={15}
                            />
                          </div>

                          <div>
                            <strong>
                              {location.label ||
                                location.id}
                            </strong>

                            <span>
                              {getConnections(
                                location.id
                              )}{" "}
                              network
                              connections
                            </span>
                          </div>

                          <RiskBadge risk="HIGH" />

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>


              <div className="geo-panel">

                <div className="geo-panel-heading">

                  <div>
                    <span>
                      AI EXPLAINABILITY
                    </span>

                    <h2>
                      Geographic Signals
                    </h2>
                  </div>

                  <Activity
                    size={21}
                  />

                </div>


                <div className="geo-signals">

                  <div>
                    <MapPin size={15} />

                    <span>
                      Locations are derived
                      from the FraudShield
                      network data available
                      to your account.
                    </span>
                  </div>


                  <div>
                    <AlertTriangle
                      size={15}
                    />

                    <span>
                      High-risk locations
                      should be investigated
                      alongside transaction
                      and device signals.
                    </span>
                  </div>


                  <div>
                    <Network size={15} />

                    <span>
                      Connected locations
                      can be investigated
                      inside the full Fraud
                      Network.
                    </span>
                  </div>

                </div>

              </div>

            </section>
          )}


        {/* =================================================
            CONTINUE INVESTIGATION
        ================================================= */}

        <section className="geo-investigation">

          <div>

            <span>
              INVESTIGATION WORKFLOW
            </span>

            <h2>
              Continue Investigation
            </h2>

            <p>
              Combine geographic evidence
              with transactions, devices,
              alerts and network relationships.
            </p>

          </div>

          <div className="geo-action-buttons">

            <button
              onClick={() =>
                navigate(
                  "/fraud-network"
                )
              }
            >
              <Network size={16} />
              Fraud Network
            </button>

            <button
              onClick={() =>
                navigate("/alerts")
              }
            >
              <Bell size={16} />
              Fraud Alerts
            </button>

            <button
              onClick={() =>
                navigate(
                  "/device-intelligence"
                )
              }
            >
              <Smartphone size={16} />
              Device Intelligence
            </button>

          </div>

        </section>

      </main>


      {/* =================================================
          LOCATION MODAL
      ================================================= */}

      {selectedLocation && (

        <div
          className="geo-modal-overlay"
          onClick={() =>
            setSelectedLocation(null)
          }
        >

          <div
            className="geo-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="geo-modal-header">

              <div>

                <span>
                  LOCATION INVESTIGATION
                </span>

                <h2>
                  {selectedLocation.label ||
                    selectedLocation.id}
                </h2>

                <p>
                  Geographic entity from the
                  FraudShield intelligence network.
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedLocation(null)
                }
              >
                <X size={17} />
              </button>

            </div>


            <div className="geo-modal-grid">

              <div>
                <span>RISK LEVEL</span>

                <strong
                  style={{
                    color: riskColor(
                      selectedLocation.risk
                    ),
                  }}
                >
                  {String(
                    selectedLocation.risk ||
                      "LOW"
                  ).toUpperCase()}
                </strong>
              </div>


              <div>
                <span>
                  NETWORK CONNECTIONS
                </span>

                <strong>
                  {selectedLocation.connections ||
                    0}
                </strong>
              </div>

            </div>


            <div
              className={`geo-modal-warning ${
                String(
                  selectedLocation.risk ||
                    "LOW"
                ).toUpperCase() ===
                "HIGH"
                  ? "high"
                  : ""
              }`}
            >

              <AlertTriangle size={17} />

              <p>
                Geographic risk should be
                reviewed together with transaction
                amount, device, beneficiary, timing
                and other fraud signals.
              </p>

            </div>


            <div className="geo-modal-actions">

              <button
                onClick={() => {
                  setSelectedLocation(null);
                  navigate(
                    "/fraud-network"
                  );
                }}
              >
                <Network size={15} />
                Open Fraud Network
              </button>

              <button
                onClick={() => {
                  setSelectedLocation(null);
                  navigate("/alerts");
                }}
              >
                <Bell size={15} />
                View Alerts
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .geo-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 70% 0%,
              rgba(14,165,233,.08),
              transparent 28%
            ),
            radial-gradient(
              circle at 10% 30%,
              rgba(37,99,235,.06),
              transparent 25%
            ),
            #020914;

          color: #e2e8f0;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* NAVBAR */

        .geo-navbar {
          height: 70px;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 0 24px;
          border-bottom: 1px solid
            rgba(71,85,105,.25);
          background: rgba(3,10,22,.94);
          backdrop-filter: blur(18px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .geo-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 220px;
          cursor: pointer;
        }

        .geo-brand-icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background:
            linear-gradient(
              145deg,
              #0ea5e9,
              #2563eb
            );
          color: white;
          box-shadow:
            0 0 25px
            rgba(14,165,233,.18);
        }

        .geo-brand strong {
          display: block;
          font-size: 13px;
          color: #f8fafc;
        }

        .geo-brand span {
          display: block;
          margin-top: 2px;
          font-size: 7px;
          color: #64748b;
          letter-spacing: .12em;
        }

        .geo-nav {
          display: flex;
          align-items: center;
          gap: 3px;
          flex: 1;
        }

        .geo-nav-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 11px;
          border: 1px solid transparent;
          background: transparent;
          color: #718096;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s;
        }

        .geo-nav-button:hover {
          color: #cbd5e1;
          background: rgba(30,41,59,.6);
        }

        .geo-nav-button.active {
          color: #67e8f9;
          background: rgba(8,145,178,.13);
          border-color: rgba(34,211,238,.18);
        }

        .geo-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .geo-icon-button,
        .geo-logout {
          border: 1px solid
            rgba(71,85,105,.35);
          background: #07111f;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 7px;
        }

        .geo-icon-button {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .geo-icon-button:hover {
          color: #67e8f9;
          border-color: rgba(34,211,238,.4);
        }

        .geo-logout {
          padding: 9px 15px;
          font-size: 10px;
          font-weight: 800;
        }

        .geo-logout:hover {
          color: #fca5a5;
          border-color: rgba(239,68,68,.4);
        }

        /* MAIN */

        .geo-main {
          max-width: 1400px;
          margin: auto;
          padding: 28px 28px 60px;
        }

        .geo-back {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 24px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 10px;
          cursor: pointer;
        }

        .geo-back:hover {
          color: #67e8f9;
        }

        /* HERO */

        .geo-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 20px;
        }

        .geo-kicker {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
          color: #22d3ee;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .geo-kicker span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 9px #22c55e;
        }

        .geo-hero h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 53px);
          line-height: 1;
          letter-spacing: -.045em;
          color: #f8fafc;
        }

        .geo-hero h1 span {
          color: #3b82f6;
        }

        .geo-hero p {
          max-width: 620px;
          margin: 14px 0 0;
          color: #7890aa;
          font-size: 13px;
          line-height: 1.6;
        }

        .geo-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding: 11px 17px;
          border-radius: 8px;
          border: 1px solid
            rgba(59,130,246,.35);
          background:
            linear-gradient(
              90deg,
              rgba(8,145,178,.85),
              rgba(37,99,235,.9)
            );
          color: white;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .geo-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* STATUS */

        .geo-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 22px 0 10px;
        }

        .geo-live {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #22d3ee;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .geo-live span {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow:
            0 0 9px #22c55e;
        }

        .geo-updated {
          color: #475569;
          font-size: 9px;
        }

        /* KPI */

        .geo-kpis {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 9px;
          margin-bottom: 10px;
        }

        .geo-kpi {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 9px;
          border: 1px solid
            rgba(71,85,105,.27);
          background:
            linear-gradient(
              145deg,
              rgba(10,25,43,.96),
              rgba(5,15,29,.96)
            );
        }

        .geo-kpi-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
        }

        .geo-kpi-icon.blue {
          color: #38bdf8;
          background: rgba(37,99,235,.14);
        }

        .geo-kpi-icon.red {
          color: #f87171;
          background: rgba(239,68,68,.13);
        }

        .geo-kpi-icon.amber {
          color: #fbbf24;
          background: rgba(245,158,11,.13);
        }

        .geo-kpi-icon.cyan {
          color: #22d3ee;
          background: rgba(6,182,212,.13);
        }

        .geo-kpi span {
          display: block;
          color: #52677e;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .geo-kpi strong {
          display: block;
          margin-top: 3px;
          color: #f1f5f9;
          font-size: 20px;
          font-family:
            "JetBrains Mono",
            monospace;
        }

        .geo-kpi strong.danger {
          color: #f87171;
        }

        .geo-kpi small {
          display: block;
          margin-top: 2px;
          color: #475569;
          font-size: 8px;
        }

        /* PANEL */

        .geo-panel {
          padding: 20px;
          border-radius: 10px;
          border: 1px solid
            rgba(71,85,105,.25);
          background:
            linear-gradient(
              145deg,
              rgba(8,21,37,.98),
              rgba(4,13,25,.98)
            );
          box-shadow:
            0 15px 45px
            rgba(0,0,0,.12);
        }

        .geo-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .geo-panel-heading > svg {
          color: #22d3ee;
          opacity: .9;
        }

        .geo-panel-heading span {
          display: block;
          margin-bottom: 5px;
          color: #22d3ee;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .geo-panel-heading span.danger-label {
          color: #f87171;
        }

        .geo-panel-heading h2 {
          margin: 0;
          color: #e2e8f0;
          font-size: 15px;
        }

        .geo-panel-heading p {
          margin: 5px 0 0;
          color: #52677e;
          font-size: 9px;
        }

        /* OVERVIEW */

        .geo-overview-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .geo-risk-bars {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .geo-risk-row > div:first-child {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #94a3b8;
          font-size: 9px;
          margin-bottom: 7px;
        }

        .geo-risk-row strong {
          margin-left: auto;
          color: #cbd5e1;
          font-family:
            "JetBrains Mono",
            monospace;
        }

        .risk-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .risk-dot.high {
          background: #ef4444;
        }

        .risk-dot.medium {
          background: #f59e0b;
        }

        .risk-dot.low {
          background: #10b981;
        }

        .geo-progress {
          height: 5px;
          overflow: hidden;
          border-radius: 99px;
          background: #0c1a2d;
        }

        .geo-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          min-width: 2px;
        }

        .geo-progress span.high {
          background: #ef4444;
        }

        .geo-progress span.medium {
          background: #f59e0b;
        }

        .geo-progress span.low {
          background: #10b981;
        }

        /* COVERAGE */

        .geo-coverage-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .geo-coverage-grid div {
          padding: 12px;
          border: 1px solid
            rgba(71,85,105,.18);
          background: rgba(2,9,20,.55);
          border-radius: 7px;
        }

        .geo-coverage-grid span {
          display: block;
          color: #475569;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .geo-coverage-grid strong {
          display: block;
          margin-top: 5px;
          color: #e2e8f0;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 15px;
        }

        .geo-coverage-grid strong.danger {
          color: #f87171;
        }

        /* SEARCH */

        .geo-search-panel {
          margin-bottom: 10px;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid
            rgba(59,130,246,.18);
          background:
            linear-gradient(
              135deg,
              rgba(8,26,47,.95),
              rgba(5,15,29,.98)
            );
        }

        .geo-search-heading {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .geo-search-heading > div > span {
          color: #22d3ee;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .geo-search-heading h2 {
          margin: 5px 0;
          font-size: 15px;
          color: #e2e8f0;
        }

        .geo-search-heading p {
          margin: 0;
          color: #52677e;
          font-size: 9px;
        }

        .geo-search-heading > svg {
          color: #22d3ee;
        }

        .geo-search-controls {
          display: grid;
          grid-template-columns:
            1fr 180px auto;
          gap: 8px;
          align-items: center;
        }

        .geo-search-box {
          height: 39px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          border: 1px solid
            rgba(71,85,105,.35);
          border-radius: 7px;
          background: #07111f;
        }

        .geo-search-box > svg {
          color: #475569;
        }

        .geo-search-box input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 10px;
        }

        .geo-search-box input::placeholder {
          color: #475569;
        }

        .geo-search-box button {
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
        }

        .geo-search-controls select {
          height: 39px;
          padding: 0 10px;
          border: 1px solid
            rgba(71,85,105,.35);
          border-radius: 7px;
          outline: none;
          background: #07111f;
          color: #94a3b8;
          font-size: 9px;
        }

        .geo-result-count {
          color: #475569;
          font-size: 9px;
          white-space: nowrap;
        }

        .geo-result-count strong {
          color: #22d3ee;
        }

        /* LOCATIONS */

        .locations-panel {
          margin-bottom: 10px;
        }

        .geo-location-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .geo-location-card {
          min-width: 0;
          padding: 14px;
          text-align: left;
          border: 1px solid
            rgba(71,85,105,.25);
          border-radius: 9px;
          background: #071321;
          cursor: pointer;
          transition:
            transform .18s,
            border-color .18s,
            background .18s;
        }

        .geo-location-card:hover {
          transform: translateY(-2px);
          border-color:
            rgba(34,211,238,.35);
          background: #0a1a2d;
        }

        .geo-location-card.high {
          border-left: 2px solid #ef4444;
        }

        .geo-location-card.medium {
          border-left: 2px solid #f59e0b;
        }

        .geo-location-card.low {
          border-left: 2px solid #10b981;
        }

        .geo-location-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .geo-location-icon {
          width: 33px;
          height: 33px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .geo-risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .geo-risk-badge > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .geo-risk-badge.high {
          color: #f87171;
          background: rgba(239,68,68,.1);
        }

        .geo-risk-badge.high > span {
          background: #ef4444;
        }

        .geo-risk-badge.medium {
          color: #fbbf24;
          background: rgba(245,158,11,.1);
        }

        .geo-risk-badge.medium > span {
          background: #f59e0b;
        }

        .geo-risk-badge.low {
          color: #34d399;
          background: rgba(16,185,129,.1);
        }

        .geo-risk-badge.low > span {
          background: #10b981;
        }

        .geo-location-info {
          margin-top: 12px;
        }

        .geo-location-info strong {
          display: block;
          overflow: hidden;
          color: #e2e8f0;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .geo-location-info span {
          display: block;
          margin-top: 3px;
          color: #475569;
          font-size: 8px;
        }

        .geo-location-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 13px;
          padding-top: 10px;
          border-top: 1px solid
            rgba(71,85,105,.18);
          color: #64748b;
          font-size: 8px;
        }

        .geo-location-footer span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .geo-location-footer svg:last-child {
          color: #22d3ee;
        }

        /* TWO COLUMN */

        .geo-two-column {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .geo-mini-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .geo-mini-list button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          text-align: left;
          border: 1px solid
            rgba(71,85,105,.2);
          border-radius: 7px;
          background: #071321;
          color: #cbd5e1;
          cursor: pointer;
        }

        .geo-mini-list button:hover {
          border-color:
            rgba(239,68,68,.35);
        }

        .mini-risk-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          color: #f87171;
          background: rgba(239,68,68,.1);
        }

        .geo-mini-list button > div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .geo-mini-list strong {
          display: block;
          overflow: hidden;
          color: #e2e8f0;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .geo-mini-list strong + span {
          display: block;
          margin-top: 3px;
          color: #475569;
          font-size: 7px;
        }

        .geo-safe-state {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          min-height: 150px;
          text-align: center;
          color: #10b981;
        }

        .geo-safe-state strong {
          margin-top: 8px;
          color: #cbd5e1;
          font-size: 11px;
        }

        .geo-safe-state span {
          max-width: 280px;
          margin-top: 4px;
          color: #475569;
          font-size: 8px;
        }

        .geo-signals {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .geo-signals > div {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px;
          border: 1px solid
            rgba(71,85,105,.18);
          border-radius: 7px;
          background: #071321;
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .geo-signals svg {
          flex-shrink: 0;
          color: #22d3ee;
          margin-top: 1px;
        }

        /* INVESTIGATION */

        .geo-investigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border: 1px solid
            rgba(59,130,246,.2);
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              rgba(8,26,47,.9),
              rgba(4,13,25,.98)
            );
        }

        .geo-investigation > div:first-child > span {
          color: #22d3ee;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .geo-investigation h2 {
          margin: 5px 0;
          color: #e2e8f0;
          font-size: 15px;
        }

        .geo-investigation p {
          margin: 0;
          color: #52677e;
          font-size: 9px;
        }

        .geo-action-buttons {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .geo-action-buttons button,
        .geo-modal-actions button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 12px;
          border: 1px solid
            rgba(71,85,105,.35);
          border-radius: 7px;
          background: #071321;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .geo-action-buttons button:hover,
        .geo-modal-actions button:hover {
          color: #67e8f9;
          border-color:
            rgba(34,211,238,.35);
        }

        /* ERROR */

        .geo-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          margin-bottom: 12px;
          border: 1px solid
            rgba(239,68,68,.3);
          border-radius: 8px;
          background: rgba(127,29,29,.13);
          color: #f87171;
        }

        .geo-error strong {
          display: block;
          font-size: 10px;
        }

        .geo-error p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 9px;
        }

        /* EMPTY */

        .geo-empty {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          color: #22d3ee;
        }

        .geo-empty h3 {
          margin: 10px 0 4px;
          color: #cbd5e1;
          font-size: 12px;
        }

        .geo-empty p {
          margin: 0;
          max-width: 370px;
          color: #475569;
          font-size: 9px;
          line-height: 1.5;
        }

        /* MODAL */

        .geo-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            rgba(0,0,0,.72);
          backdrop-filter: blur(8px);
        }

        .geo-modal {
          width: min(560px, 100%);
          padding: 22px;
          border: 1px solid
            rgba(71,85,105,.35);
          border-radius: 12px;
          background:
            linear-gradient(
              145deg,
              #0a192b,
              #04101e
            );
          box-shadow:
            0 30px 100px
            rgba(0,0,0,.55);
        }

        .geo-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .geo-modal-header > div > span {
          color: #22d3ee;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .geo-modal-header h2 {
          margin: 6px 0;
          color: #f8fafc;
          font-size: 20px;
        }

        .geo-modal-header p {
          margin: 0;
          color: #52677e;
          font-size: 9px;
        }

        .geo-modal-header button {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(71,85,105,.3);
          border-radius: 7px;
          background: #071321;
          color: #64748b;
          cursor: pointer;
        }

        .geo-modal-header button:hover {
          color: #f87171;
        }

        .geo-modal-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
          margin-top: 20px;
        }

        .geo-modal-grid > div {
          padding: 13px;
          border: 1px solid
            rgba(71,85,105,.2);
          border-radius: 7px;
          background: #071321;
        }

        .geo-modal-grid span {
          display: block;
          color: #475569;
          font-size: 7px;
          font-weight: 900;
        }

        .geo-modal-grid strong {
          display: block;
          margin-top: 6px;
          color: #e2e8f0;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 16px;
        }

        .geo-modal-warning {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 10px;
          padding: 13px;
          border-radius: 7px;
          background: rgba(37,99,235,.08);
          border: 1px solid
            rgba(59,130,246,.15);
          color: #60a5fa;
        }

        .geo-modal-warning.high {
          background: rgba(239,68,68,.08);
          border-color:
            rgba(239,68,68,.2);
          color: #f87171;
        }

        .geo-modal-warning p {
          margin: 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.6;
        }

        .geo-modal-actions {
          display: flex;
          gap: 7px;
          margin-top: 16px;
        }

        /* SPIN */

        .geo-spin {
          animation:
            geoSpin 1s linear infinite;
        }

        @keyframes geoSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .geo-navbar {
            gap: 10px;
            padding: 0 14px;
          }

          .geo-brand {
            min-width: 180px;
          }

          .geo-nav-button {
            padding: 8px 7px;
          }

          .geo-nav-button span {
            display: none;
          }

        }

        @media (max-width: 850px) {

          .geo-navbar {
            height: 62px;
          }

          .geo-brand {
            min-width: auto;
          }

          .geo-brand > div:last-child {
            display: none;
          }

          .geo-nav {
            justify-content: center;
          }

          .geo-kpis {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .geo-overview-grid,
          .geo-two-column {
            grid-template-columns: 1fr;
          }

          .geo-location-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .geo-investigation {
            flex-direction: column;
            align-items: flex-start;
          }

        }

        @media (max-width: 600px) {

          .geo-main {
            padding:
              20px 12px 40px;
          }

          .geo-nav {
            display: none;
          }

          .geo-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .geo-refresh {
            width: 100%;
            justify-content: center;
          }

          .geo-kpis {
            grid-template-columns: 1fr;
          }

          .geo-search-controls {
            grid-template-columns: 1fr;
          }

          .geo-location-grid {
            grid-template-columns: 1fr;
          }

          .geo-coverage-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .geo-action-buttons {
            width: 100%;
          }

          .geo-action-buttons button {
            flex: 1;
            justify-content: center;
          }

        }

      `}</style>

    </div>
  );
}

export default GeographicFraud;