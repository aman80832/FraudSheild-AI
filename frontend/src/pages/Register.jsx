import "./Register.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    // ==============================
    // FRONTEND VALIDATION
    // ==============================

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError(
        "Please accept the terms before creating your account."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Registration failed (${response.status})`
        );
      }

      // ==============================
      // SAVE AUTH SESSION
      // ==============================

      if (data.access_token) {
        localStorage.setItem(
          "access_token",
          data.access_token
        );
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setSuccess(
        "Account created successfully. Redirecting..."
      );

      // ==============================
      // GO TO DASHBOARD
      // ==============================

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 700);

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-wrapper">

        {/* BACK */}
        <Link
          to="/login"
          className="register-back"
        >
          <ArrowLeft size={15} />
          Back to Login
        </Link>

        {/* CARD */}
        <div className="register-card">

          {/* LOGO */}
          <div className="register-logo">
            <Shield size={27} />
          </div>

          <div className="register-brand">
            <span>FRAUDSHIELD AI</span>
            <small>SECURE FRAUD INTELLIGENCE</small>
          </div>

          <h1>
            Create your account
          </h1>

          <p className="register-subtitle">
            Join FraudShield AI and protect transactions
            with real-time fraud intelligence.
          </p>

          {/* ERROR */}
          {error && (
            <div className="register-message error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="register-message success">
              <CheckCircle size={17} />
              <span>{success}</span>
            </div>
          )}

          {/* FORM */}
          <form
            className="register-form"
            onSubmit={submitRegister}
          >

            {/* NAME */}
            <div className="register-field">
              <label htmlFor="register-name">
                Full Name
              </label>

              <div className="register-input">
                <User size={17} />

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="register-field">
              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="register-input">
                <Mail size={17} />

                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="register-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="register-input">
                <Lock size={17} />

                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="register-field">
              <label htmlFor="register-confirm">
                Confirm Password
              </label>

              <div className="register-input">
                <Lock size={17} />

                <input
                  id="register-confirm"
                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowConfirm(
                      (previous) => !previous
                    )
                  }
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* TERMS */}
            <label className="register-terms">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) =>
                  setAgree(event.target.checked)
                }
                disabled={loading}
              />

              <span>
                I agree to the FraudShield AI terms
                and acknowledge that the platform
                handles sensitive financial data.
              </span>
            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="register-spinner"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield size={17} />
                  Create Secure Account
                </>
              )}
            </button>

          </form>

          {/* LOGIN */}
          <div className="register-login">
            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in to FraudShield
            </Link>
          </div>

        </div>

        {/* SECURITY FOOTER */}
        <div className="register-security">
          <Lock size={12} />
          Secure registration · JWT authentication ·
          FraudShield AI
        </div>

      </div>

    </div>
  );
}

export default Register;