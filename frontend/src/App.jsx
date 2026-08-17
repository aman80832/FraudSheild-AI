import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import Alerts from "./pages/Alerts";
import VoiceAnalyzer from "./pages/VoiceAnalyzer";
import VoicePhishing from "./pages/VoicePhishing";

import FraudAnalytics from "./pages/FraudAnalytics";
import FraudNetwork from "./pages/FraudNetwork";
import GeographicFraud from "./pages/GeographicFraud";

import UserRiskProfile from "./pages/UserRiskProfile";
import DeviceBeneficiaryIntelligence from "./pages/DeviceBeneficiaryIntelligence";

import AdminDashboard from "./pages/AdminDashboard";

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// =====================================================
// PUBLIC ONLY ROUTE
// =====================================================

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />


        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            TRANSACTIONS
        ================================================= */}

        {/* Your current route */}
        <Route
          path="/transaction"
          element={
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          }
        />

        {/* Alias in case your sidebar uses /transactions */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            ALERTS
        ================================================= */}

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            VOICE
        ================================================= */}

        <Route
          path="/voice-analyzer"
          element={
            <ProtectedRoute>
              <VoiceAnalyzer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/voice-phishing"
          element={
            <ProtectedRoute>
              <VoicePhishing />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            ANALYTICS
        ================================================= */}

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <FraudAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Alias */}
        <Route
          path="/fraud-analytics"
          element={
            <ProtectedRoute>
              <FraudAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fraud-network"
          element={
            <ProtectedRoute>
              <FraudNetwork />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geographic-fraud"
          element={
            <ProtectedRoute>
              <GeographicFraud />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-risk"
          element={
            <ProtectedRoute>
              <UserRiskProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/device-intelligence"
          element={
            <ProtectedRoute>
              <DeviceBeneficiaryIntelligence />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;